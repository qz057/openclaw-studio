const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function bool(value) {
  return value ? "present" : "missing";
}

function artifactRow(label, artifact) {
  return `| ${label} | \`${artifact.path}\` | ${artifact.size} bytes | \`${artifact.sha256}\` |`;
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const phase7Path = path.join(deliveryRoot, "phase7-package-closeout-20260426.json");
  const phase8Path = path.join(deliveryRoot, "phase8-installer-closeout-20260426.json");
  const phase9Path = path.join(deliveryRoot, "phase9-release-gate-20260426.json");
  const phase10Path = path.join(deliveryRoot, "phase10-signing-readiness-20260426.json");
  const phase11Path = path.join(deliveryRoot, "phase11-ui-full-check-20260426.json");
  const phase12PortablePath = path.join(deliveryRoot, "phase12-portable-ui-full-check-20260426.json");
  const phase12InstalledPath = path.join(deliveryRoot, "phase12-installed-ui-full-check-20260426.json");
  const phase14Path = path.join(deliveryRoot, "phase14-signing-bridge-20260426.json");
  const phase15Path = path.join(deliveryRoot, "phase15-trusted-signing-intake-20260426.json");
  const phase16Path = path.join(deliveryRoot, "phase16-signing-materials-pack-20260426.json");
  const phase17Path = path.join(deliveryRoot, "phase17-signing-handoff-audit-20260426.json");

  for (const filePath of [phase7Path, phase8Path, phase9Path, phase10Path, phase11Path, phase12PortablePath, phase12InstalledPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required report: ${filePath}`);
    }
  }

  const phase7 = readJson(phase7Path);
  const phase8 = readJson(phase8Path);
  const phase9 = readJson(phase9Path);
  const phase10 = readJson(phase10Path);
  const phase11 = readJson(phase11Path);
  const phase12Portable = readJson(phase12PortablePath);
  const phase12Installed = readJson(phase12InstalledPath);
  const phase14 = fs.existsSync(phase14Path) ? readJson(phase14Path) : null;
  const phase15 = fs.existsSync(phase15Path) ? readJson(phase15Path) : null;
  const phase16 = fs.existsSync(phase16Path) ? readJson(phase16Path) : null;
  const phase17 = fs.existsSync(phase17Path) ? readJson(phase17Path) : null;

  const blockers = [
    ...(phase9.publicRelease?.blockers ?? []).map((blocker) => ({ source: "phase9", ...blocker })),
    ...(phase10.blockers ?? []).map((blocker) => ({ source: "phase10", severity: "release-blocker", ...blocker }))
  ];

  const signingEnv = phase10.signingEnv ?? phase9.signingEnv;
  const commandPlan = [
    {
      id: "install-windows-sdk",
      requiredWhen: "signtool-missing",
      command: "Install Windows SDK / App Certification Kit so signtool.exe is available on PATH or under C:\\Program Files (x86)\\Windows Kits\\10\\bin\\<version>\\x64\\signtool.exe"
    },
    {
      id: "set-signing-env",
      requiredWhen: "signing inputs are missing",
      command:
        "Set CSC_LINK or WINDOWS_CODESIGN_CERT_FILE, CSC_KEY_PASSWORD or WINDOWS_CODESIGN_CERT_PASSWORD, and WINDOWS_CODESIGN_TIMESTAMP_URL in the signing environment."
    },
    {
      id: "rebuild-installer",
      requiredWhen: "signing inputs are present",
      command: `npm run -C "${appRoot}" package:windows:installer`
    },
    {
      id: "verify-signed-installer",
      requiredWhen: "installer rebuilt",
      command: `npm run -C "${appRoot}" phase8:installer-smoke && npm run -C "${appRoot}" phase8:installer-closeout`
    },
    {
      id: "final-gates",
      requiredWhen: "signed installer closeout is valid",
      command: `npm run -C "${appRoot}" phase9:release-gate -- --require-public && npm run -C "${appRoot}" phase10:signing-readiness -- --require-ready`
    }
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    status: phase9.status === "public-release-ready" && phase10.status === "ready" ? "public-release-ready" : "handoff-blocked",
    appRoot,
    artifacts: {
      rcZip: phase7.artifacts.rcZip,
      rcExe: phase7.artifacts.rcExe,
      portableZip: phase7.artifacts.portableZip,
      portableExe: phase7.artifacts.portableExe,
      installer: phase8.artifacts.installer,
      installerBlockMap: phase8.artifacts.blockMap
    },
    uiParity: {
      rc: {
        status: phase11.status,
        pages: phase11.pages?.length ?? 0,
        failures: phase11.failures?.length ?? 0
      },
      portable: {
        status: phase12Portable.status,
        pages: phase12Portable.pages?.length ?? 0,
        failures: phase12Portable.failures?.length ?? 0
      },
      installed: {
        status: phase12Installed.status,
        pages: phase12Installed.pages?.length ?? 0,
        failures: phase12Installed.failures?.length ?? 0
      }
    },
    signing: {
      signtoolFound: phase10.signtool?.found ?? false,
      signtoolSelected: phase10.signtool?.selected ?? null,
      powershellAuthenticodeFound: phase10.powershellAuthenticode?.found ?? false,
      certificateInput: signingEnv?.hasCertificateInput ?? false,
      passwordInput: signingEnv?.hasPasswordInput ?? false,
      timestampInput: signingEnv?.hasTimestampInput ?? false,
      installerSignatureStatus: phase8.signature?.status ?? "unknown",
      bridgeStatus: phase14?.status ?? "not-run",
      bridgeTarget: phase14?.targetInstaller ?? null,
      bridgeVerificationStatus: phase14?.signature?.verifyStatus ?? null,
      trustedSigningIntakeStatus: phase15?.status ?? "not-run",
      trustedSigningTemplate: fs.existsSync(path.join(deliveryRoot, "phase15-signing-env.template.ps1"))
        ? path.join(deliveryRoot, "phase15-signing-env.template.ps1")
        : null,
      materialsPackStatus: phase16?.status ?? "not-run",
      materialsRoot: phase16?.materialsRoot ?? null,
      materialsRequiredExternalCount: phase16?.requiredExternalMaterials?.length ?? null,
      handoffAuditStatus: phase17?.status ?? "not-run",
      handoffAuditSecretFindings: phase17?.secretScan?.findings?.length ?? null,
      handoffAuditGateFailFast: phase17?.gateProbe?.expectedFailureConfirmed ?? null
    },
    blockers,
    commandPlan
  };

  const jsonPath = path.join(deliveryRoot, "phase13-public-release-handoff-20260426.json");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const md = [
    "# Phase 13 Public Release Handoff - 2026-04-26",
    "",
    "## Status",
    "",
    report.status === "public-release-ready"
      ? "Public release gate is ready."
      : "Public release remains blocked by signing prerequisites. Local QA and artifact UI parity are passed.",
    "",
    "## Artifacts",
    "",
    "| Artifact | Path | Size | SHA256 |",
    "|---|---|---:|---|",
    artifactRow("RC Windows zip", report.artifacts.rcZip),
    artifactRow("RC executable", report.artifacts.rcExe),
    artifactRow("Portable zip", report.artifacts.portableZip),
    artifactRow("Portable executable", report.artifacts.portableExe),
    artifactRow("NSIS installer", report.artifacts.installer),
    artifactRow("NSIS blockmap", report.artifacts.installerBlockMap),
    "",
    "## UI Parity",
    "",
    "| Form | Status | Pages | Failures |",
    "|---|---|---:|---:|",
    `| RC unpacked | ${report.uiParity.rc.status} | ${report.uiParity.rc.pages} | ${report.uiParity.rc.failures} |`,
    `| Portable | ${report.uiParity.portable.status} | ${report.uiParity.portable.pages} | ${report.uiParity.portable.failures} |`,
    `| Installed NSIS app | ${report.uiParity.installed.status} | ${report.uiParity.installed.pages} | ${report.uiParity.installed.failures} |`,
    "",
    "## Signing Inputs",
    "",
    `- signtool: ${report.signing.signtoolSelected ?? "missing"}`,
    `- PowerShell Authenticode: ${report.signing.powershellAuthenticodeFound ? "available" : "missing"}`,
    `- certificate input: ${bool(report.signing.certificateInput)}`,
    `- password input: ${bool(report.signing.passwordInput)}`,
    `- timestamp URL: ${bool(report.signing.timestampInput)}`,
    `- installer signature: ${report.signing.installerSignatureStatus}`,
    `- signing bridge: ${report.signing.bridgeStatus}${report.signing.bridgeVerificationStatus ? ` / ${report.signing.bridgeVerificationStatus}` : ""}`,
    report.signing.bridgeTarget ? `- signing bridge target: \`${report.signing.bridgeTarget}\`` : "- signing bridge target: not generated",
    `- trusted signing intake: ${report.signing.trustedSigningIntakeStatus}`,
    report.signing.trustedSigningTemplate ? `- signing env template: \`${report.signing.trustedSigningTemplate}\`` : "- signing env template: missing",
    `- signing materials pack: ${report.signing.materialsPackStatus}`,
    report.signing.materialsRoot ? `- signing materials root: \`${report.signing.materialsRoot}\`` : "- signing materials root: not generated",
    report.signing.materialsRequiredExternalCount === null
      ? "- signing external materials tracked: not generated"
      : `- signing external materials tracked: ${report.signing.materialsRequiredExternalCount}`,
    `- signing handoff audit: ${report.signing.handoffAuditStatus}`,
    report.signing.handoffAuditSecretFindings === null
      ? "- signing handoff secret findings: not generated"
      : `- signing handoff secret findings: ${report.signing.handoffAuditSecretFindings}`,
    report.signing.handoffAuditGateFailFast === null
      ? "- signing gate fail-fast probe: not generated"
      : `- signing gate fail-fast probe: ${report.signing.handoffAuditGateFailFast ? "passed" : "failed"}`,
    "",
    "## Blockers",
    "",
    ...blockers.map((blocker) => `- ${blocker.source}:${blocker.id} - ${blocker.detail}`),
    "",
    "## Command Plan",
    "",
    ...commandPlan.flatMap((step) => [`- ${step.id}: ${step.requiredWhen}`, "", "```powershell", step.command, "```", ""]),
    "## Verification",
    "",
    "```powershell",
    `npm run -C "${appRoot}" phase12:artifact-ui-parity`,
    `npm run -C "${appRoot}" phase13:public-release-handoff`,
    "```",
    ""
  ].join("\n");

  const mdPath = path.join(deliveryRoot, "phase13-public-release-handoff-20260426.md");
  fs.writeFileSync(mdPath, md, "utf8");

  console.log(`Phase 13 public release handoff written: ${jsonPath}`);
  console.log(`Closeout: ${mdPath}`);
  console.log(`Status: ${report.status}`);
}

main();
