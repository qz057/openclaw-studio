const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function resolvePowerShell() {
  for (const candidate of ["pwsh.exe", "powershell.exe"]) {
    const result = spawnSync("where.exe", [candidate], { encoding: "utf8", shell: false });
    if ((result.status ?? 1) === 0) {
      const resolved = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
      if (resolved) {
        return resolved;
      }
    }
  }

  return "powershell.exe";
}

function runPowerShellFile(filePath) {
  const powershell = resolvePowerShell();
  const args = path.basename(powershell).toLowerCase() === "powershell.exe"
    ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", filePath]
    : ["-NoProfile", "-File", filePath];

  return spawnSync(powershell, args, {
    encoding: "utf8",
    shell: false,
    env: process.env
  });
}

function listFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else {
        files.push(entryPath);
      }
    }
  }

  return files.sort();
}

function containsPotentialSecret(content) {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/i,
    /\b[A-Za-z0-9+/]{120,}={0,2}\b/,
    /WINDOWS_CODESIGN_CERT_PASSWORD\s*=\s*['"][^<][^'"]{5,}['"]/i,
    /CSC_KEY_PASSWORD\s*=\s*['"][^<][^'"]{5,}['"]/i,
    /WIN_CSC_KEY_PASSWORD\s*=\s*['"][^<][^'"]{5,}['"]/i
  ];

  return patterns.some((pattern) => pattern.test(content));
}

function stripAnsi(value) {
  return String(value ?? "").replace(/\u001b\[[0-9;]*m/g, "");
}

function main() {
  if (process.platform !== "win32") {
    throw new Error("Phase 17 signing handoff audit must run on Windows.");
  }

  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const materialsRoot = path.join(deliveryRoot, "signing-materials-20260426");
  const phase13Path = path.join(deliveryRoot, "phase13-public-release-handoff-20260426.json");
  const phase15Path = path.join(deliveryRoot, "phase15-trusted-signing-intake-20260426.json");
  const phase16Path = path.join(deliveryRoot, "phase16-signing-materials-pack-20260426.json");
  const gateScript = path.join(materialsRoot, "PUBLIC-RELEASE-GATE-COMMANDS.ps1");
  const privateEnv = path.join(materialsRoot, "SIGNING-ENV.private.ps1");

  const requiredFiles = [
    ".gitignore",
    "CERTIFICATE-REQUEST-DATA.template.json",
    "KEY-CUSTODY-POLICY.template.md",
    "SIGNING-ENV.private.template.ps1",
    "SIGNING-RUNBOOK.md",
    "SIGNING-ACCEPTANCE-CHECKLIST.md",
    "SIGNING-EVIDENCE.template.json",
    "TIMESTAMP-POLICY.json",
    "PUBLIC-RELEASE-GATE-COMMANDS.ps1"
  ].map((name) => path.join(materialsRoot, name));

  const blockers = [];
  const warnings = [];

  for (const filePath of [phase13Path, phase15Path, phase16Path]) {
    if (!fs.existsSync(filePath)) {
      blockers.push({
        id: "upstream-report-missing",
        detail: `Missing upstream signing report: ${filePath}`
      });
    }
  }

  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      blockers.push({
        id: "signing-material-missing",
        detail: `Missing required signing material: ${filePath}`
      });
    }
  }

  const gitignorePath = path.join(materialsRoot, ".gitignore");
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  for (const expected of ["SIGNING-ENV.private.ps1", "*.pfx", "*.p12", "*.key", "*.pem"]) {
    if (!gitignore.includes(expected)) {
      blockers.push({
        id: "private-material-ignore-rule-missing",
        detail: `.gitignore does not include ${expected}`
      });
    }
  }

  const files = listFiles(materialsRoot);
  const scannedFiles = files.filter((filePath) => path.basename(filePath) !== "SIGNING-ENV.private.ps1");
  const secretFindings = [];

  for (const filePath of scannedFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    if (containsPotentialSecret(content)) {
      secretFindings.push(filePath);
    }
  }

  if (secretFindings.length > 0) {
    blockers.push({
      id: "potential-secret-in-materials",
      detail: `Potential secret-like content found in generated materials: ${secretFindings.join(", ")}`
    });
  }

  const privateEnvPresent = fs.existsSync(privateEnv);
  let gateProbe = {
    executed: false,
    expectedFailureConfirmed: false,
    status: null,
    stdout: "",
    stderr: ""
  };

  if (!privateEnvPresent && fs.existsSync(gateScript)) {
    const result = runPowerShellFile(gateScript);
    const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    gateProbe = {
      executed: true,
      expectedFailureConfirmed:
        (result.status ?? 1) !== 0 &&
        combined.includes("Create SIGNING-ENV.private.ps1 from SIGNING-ENV.private.template.ps1"),
      status: result.status ?? null,
      stdout: stripAnsi(result.stdout).trim(),
      stderr: stripAnsi(result.stderr).trim()
    };

    if (!gateProbe.expectedFailureConfirmed) {
      blockers.push({
        id: "gate-wrapper-failfast-not-confirmed",
        detail: "Public release gate wrapper did not fail with the expected missing-private-env message."
      });
    }
  } else if (privateEnvPresent) {
    warnings.push("SIGNING-ENV.private.ps1 is present. It was not scanned or printed to avoid leaking signing secrets.");
  }

  const phase13 = fs.existsSync(phase13Path) ? readJson(phase13Path) : null;
  const phase15 = fs.existsSync(phase15Path) ? readJson(phase15Path) : null;
  const phase16 = fs.existsSync(phase16Path) ? readJson(phase16Path) : null;
  const externalInputs = phase16?.requiredExternalMaterials ?? [];
  const status = blockers.length === 0
    ? privateEnvPresent
      ? "private-signing-input-present-ready-for-public-gate"
      : "external-signing-handoff-ready"
    : "signing-handoff-audit-blocked";

  const report = {
    generatedAt: new Date().toISOString(),
    status,
    appRoot,
    materialsRoot,
    requiredFiles: requiredFiles.map((filePath) => ({
      path: filePath,
      exists: fs.existsSync(filePath),
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : null
    })),
    privateEnv: {
      path: privateEnv,
      present: privateEnvPresent,
      ignoredByMaterialsGitignore: gitignore.includes("SIGNING-ENV.private.ps1")
    },
    secretScan: {
      scannedFiles: scannedFiles.length,
      skippedPrivateEnv: privateEnvPresent,
      findings: secretFindings
    },
    gateProbe,
    upstream: {
      phase13Status: phase13?.status ?? "missing",
      phase15Status: phase15?.status ?? "missing",
      phase16Status: phase16?.status ?? "missing"
    },
    externalInputs,
    warnings,
    blockers
  };

  const reportPath = path.join(deliveryRoot, "phase17-signing-handoff-audit-20260426.json");
  writeJson(reportPath, report);

  const closeoutPath = path.join(deliveryRoot, "phase17-signing-handoff-audit-closeout-20260426.md");
  writeFile(
    closeoutPath,
    [
      "# Phase 17 Signing Handoff Audit Closeout - 2026-04-26",
      "",
      "## Status",
      "",
      status,
      "",
      "## Materials",
      "",
      `- root: \`${materialsRoot}\``,
      `- required files: ${requiredFiles.length}`,
      `- secret scan findings: ${secretFindings.length}`,
      `- private env present: ${privateEnvPresent ? "yes" : "no"}`,
      `- gate fail-fast probe: ${gateProbe.expectedFailureConfirmed ? "passed" : privateEnvPresent ? "skipped-private-env-present" : "failed"}`,
      "",
      "## External Inputs Remaining",
      "",
      ...(externalInputs.length > 0
        ? externalInputs.map((item) => `- ${item.id}: ${item.detail}`)
        : ["- none recorded"]),
      "",
      "## Blockers",
      "",
      ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker.id}: ${blocker.detail}`) : ["- none"]),
      "",
      "## Verification",
      "",
      "```powershell",
      `npm run -C "${appRoot}" phase17:signing-handoff-audit`,
      "```",
      ""
    ].join("\n")
  );

  console.log(`Phase 17 signing handoff audit: ${status}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Closeout: ${closeoutPath}`);

  if (blockers.length > 0) {
    for (const blocker of blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exit(1);
  }
}

main();
