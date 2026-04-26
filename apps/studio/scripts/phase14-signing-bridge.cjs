const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function resolvePowerShell() {
  const candidates = ["pwsh.exe", "powershell.exe"];

  for (const candidate of candidates) {
    const result = spawnSync("where.exe", [candidate], {
      encoding: "utf8",
      shell: false
    });

    if ((result.status ?? 1) === 0) {
      const resolved = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
      if (resolved) {
        return resolved;
      }
    }
  }

  return "powershell.exe";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function runPowerShell(script, env = {}) {
  const powershell = resolvePowerShell();
  const args = path.basename(powershell).toLowerCase() === "powershell.exe"
    ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]
    : ["-NoProfile", "-Command", script];
  const result = spawnSync(powershell, args, {
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      ...env
    }
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
  return String(value).replace(/'/g, "''");
}

function parseArgs(argv) {
  return {
    devSelfSigned: argv.includes("--dev-self-signed") || process.env.OPENCLAW_DEV_SELF_SIGN === "1",
    inPlace: argv.includes("--in-place"),
    requirePublic: argv.includes("--require-public")
  };
}

function main() {
  if (process.platform !== "win32") {
    throw new Error("Phase 14 signing bridge must run on Windows.");
  }

  const args = parseArgs(process.argv.slice(2));
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const installerCloseoutPath = path.join(deliveryRoot, "phase8-installer-closeout-20260426.json");

  if (!fs.existsSync(installerCloseoutPath)) {
    throw new Error(`Missing installer closeout report: ${installerCloseoutPath}`);
  }

  const installerCloseout = readJson(installerCloseoutPath);
  const sourceInstaller = installerCloseout.artifacts?.installer?.path;

  if (!sourceInstaller || !fs.existsSync(sourceInstaller)) {
    throw new Error(`Installer candidate is missing: ${sourceInstaller}`);
  }

  const signedRoot = args.devSelfSigned
    ? path.join(appRoot, ".packaging", "windows-signed-dev", "out")
    : path.join(appRoot, ".packaging", "windows-signed", "out");
  fs.mkdirSync(signedRoot, { recursive: true });

  const targetInstaller = args.inPlace
    ? sourceInstaller
    : path.join(
        signedRoot,
        args.devSelfSigned ? "OpenClaw-Studio-0.1.0-win-x64-setup.dev-signed.exe" : "OpenClaw-Studio-0.1.0-win-x64-setup.signed.exe"
      );

  if (!args.inPlace) {
    fs.copyFileSync(sourceInstaller, targetInstaller);
  }

  const timestampUrl = process.env.WINDOWS_CODESIGN_TIMESTAMP_URL || "";
  const certThumbprint = process.env.WINDOWS_CODESIGN_CERT_THUMBPRINT || "";
  const certSubject = process.env.WINDOWS_CODESIGN_CERT_SUBJECT || "";
  const certFile = process.env.WINDOWS_CODESIGN_CERT_FILE || process.env.WIN_CSC_LINK || process.env.CSC_LINK || "";
  const certPassword = process.env.WINDOWS_CODESIGN_CERT_PASSWORD || process.env.WIN_CSC_KEY_PASSWORD || process.env.CSC_KEY_PASSWORD || "";

  const ps = `
$ErrorActionPreference = 'Stop'
$target = '${psSingle(targetInstaller)}'
$timestampUrl = '${psSingle(timestampUrl)}'
$certThumbprint = '${psSingle(certThumbprint)}'
$certSubject = '${psSingle(certSubject)}'
$certFile = '${psSingle(certFile)}'
$certPassword = '${psSingle(certPassword)}'
$devSelfSigned = ${args.devSelfSigned ? "$true" : "$false"}
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

if ($devSelfSigned) {
  $cert = Get-CodeSigningCertificates -Roots @('Cert:\\CurrentUser\\My') |
    Where-Object { $_.Subject -eq 'CN=OpenClaw Studio Development Code Signing' -and $_.HasPrivateKey } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1
  if (!$cert) {
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject 'CN=OpenClaw Studio Development Code Signing' -CertStoreLocation Cert:\\CurrentUser\\My -KeyExportPolicy Exportable -KeyUsage DigitalSignature -NotAfter (Get-Date).AddYears(2)
  }
} elseif ($certThumbprint) {
  $cert = Get-CodeSigningCertificates -Roots @('Cert:\\CurrentUser\\My','Cert:\\LocalMachine\\My') |
    Where-Object { $_.Thumbprint -eq $certThumbprint -and $_.HasPrivateKey } |
    Select-Object -First 1
} elseif ($certSubject) {
  $cert = Get-CodeSigningCertificates -Roots @('Cert:\\CurrentUser\\My','Cert:\\LocalMachine\\My') |
    Where-Object { $_.Subject -like "*$certSubject*" -and $_.HasPrivateKey } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1
} elseif ($certFile) {
  if (!(Test-Path -LiteralPath $certFile)) { throw "Certificate file not found: $certFile" }
  $flags = [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable
  if ($certPassword) {
    $secure = ConvertTo-SecureString -String $certPassword -AsPlainText -Force
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile, $secure, $flags)
  } else {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile)
  }
} else {
  throw 'No signing certificate input was provided.'
}

if (!$cert) { throw 'No usable code-signing certificate with private key was found.' }

$signParams = @{
  FilePath = $target
  Certificate = $cert
  HashAlgorithm = 'SHA256'
}
if ($timestampUrl) {
  $signParams.TimestampServer = $timestampUrl
}

$signature = Set-AuthenticodeSignature @signParams
$verification = Get-AuthenticodeSignature -FilePath $target
[pscustomobject]@{
  target = $target
  setStatus = [string]$signature.Status
  verifyStatus = [string]$verification.Status
  signerSubject = $verification.SignerCertificate.Subject
  signerThumbprint = $verification.SignerCertificate.Thumbprint
  signerIssuer = $verification.SignerCertificate.Issuer
  signerNotAfter = $verification.SignerCertificate.NotAfter.ToString('o')
  hasTimestamp = [bool]$verification.TimeStamperCertificate
  timestampSubject = if ($verification.TimeStamperCertificate) { $verification.TimeStamperCertificate.Subject } else { $null }
} | ConvertTo-Json -Depth 4
`;

  const output = runPowerShell(ps);
  const signature = JSON.parse(output);
  const stats = fs.statSync(targetInstaller);
  const report = {
    generatedAt: new Date().toISOString(),
    status: signature.signerThumbprint
      ? args.devSelfSigned
        ? "dev-signed-untrusted"
        : signature.verifyStatus === "Valid"
          ? "public-signature-valid"
          : "signed-verification-blocked"
      : "failed",
    mode: args.devSelfSigned ? "dev-self-signed-copy" : args.inPlace ? "public-in-place" : "public-signed-copy",
    sourceInstaller,
    targetInstaller,
    size: stats.size,
    sha256: hashFile(targetInstaller),
    signature,
    publicReady: !args.devSelfSigned && signature.verifyStatus === "Valid" && signature.hasTimestamp,
    blockers: []
  };

  if (args.devSelfSigned) {
    report.blockers.push({
      id: "dev-self-signed-not-public",
      detail: "The generated signature proves the local signing path but is not trusted for public distribution."
    });
  }

  if (!signature.hasTimestamp) {
    report.blockers.push({
      id: "timestamp-missing",
      detail: "No timestamp certificate was attached to the signature."
    });
  }

  if (!report.publicReady && args.requirePublic) {
    report.status = "public-signature-blocked";
  }

  const reportPath = path.join(deliveryRoot, "phase14-signing-bridge-20260426.json");
  writeJson(reportPath, report);

  const closeoutPath = path.join(deliveryRoot, "phase14-signing-bridge-closeout-20260426.md");
  fs.writeFileSync(
    closeoutPath,
    [
      "# Phase 14 Signing Bridge Closeout - 2026-04-26",
      "",
      "## Status",
      "",
      report.status,
      "",
      "## Artifact",
      "",
      "| Artifact | Path | Size | SHA256 |",
      "|---|---|---:|---|",
      `| ${args.devSelfSigned ? "Development signed installer copy" : "Signed installer"} | \`${targetInstaller}\` | ${stats.size} bytes | \`${report.sha256}\` |`,
      "",
      "## Signature",
      "",
      `- Verification status: ${signature.verifyStatus}`,
      `- Signer: ${signature.signerSubject}`,
      `- Thumbprint: ${signature.signerThumbprint}`,
      `- Timestamp attached: ${signature.hasTimestamp ? "yes" : "no"}`,
      "",
      "## Boundaries",
      "",
      args.devSelfSigned
        ? "- This is a development self-signed signature that proves the local signing path. It is not trusted for public distribution."
        : "- This signature was created from provided signing inputs and must pass Phase 9/10 public gates before distribution.",
      "- Public release requires a trusted code-signing certificate and a timestamped `Valid` Authenticode signature.",
      "",
      "## Verification",
      "",
      "```powershell",
      `npm run -C "${appRoot}" phase14:signing-bridge -- --dev-self-signed`,
      "```",
      ""
    ].join("\n"),
    "utf8"
  );

  console.log(`Phase 14 signing bridge report: ${reportPath}`);
  console.log(`Closeout: ${closeoutPath}`);
  console.log(`Status: ${report.status}`);
  console.log(`Target: ${targetInstaller}`);
  console.log(`Signature: ${signature.verifyStatus} (${signature.signerSubject})`);

  if (args.requirePublic && !report.publicReady) {
    for (const blocker of report.blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exit(1);
  }
}

main();
