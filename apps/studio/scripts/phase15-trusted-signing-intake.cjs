const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

function runPowerShell(script) {
  const powershell = resolvePowerShell();
  const args = path.basename(powershell).toLowerCase() === "powershell.exe"
    ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]
    : ["-NoProfile", "-Command", script];
  const result = spawnSync(powershell, args, {
    encoding: "utf8",
    shell: false,
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error((result.stderr || result.stdout || `PowerShell exited with code ${result.status ?? 1}`).trim());
  }

  return result.stdout.trim();
}

function psSingle(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function hasEnv(name) {
  return Boolean(process.env[name]);
}

function main() {
  if (process.platform !== "win32") {
    throw new Error("Phase 15 trusted signing intake must run on Windows.");
  }

  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const certFile = process.env.WINDOWS_CODESIGN_CERT_FILE || process.env.WIN_CSC_LINK || process.env.CSC_LINK || "";
  const certThumbprint = process.env.WINDOWS_CODESIGN_CERT_THUMBPRINT || "";
  const certSubject = process.env.WINDOWS_CODESIGN_CERT_SUBJECT || "";
  const timestampUrl = process.env.WINDOWS_CODESIGN_TIMESTAMP_URL || "";
  const hasPasswordInput =
    hasEnv("WINDOWS_CODESIGN_CERT_PASSWORD") ||
    hasEnv("WIN_CSC_KEY_PASSWORD") ||
    hasEnv("CSC_KEY_PASSWORD") ||
    Boolean(certThumbprint || certSubject);

  const ps = `
$ErrorActionPreference = 'Stop'
$certFile = '${psSingle(certFile)}'
$certThumbprint = '${psSingle(certThumbprint)}'
$certSubject = '${psSingle(certSubject)}'
$timestampUrl = '${psSingle(timestampUrl)}'
function Get-CodeSigningCertificates {
  param([string[]]$Roots)
  foreach ($root in $Roots) {
    if (Test-Path $root) {
      Get-ChildItem $root | Where-Object {
        $_.HasPrivateKey -and
        ($_.EnhancedKeyUsageList | Where-Object { $_.FriendlyName -eq 'Code Signing' -or $_.ObjectId -eq '1.3.6.1.5.5.7.3.3' })
      }
    }
  }
}
$storeCandidates = @(Get-CodeSigningCertificates -Roots @('Cert:\\CurrentUser\\My','Cert:\\LocalMachine\\My') | ForEach-Object {
  [pscustomobject]@{
    subject = $_.Subject
    issuer = $_.Issuer
    thumbprint = $_.Thumbprint
    notAfter = $_.NotAfter.ToString('o')
    hasPrivateKey = $_.HasPrivateKey
  }
})
$selected = $null
if ($certThumbprint) {
  $selected = $storeCandidates | Where-Object { $_.thumbprint -eq $certThumbprint } | Select-Object -First 1
} elseif ($certSubject) {
  $selected = $storeCandidates | Where-Object { $_.subject -like "*$certSubject*" } | Sort-Object notAfter -Descending | Select-Object -First 1
}
$certFileExists = if ($certFile) { Test-Path -LiteralPath $certFile } else { $false }
$certFileReadable = $false
$certFileSubject = $null
$certFileThumbprint = $null
$certFileHasCodeSigningEku = $false
if ($certFileExists) {
  try {
    $fileCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile)
    $certFileReadable = $true
    $certFileSubject = $fileCert.Subject
    $certFileThumbprint = $fileCert.Thumbprint
    foreach ($extension in $fileCert.Extensions) {
      if ($extension.Oid.Value -eq '2.5.29.37') {
        $formatted = $extension.Format($false)
        if ($formatted -match '1\\.3\\.6\\.1\\.5\\.5\\.7\\.3\\.3' -or $formatted -match 'Code Signing') {
          $certFileHasCodeSigningEku = $true
        }
      }
    }
  } catch {
    $certFileReadable = $false
  }
}
[pscustomobject]@{
  powershell = $PSVersionTable.PSEdition + ' ' + $PSVersionTable.PSVersion.ToString()
  storeCodeSigningCertCount = @($storeCandidates).Count
  selectedStoreCertificate = $selected
  certFile = if ($certFile) { [pscustomobject]@{
    path = $certFile
    exists = $certFileExists
    readableWithoutPassword = $certFileReadable
    subject = $certFileSubject
    thumbprint = $certFileThumbprint
    hasCodeSigningEku = $certFileHasCodeSigningEku
  }} else { $null }
  timestampUrl = $timestampUrl
} | ConvertTo-Json -Depth 5
`;

  const probe = JSON.parse(runPowerShell(ps));
  const blockers = [];
  const warnings = [];
  const hasCertificateInput = Boolean(certFile || certThumbprint || certSubject);

  if (!hasCertificateInput) {
    blockers.push({
      id: "trusted-certificate-input-missing",
      detail: "Set WINDOWS_CODESIGN_CERT_FILE, WIN_CSC_LINK, CSC_LINK, WINDOWS_CODESIGN_CERT_THUMBPRINT, or WINDOWS_CODESIGN_CERT_SUBJECT."
    });
  }

  if (certFile && !probe.certFile?.exists) {
    blockers.push({
      id: "certificate-file-missing",
      detail: `Certificate file does not exist: ${certFile}`
    });
  }

  if ((certThumbprint || certSubject) && !probe.selectedStoreCertificate) {
    blockers.push({
      id: "certificate-store-match-missing",
      detail: "No matching code-signing certificate with private key was found in CurrentUser/My or LocalMachine/My."
    });
  }

  if (!hasPasswordInput) {
    blockers.push({
      id: "certificate-password-or-store-selector-missing",
      detail: "Set certificate password env var for PFX input, or select an installed certificate by thumbprint/subject."
    });
  }

  if (!timestampUrl) {
    blockers.push({
      id: "timestamp-url-missing",
      detail: "Set WINDOWS_CODESIGN_TIMESTAMP_URL before public signing."
    });
  }

  if (probe.certFile && !probe.certFile.readableWithoutPassword) {
    warnings.push("Certificate file could not be inspected without a password. This is expected for password-protected PFX files.");
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0 ? "trusted-signing-input-ready" : "trusted-signing-input-blocked",
    inputs: {
      certFilePresent: Boolean(certFile),
      certThumbprintPresent: Boolean(certThumbprint),
      certSubjectPresent: Boolean(certSubject),
      passwordInputPresent: hasPasswordInput,
      timestampUrlPresent: Boolean(timestampUrl)
    },
    probe,
    warnings,
    blockers
  };

  fs.mkdirSync(deliveryRoot, { recursive: true });
  const reportPath = path.join(deliveryRoot, "phase15-trusted-signing-intake-20260426.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const templatePath = path.join(deliveryRoot, "phase15-signing-env.template.ps1");
  fs.writeFileSync(
    templatePath,
    [
      "# Fill these values in a private shell. Do not commit real secrets.",
      "# PFX file mode:",
      "$env:WINDOWS_CODESIGN_CERT_FILE = 'C:\\\\path\\\\to\\\\trusted-code-signing-cert.pfx'",
      "$env:WINDOWS_CODESIGN_CERT_PASSWORD = '<certificate-password>'",
      "",
      "# Or installed certificate mode:",
      "# $env:WINDOWS_CODESIGN_CERT_THUMBPRINT = '<thumbprint-from-Cert:\\\\CurrentUser\\\\My>'",
      "# $env:WINDOWS_CODESIGN_CERT_SUBJECT = '<subject-fragment>'",
      "",
      "$env:WINDOWS_CODESIGN_TIMESTAMP_URL = 'https://timestamp.digicert.com'",
      "",
      `npm run -C "${appRoot}" phase15:trusted-signing-intake`,
      `npm run -C "${appRoot}" phase14:signing-bridge -- --require-public`,
      `npm run -C "${appRoot}" phase9:release-gate -- --require-public`,
      `npm run -C "${appRoot}" phase10:signing-readiness -- --require-ready`,
      ""
    ].join("\n"),
    "utf8"
  );

  const closeoutPath = path.join(deliveryRoot, "phase15-trusted-signing-intake-closeout-20260426.md");
  fs.writeFileSync(
    closeoutPath,
    [
      "# Phase 15 Trusted Signing Intake Closeout - 2026-04-26",
      "",
      "## Status",
      "",
      report.status,
      "",
      "## Inputs",
      "",
      `- certificate file input: ${report.inputs.certFilePresent ? "present" : "missing"}`,
      `- certificate thumbprint input: ${report.inputs.certThumbprintPresent ? "present" : "missing"}`,
      `- certificate subject input: ${report.inputs.certSubjectPresent ? "present" : "missing"}`,
      `- password/store selector input: ${report.inputs.passwordInputPresent ? "present" : "missing"}`,
      `- timestamp URL: ${report.inputs.timestampUrlPresent ? "present" : "missing"}`,
      `- store code-signing certificates detected: ${probe.storeCodeSigningCertCount}`,
      "",
      "## Blockers",
      "",
      ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker.id}: ${blocker.detail}`) : ["- none"]),
      "",
      "## Template",
      "",
      `Private signing environment template: \`delivery/phase15-signing-env.template.ps1\``,
      ""
    ].join("\n"),
    "utf8"
  );

  console.log(`Phase 15 trusted signing intake ${report.status}. Report: ${reportPath}`);
  console.log(`Template: ${templatePath}`);
  if (blockers.length > 0) {
    console.log(`Blockers: ${blockers.map((blocker) => blocker.id).join(", ")}`);
  }
}

main();
