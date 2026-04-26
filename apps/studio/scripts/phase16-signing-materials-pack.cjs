const fs = require("node:fs");
const path = require("node:path");

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const materialsRoot = path.join(deliveryRoot, "signing-materials-20260426");
  const phase13Path = path.join(deliveryRoot, "phase13-public-release-handoff-20260426.json");
  const phase15Path = path.join(deliveryRoot, "phase15-trusted-signing-intake-20260426.json");
  const phase14Path = path.join(deliveryRoot, "phase14-signing-bridge-20260426.json");

  const phase13 = fs.existsSync(phase13Path) ? readJson(phase13Path) : null;
  const phase15 = fs.existsSync(phase15Path) ? readJson(phase15Path) : null;
  const phase14 = fs.existsSync(phase14Path) ? readJson(phase14Path) : null;

  const requiredExternalMaterials = [
    {
      id: "legal-publisher-identity",
      owner: "publisher",
      status: "external-required",
      detail: "Legal publisher name exactly as it should appear in Windows signature details."
    },
    {
      id: "organization-validation-record",
      owner: "publisher-ca",
      status: "external-required",
      detail: "CA organization or individual validation record, including verified address, phone, and requester contact."
    },
    {
      id: "trusted-code-signing-certificate",
      owner: "ca",
      status: "external-required",
      detail: "OV/EV code-signing certificate provisioned on compliant hardware token, HSM, cloud key storage, or installed certificate store."
    },
    {
      id: "private-key-access",
      owner: "publisher-security",
      status: "external-secret-required",
      detail: "Token PIN, HSM credential, cloud signing credential, PFX password, or certificate-store private-key access. Do not store this in repo."
    },
    {
      id: "timestamp-authority-url",
      owner: "publisher-release",
      status: "external-required",
      detail: "Trusted timestamp URL such as the timestamp service provided by the selected CA."
    }
  ];

  const generatedMaterials = [
    ".gitignore",
    "CERTIFICATE-REQUEST-DATA.template.json",
    "KEY-CUSTODY-POLICY.template.md",
    "SIGNING-ENV.private.template.ps1",
    "SIGNING-RUNBOOK.md",
    "SIGNING-ACCEPTANCE-CHECKLIST.md",
    "SIGNING-EVIDENCE.template.json",
    "TIMESTAMP-POLICY.json",
    "PUBLIC-RELEASE-GATE-COMMANDS.ps1"
  ];

  const status = requiredExternalMaterials.every((item) => item.status === "ready")
    ? "materials-ready"
    : "materials-pack-ready-external-inputs-required";

  writeJson(path.join(materialsRoot, "CERTIFICATE-REQUEST-DATA.template.json"), {
    publisher: {
      legalName: "<exact legal publisher name>",
      organizationType: "<organization|individual>",
      country: "<country>",
      stateOrProvince: "<state/province>",
      locality: "<city>",
      addressLine1: "<street address>",
      postalCode: "<postal code>",
      phone: "<verified phone>",
      domainOrWebsite: "<publisher website>",
      supportEmail: "<support email>"
    },
    requester: {
      fullName: "<requester full name>",
      role: "<release/signing owner role>",
      email: "<validated requester email>",
      phone: "<validated requester phone>"
    },
    certificate: {
      type: "OV or EV Code Signing",
      keyStorage: "<CA cloud key locker|hardware token|HSM|installed certificate store>",
      targetPlatform: "Windows Authenticode / NSIS installer",
      productName: "OpenClaw Studio",
      appId: "com.openclaw.studio"
    },
    securityContacts: [
      {
        name: "<primary key custodian>",
        role: "<role>",
        contact: "<private contact>"
      },
      {
        name: "<backup key custodian>",
        role: "<role>",
        contact: "<private contact>"
      }
    ]
  });

  writeFile(
    path.join(materialsRoot, ".gitignore"),
    [
      "SIGNING-ENV.private.ps1",
      "*.pfx",
      "*.p12",
      "*.key",
      "*.pem",
      "*.cer.private",
      "*.token",
      "*.secret",
      ""
    ].join("\n")
  );

  writeFile(
    path.join(materialsRoot, "KEY-CUSTODY-POLICY.template.md"),
    [
      "# Code Signing Key Custody Policy",
      "",
      "## Scope",
      "",
      "This policy covers the trusted code-signing key used to sign OpenClaw Studio Windows release artifacts.",
      "",
      "## Requirements",
      "",
      "- Store the private key only in compliant hardware token, HSM, CA cloud key storage, or an approved Windows certificate store with private-key protections.",
      "- Never commit PFX files, PINs, passwords, recovery codes, or cloud signing tokens to this repository.",
      "- Use a separate development self-signed certificate only for local test signing.",
      "- Limit release-signing access to named custodians and record each signing event.",
      "- Timestamp every public release signature.",
      "- Rotate or revoke immediately if the signing credential is exposed.",
      "",
      "## Custodians",
      "",
      "| Name | Role | Access Type | Backup? |",
      "|---|---|---|---|",
      "| <primary custodian> | <role> | <token/HSM/cloud/store> | no |",
      "| <backup custodian> | <role> | <token/HSM/cloud/store> | yes |",
      ""
    ].join("\n")
  );

  writeFile(
    path.join(materialsRoot, "SIGNING-ENV.private.template.ps1"),
    [
      "# Fill in a private shell. Do not commit real secrets.",
      "",
      "# Option A: PFX file input",
      "$env:WINDOWS_CODESIGN_CERT_FILE = 'C:\\\\private\\\\trusted-code-signing-cert.pfx'",
      "$env:WINDOWS_CODESIGN_CERT_PASSWORD = '<private-password>'",
      "",
      "# Option B: installed certificate input",
      "# $env:WINDOWS_CODESIGN_CERT_THUMBPRINT = '<trusted-cert-thumbprint>'",
      "# $env:WINDOWS_CODESIGN_CERT_SUBJECT = '<publisher subject fragment>'",
      "",
      "# Timestamp authority. Prefer the TSA documented by the selected CA.",
      "$env:WINDOWS_CODESIGN_TIMESTAMP_URL = 'https://timestamp.digicert.com'",
      "",
      "# Save a filled private copy as SIGNING-ENV.private.ps1 beside this template.",
      "# Run PUBLIC-RELEASE-GATE-COMMANDS.ps1 after the private copy is complete.",
      ""
    ].join("\n")
  );

  writeFile(
    path.join(materialsRoot, "SIGNING-RUNBOOK.md"),
    [
      "# Signing Runbook",
      "",
      "## Preconditions",
      "",
      "- Phase 12 artifact UI parity has passed.",
      "- Phase 13 handoff exists.",
      "- Trusted code-signing certificate is available through PFX, installed certificate store, token, HSM, or CA cloud key storage.",
      "- Timestamp URL is configured.",
      "",
      "## Commands",
      "",
      "```powershell",
      `npm run -C "${appRoot}" phase15:trusted-signing-intake`,
      `npm run -C "${appRoot}" phase14:signing-bridge -- --require-public`,
      `npm run -C "${appRoot}" phase8:installer-smoke`,
      `npm run -C "${appRoot}" phase8:installer-closeout`,
      `npm run -C "${appRoot}" phase9:release-gate -- --require-public`,
      `npm run -C "${appRoot}" phase10:signing-readiness -- --require-ready`,
      "```",
      "",
      "## Expected Result",
      "",
      "- `phase14` reports `public-signature-valid`.",
      "- `phase9` reports `public-release-ready`.",
      "- `phase10` reports `ready`.",
      "- Installed app UI parity remains passed.",
      ""
    ].join("\n")
  );

  writeFile(
    path.join(materialsRoot, "SIGNING-ACCEPTANCE-CHECKLIST.md"),
    [
      "# Signing Acceptance Checklist",
      "",
      "- [ ] Publisher legal name confirmed.",
      "- [ ] CA organization or individual validation completed.",
      "- [ ] Code-signing certificate issued and accessible.",
      "- [ ] Private key stored in approved protected storage.",
      "- [ ] Timestamp URL configured.",
      "- [ ] `phase15:trusted-signing-intake` passed.",
      "- [ ] `phase14:signing-bridge -- --require-public` passed.",
      "- [ ] Signed installer verifies as `Valid`.",
      "- [ ] Signed installer smoke passed.",
      "- [ ] Installed app UI parity passed.",
      "- [ ] `phase9:release-gate -- --require-public` passed.",
      "- [ ] `phase10:signing-readiness -- --require-ready` passed.",
      ""
    ].join("\n")
  );

  writeJson(path.join(materialsRoot, "SIGNING-EVIDENCE.template.json"), {
    signedAt: "<ISO timestamp>",
    signer: {
      publisher: "<signature publisher name>",
      subject: "<certificate subject>",
      thumbprint: "<certificate thumbprint>",
      issuer: "<certificate issuer>",
      validFrom: "<certificate valid from>",
      validTo: "<certificate valid to>"
    },
    timestamp: {
      url: "<timestamp authority URL>",
      present: false,
      verifiedAt: "<ISO timestamp>"
    },
    artifact: {
      path: "<signed installer path>",
      sha256: "<signed installer SHA256>",
      size: "<signed installer size bytes>"
    },
    verification: {
      authenticodeStatus: "<Valid>",
      phase14Status: "<public-signature-valid>",
      phase8InstallerSmoke: "<passed>",
      phase9ReleaseGate: "<public-release-ready>",
      phase10SigningReadiness: "<ready>"
    }
  });

  writeJson(path.join(materialsRoot, "TIMESTAMP-POLICY.json"), {
    required: true,
    envVar: "WINDOWS_CODESIGN_TIMESTAMP_URL",
    defaultCandidate: "https://timestamp.digicert.com",
    notes: [
      "Use the timestamp authority documented by the selected CA whenever possible.",
      "Public release should not proceed without timestamped Authenticode verification."
    ]
  });

  writeFile(
    path.join(materialsRoot, "PUBLIC-RELEASE-GATE-COMMANDS.ps1"),
    [
      "$ErrorActionPreference = 'Stop'",
      "$privateEnv = Join-Path $PSScriptRoot 'SIGNING-ENV.private.ps1'",
      "if (!(Test-Path -LiteralPath $privateEnv)) {",
      "  throw 'Create SIGNING-ENV.private.ps1 from SIGNING-ENV.private.template.ps1 and fill the real signing inputs first.'",
      "}",
      ". $privateEnv",
      `npm run -C "${appRoot}" phase15:trusted-signing-intake`,
      `npm run -C "${appRoot}" phase14:signing-bridge -- --require-public`,
      `npm run -C "${appRoot}" phase8:installer-smoke`,
      `npm run -C "${appRoot}" phase8:installer-closeout`,
      `npm run -C "${appRoot}" phase9:release-gate -- --require-public`,
      `npm run -C "${appRoot}" phase10:signing-readiness -- --require-ready`,
      ""
    ].join("\n")
  );

  const report = {
    generatedAt: new Date().toISOString(),
    status,
    materialsRoot,
    requiredExternalMaterials,
    generatedMaterials: generatedMaterials.map((name) => path.join(materialsRoot, name)),
    upstream: {
      phase13Status: phase13?.status ?? "missing",
      phase14Status: phase14?.status ?? "missing",
      phase15Status: phase15?.status ?? "missing"
    },
    blockers: requiredExternalMaterials
  };

  writeJson(path.join(deliveryRoot, "phase16-signing-materials-pack-20260426.json"), report);

  writeFile(
    path.join(deliveryRoot, "phase16-signing-materials-pack-closeout-20260426.md"),
    [
      "# Phase 16 Signing Materials Pack Closeout - 2026-04-26",
      "",
      "## Status",
      "",
      status,
      "",
      "## Materials Root",
      "",
      `\`${materialsRoot}\``,
      "",
      "## Generated Materials",
      "",
      ...generatedMaterials.map((name) => `- \`delivery/signing-materials-20260426/${name}\``),
      "",
      "## External Materials Still Required",
      "",
      ...requiredExternalMaterials.map((item) => `- ${item.id}: ${item.detail}`),
      "",
      "## Notes",
      "",
      "- Trusted CA certificate/private-key material cannot be generated locally without CA identity validation.",
      "- Do not store real certificate passwords or token PINs in this repository.",
      ""
    ].join("\n")
  );

  console.log(`Phase 16 signing materials pack generated: ${materialsRoot}`);
  console.log(`Status: ${status}`);
}

main();
