const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status ?? 1}`);
  }
}

function runNpmScript(appRoot, scriptName, extraArgs = [], env = {}) {
  const npmArgs = ["run", "-C", appRoot, scriptName, ...extraArgs];
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm.cmd", ...npmArgs] : npmArgs;
  run(command, args, {
    env: {
      ...process.env,
      ...env
    }
  });
}

function installNsis(installerPath, installRoot) {
  run(installerPath, ["/S", `/D=${installRoot}`], {
    timeout: 120_000
  });

  const installedExe = path.join(installRoot, "OpenClaw Studio.exe");
  if (!fs.existsSync(installedExe)) {
    throw new Error(`NSIS install did not create executable: ${installedExe}`);
  }

  return installedExe;
}

function uninstallNsis(installRoot) {
  if (!fs.existsSync(installRoot)) {
    return;
  }

  const uninstaller = fs
    .readdirSync(installRoot)
    .find((entry) => /^uninstall.*\.exe$/i.test(entry));

  if (uninstaller) {
    run(path.join(installRoot, uninstaller), ["/S"], {
      timeout: 120_000
    });
  }
}

function removePath(targetPath) {
  try {
    fs.rmSync(targetPath, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 500
    });
  } catch {
    // Best-effort cleanup; the UI reports already capture product verification.
  }
}

function main() {
  if (process.platform !== "win32") {
    throw new Error("Phase 12 artifact UI parity must run on Windows.");
  }

  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const portableExe = path.join(appRoot, ".packaging", "windows-local", "out", "win-unpacked", "OpenClaw Studio.exe");
  const installerPath = path.join(appRoot, ".packaging", "windows-installer", "out", "OpenClaw-Studio-0.1.0-win-x64-setup.exe");

  fs.mkdirSync(deliveryRoot, { recursive: true });

  runNpmScript(appRoot, "package:windows:portable");
  runNpmScript(appRoot, "package:windows:installer");
  runNpmScript(appRoot, "package:smoke", ["--", "--portable"]);
  runNpmScript(appRoot, "phase8:installer-smoke");
  runNpmScript(appRoot, "phase7:package-closeout");
  runNpmScript(appRoot, "phase8:installer-closeout");
  runNpmScript(appRoot, "phase11:ui-full-check");

  if (!fs.existsSync(portableExe)) {
    throw new Error(`Portable executable is missing: ${portableExe}`);
  }

  runNpmScript(appRoot, "phase11:ui-full-check", [], {
    STUDIO_UI_FULL_CHECK_EXE: portableExe,
    STUDIO_UI_FULL_CHECK_REPORT_NAME: "phase12-portable-ui-full-check-20260426.json",
    STUDIO_UI_FULL_CHECK_SCREENSHOT_DIR: "phase12-portable-ui-screenshots-20260426"
  });

  if (!fs.existsSync(installerPath)) {
    throw new Error(`Installer is missing: ${installerPath}`);
  }

  const installRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-studio-phase12-installed-ui-"));
  try {
    const installedExe = installNsis(installerPath, installRoot);
    runNpmScript(appRoot, "phase11:ui-full-check", [], {
      STUDIO_UI_FULL_CHECK_EXE: installedExe,
      STUDIO_UI_FULL_CHECK_REPORT_NAME: "phase12-installed-ui-full-check-20260426.json",
      STUDIO_UI_FULL_CHECK_SCREENSHOT_DIR: "phase12-installed-ui-screenshots-20260426"
    });
    uninstallNsis(installRoot);
  } finally {
    removePath(installRoot);
  }

  runNpmScript(appRoot, "phase9:release-gate");
  runNpmScript(appRoot, "phase10:signing-readiness");

  console.log("Phase 12 artifact UI parity passed.");
}

main();
