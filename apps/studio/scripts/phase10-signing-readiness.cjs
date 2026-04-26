const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function hasEnv(name) {
  return Boolean(process.env[name]);
}

function hasPowerShellAuthenticode() {
  if (process.platform !== "win32") {
    return false;
  }

  const shell = spawnSync("where.exe", ["pwsh.exe"], {
    encoding: "utf8",
    shell: false
  });
  const powershell = (shell.status ?? 1) === 0
    ? shell.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0]
    : "powershell.exe";
  const args = path.basename(powershell).toLowerCase() === "powershell.exe"
    ? ["-NoProfile", "-Command", "Get-Command Set-AuthenticodeSignature,Get-AuthenticodeSignature -ErrorAction Stop | Out-Null"]
    : ["-NoProfile", "-Command", "Get-Command Set-AuthenticodeSignature,Get-AuthenticodeSignature -ErrorAction Stop | Out-Null"];
  const result = spawnSync(
    powershell,
    args,
    {
      stdio: "ignore",
      shell: false
    }
  );

  return (result.status ?? 1) === 0;
}

function findWithWhere(executable) {
  const result = spawnSync("where.exe", [executable], {
    encoding: "utf8",
    shell: false
  });

  if ((result.status ?? 1) !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((candidate) => fs.existsSync(candidate));
}

function listDirectories(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name));
}

function findWindowsKitSigntool() {
  const kitRoot = "C:\\Program Files (x86)\\Windows Kits\\10\\bin";
  const found = [];

  for (const versionDir of listDirectories(kitRoot)) {
    for (const arch of ["x64", "x86"]) {
      const candidate = path.join(versionDir, arch, "signtool.exe");

      if (fs.existsSync(candidate)) {
        found.push(candidate);
      }
    }
  }

  return found.sort().reverse();
}

function collectSigntoolCandidates() {
  return [...new Set([...findWithWhere("signtool.exe"), ...findWindowsKitSigntool()])];
}

function collectSigningEnv() {
  const candidates = {
    CSC_LINK: hasEnv("CSC_LINK"),
    CSC_KEY_PASSWORD: hasEnv("CSC_KEY_PASSWORD"),
    WIN_CSC_LINK: hasEnv("WIN_CSC_LINK"),
    WIN_CSC_KEY_PASSWORD: hasEnv("WIN_CSC_KEY_PASSWORD"),
    WINDOWS_CODESIGN_CERT_FILE: hasEnv("WINDOWS_CODESIGN_CERT_FILE"),
    WINDOWS_CODESIGN_CERT_PASSWORD: hasEnv("WINDOWS_CODESIGN_CERT_PASSWORD"),
    WINDOWS_CODESIGN_CERT_THUMBPRINT: hasEnv("WINDOWS_CODESIGN_CERT_THUMBPRINT"),
    WINDOWS_CODESIGN_CERT_SUBJECT: hasEnv("WINDOWS_CODESIGN_CERT_SUBJECT"),
    WINDOWS_CODESIGN_TIMESTAMP_URL: hasEnv("WINDOWS_CODESIGN_TIMESTAMP_URL")
  };

  return {
    candidates,
    hasCertificateInput:
      candidates.CSC_LINK ||
      candidates.WIN_CSC_LINK ||
      candidates.WINDOWS_CODESIGN_CERT_FILE ||
      candidates.WINDOWS_CODESIGN_CERT_THUMBPRINT ||
      candidates.WINDOWS_CODESIGN_CERT_SUBJECT,
    hasPasswordInput:
      candidates.CSC_KEY_PASSWORD ||
      candidates.WIN_CSC_KEY_PASSWORD ||
      candidates.WINDOWS_CODESIGN_CERT_PASSWORD ||
      candidates.WINDOWS_CODESIGN_CERT_THUMBPRINT ||
      candidates.WINDOWS_CODESIGN_CERT_SUBJECT,
    hasTimestampInput: candidates.WINDOWS_CODESIGN_TIMESTAMP_URL
  };
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const requireReady = process.argv.includes("--require-ready");
  const releaseGatePath = path.join(deliveryRoot, "phase9-release-gate-20260426.json");
  const installerCloseoutPath = path.join(deliveryRoot, "phase8-installer-closeout-20260426.json");
  const blockers = [];
  const warnings = [];

  if (!fs.existsSync(releaseGatePath)) {
    blockers.push({
      id: "release-gate-report-missing",
      detail: `Missing Phase 9 release gate report: ${releaseGatePath}`
    });
  }

  if (!fs.existsSync(installerCloseoutPath)) {
    blockers.push({
      id: "installer-closeout-report-missing",
      detail: `Missing Phase 8 installer closeout report: ${installerCloseoutPath}`
    });
  }

  const releaseGate = fs.existsSync(releaseGatePath) ? readJson(releaseGatePath) : null;
  const installerCloseout = fs.existsSync(installerCloseoutPath) ? readJson(installerCloseoutPath) : null;
  const installerPath =
    installerCloseout?.artifacts?.installer?.path ??
    releaseGate?.artifacts?.installer?.path ??
    path.join(appRoot, ".packaging", "windows-installer", "out", "OpenClaw-Studio-0.1.0-win-x64-setup.exe");

  if (!fs.existsSync(installerPath)) {
    blockers.push({
      id: "installer-missing",
      detail: `Installer candidate is missing: ${installerPath}`
    });
  }

  const signtoolCandidates = process.platform === "win32" ? collectSigntoolCandidates() : [];
  const powershellAuthenticode = hasPowerShellAuthenticode();

  if (signtoolCandidates.length === 0 && !powershellAuthenticode) {
    blockers.push({
      id: "signing-tool-missing",
      detail: "Neither signtool.exe nor PowerShell Authenticode signing cmdlets are available."
    });
  } else if (signtoolCandidates.length === 0) {
    warnings.push("signtool.exe is missing; PowerShell Authenticode signing is available as the local signing bridge.");
  }

  const signingEnv = collectSigningEnv();

  if (!signingEnv.hasCertificateInput) {
    blockers.push({
      id: "signing-certificate-input-missing",
      detail: "Set CSC_LINK, WIN_CSC_LINK, or WINDOWS_CODESIGN_CERT_FILE before signing."
    });
  }

  if (!signingEnv.hasPasswordInput) {
    blockers.push({
      id: "signing-password-input-missing",
      detail: "Set CSC_KEY_PASSWORD, WIN_CSC_KEY_PASSWORD, or WINDOWS_CODESIGN_CERT_PASSWORD before signing."
    });
  }

  if (!signingEnv.hasTimestampInput) {
    blockers.push({
      id: "timestamp-url-missing",
      detail: "Set WINDOWS_CODESIGN_TIMESTAMP_URL before signing."
    });
  }

  if (installerCloseout?.signature?.status === "Valid") {
    warnings.push("Installer is already signed according to Phase 8 closeout.");
  }

  const ready = blockers.length === 0;
  const report = {
    generatedAt: new Date().toISOString(),
    status: ready ? "ready" : "blocked",
    mode: requireReady ? "require-ready" : "readiness",
    installerPath,
    signtool: {
      found: signtoolCandidates.length > 0,
      selected: signtoolCandidates[0] ?? null,
      candidates: signtoolCandidates
    },
    powershellAuthenticode: {
      found: powershellAuthenticode
    },
    signingEnv,
    upstream: {
      releaseGatePath,
      releaseGateStatus: releaseGate?.status ?? "missing",
      installerCloseoutPath,
      installerSignatureStatus: installerCloseout?.signature?.status ?? "missing"
    },
    warnings,
    blockers
  };

  fs.mkdirSync(deliveryRoot, { recursive: true });
  const reportPath = path.join(deliveryRoot, "phase10-signing-readiness-20260426.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (requireReady && !ready) {
    console.error(`Phase 10 signing readiness blocked. Report: ${reportPath}`);
    for (const blocker of blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exit(1);
  }

  console.log(`Phase 10 signing readiness ${ready ? "ready" : "blocked"}. Report: ${reportPath}`);
  console.log(`signtool: ${report.signtool.selected ?? "missing"}`);

  if (blockers.length > 0) {
    console.log(`Blockers: ${blockers.map((blocker) => blocker.id).join(", ")}`);
  }
}

main();
