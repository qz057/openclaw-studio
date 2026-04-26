const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function fileInfo(filePath) {
  const exists = fs.existsSync(filePath);

  if (!exists) {
    return {
      path: filePath,
      exists: false,
      size: null,
      sha256: null,
      lastModified: null
    };
  }

  const stats = fs.statSync(filePath);

  return {
    path: filePath,
    exists: true,
    size: stats.size,
    sha256: stats.isFile() ? hashFile(filePath) : null,
    lastModified: stats.mtime.toISOString()
  };
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function readAuthenticodeSignature(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      status: "Missing",
      statusMessage: "File is missing."
    };
  }

  const command = [
    "Import-Module Microsoft.PowerShell.Security;",
    "$target = [Environment]::GetEnvironmentVariable('OPENCLAW_SIGNATURE_TARGET');",
    "$sig = Get-AuthenticodeSignature -LiteralPath $target;",
    "$sig | ConvertTo-Json -Compress -Depth 3"
  ].join(" ");
  const result = spawnSync("pwsh.exe", ["-NoProfile", "-Command", command], {
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      OPENCLAW_SIGNATURE_TARGET: filePath
    }
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`Get-AuthenticodeSignature failed: ${result.stderr || result.stdout}`);
  }

  const stdout = result.stdout.trim();

  if (!stdout) {
    throw new Error(`Get-AuthenticodeSignature returned no JSON output: ${result.stderr || "no stderr"}`);
  }

  const parsed = JSON.parse(stdout);
  const statusMap = new Map([
    [0, "Valid"],
    [1, "UnknownError"],
    [2, "NotSigned"],
    [3, "HashMismatch"],
    [4, "NotTrusted"],
    [5, "NotSupportedFileFormat"],
    [6, "Incompatible"]
  ]);
  const status =
    typeof parsed.Status === "number"
      ? statusMap.get(parsed.Status) ?? String(parsed.Status)
      : parsed.Status == null
        ? null
        : String(parsed.Status);

  return {
    status,
    statusMessage: parsed.StatusMessage,
    signerSubject: parsed.SignerCertificate?.Subject ?? null,
    timestampSubject: parsed.TimeStamperCertificate?.Subject ?? null
  };
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const installerRoot = path.join(appRoot, ".packaging", "windows-installer", "out");
  const installerPath = path.join(installerRoot, "OpenClaw-Studio-0.1.0-win-x64-setup.exe");
  const blockMapPath = `${installerPath}.blockmap`;
  const generatedConfigPath = path.join(appRoot, ".packaging", "windows-installer", "electron-builder.nsis.generated.json");
  const smokeReportPath = path.join(deliveryRoot, "phase8-installer-smoke-20260426.json");
  const smokeReport = readJsonIfExists(smokeReportPath);
  const signature = readAuthenticodeSignature(installerPath);
  const failures = [];

  if (!fs.existsSync(installerPath)) {
    failures.push(`NSIS installer is missing: ${installerPath}`);
  }

  if (!fs.existsSync(blockMapPath)) {
    failures.push(`NSIS blockmap is missing: ${blockMapPath}`);
  }

  if (smokeReport?.status !== "passed") {
    failures.push(`Installer smoke report is not passed: ${smokeReportPath}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "passed" : "failed",
    artifacts: {
      installer: fileInfo(installerPath),
      blockMap: fileInfo(blockMapPath),
      generatedConfig: fileInfo(generatedConfigPath)
    },
    signature,
    smoke: {
      reportPath: smokeReportPath,
      status: smokeReport?.status ?? "missing",
      installRoot: smokeReport?.installRoot ?? null,
      launch: smokeReport?.launch ?? null,
      cleanup: smokeReport?.cleanup ?? null
    },
    signingBoundary: {
      signed: signature.status === "Valid",
      status: signature.status,
      reason:
        signature.status === "Valid"
          ? null
          : "Installer was generated as an unsigned local candidate. Release signing requires a certificate and timestamp policy."
    },
    failures
  };

  fs.mkdirSync(deliveryRoot, { recursive: true });
  const reportPath = path.join(deliveryRoot, "phase8-installer-closeout-20260426.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Phase 8 installer closeout failed. Report: ${reportPath}`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Phase 8 installer closeout passed. Report: ${reportPath}`);
  console.log(`Installer: ${report.artifacts.installer.size} bytes ${report.artifacts.installer.sha256}`);
  console.log(`Signature: ${signature.status}`);
  console.log(`Smoke: ${report.smoke.status}`);
}

main();
