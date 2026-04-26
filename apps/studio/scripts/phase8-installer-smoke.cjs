const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_SHUTDOWN_GRACE_MS = 5_000;

function readDuration(name, fallback) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer. Received: ${raw}`);
  }

  return parsed;
}

function getPaths() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const installerRoot = path.join(appRoot, ".packaging", "windows-installer", "out");

  return {
    appRoot,
    repoRoot,
    deliveryRoot: path.join(repoRoot, "delivery"),
    installerRoot,
    installerPath: path.join(installerRoot, "OpenClaw-Studio-0.1.0-win-x64-setup.exe")
  };
}

function runStep(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`${path.basename(command)} exited with code ${result.status ?? 1}`);
  }
}

function terminateChild(child, force = false) {
  if (!child.pid) {
    return;
  }

  if (process.platform === "win32") {
    const args = ["/pid", String(child.pid), "/t"];

    if (force) {
      args.push("/f");
    }

    spawnSync("taskkill", args, { stdio: "ignore" });
    return;
  }

  child.kill(force ? "SIGKILL" : "SIGTERM");
}

function findUninstaller(installRoot) {
  if (!fs.existsSync(installRoot)) {
    return null;
  }

  const entries = fs.readdirSync(installRoot);
  const match = entries.find((entry) => /^uninstall.*\.exe$/i.test(entry));
  return match ? path.join(installRoot, match) : null;
}

function removeInstallRoot(installRoot) {
  let lastError = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.rmSync(installRoot, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 500
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (!fs.existsSync(installRoot)) {
      return {
        status: "removed",
        attempts: attempt + 1,
        warning: lastError
      };
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }

  return {
    status: "leftover",
    attempts: 8,
    warning: lastError
  };
}

function launchAndVerify(exePath, timeoutMs, shutdownGraceMs) {
  return new Promise((resolve, reject) => {
    let timeoutReached = false;
    let killEscalated = false;
    let settled = false;
    let timeoutHandle = null;
    let killHandle = null;

    const child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      stdio: "ignore",
      windowsHide: process.platform === "win32",
      env: {
        ...process.env
      }
    });

    const finish = (value, error = null) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      clearTimeout(killHandle);

      if (error) {
        reject(error);
        return;
      }

      resolve(value);
    };

    child.on("error", (error) => {
      finish(null, error);
    });

    timeoutHandle = setTimeout(() => {
      timeoutReached = true;
      terminateChild(child, false);

      killHandle = setTimeout(() => {
        killEscalated = true;
        terminateChild(child, true);
      }, shutdownGraceMs);
    }, timeoutMs);

    child.on("exit", (code, signal) => {
      if (timeoutReached) {
        finish({
          pid: child.pid,
          stayedAliveMs: timeoutMs,
          shutdownMode: killEscalated ? "forced taskkill" : signal || "taskkill"
        });
        return;
      }

      finish(
        null,
        new Error(
          `Installed app exited before ${timeoutMs}ms${signal ? ` with signal ${signal}` : ` with code ${code ?? 0}`}.`
        )
      );
    });
  });
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("NSIS installer smoke must run on a Windows host.");
  }

  const paths = getPaths();
  const timeoutMs = readDuration("STUDIO_INSTALLER_SMOKE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const shutdownGraceMs = readDuration("STUDIO_INSTALLER_SMOKE_SHUTDOWN_GRACE_MS", DEFAULT_SHUTDOWN_GRACE_MS);
  const installRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-studio-nsis-smoke-"));
  const installedExe = path.join(installRoot, "OpenClaw Studio.exe");
  const reportPath = path.join(paths.deliveryRoot, "phase8-installer-smoke-20260426.json");
  const report = {
    generatedAt: new Date().toISOString(),
    installerPath: paths.installerPath,
    installRoot,
    installedExe,
    timeoutMs,
    install: null,
    launch: null,
    uninstall: null,
    cleanup: null,
    status: "failed"
  };

  if (!fs.existsSync(paths.installerPath)) {
    throw new Error(`NSIS installer is missing: ${paths.installerPath}`);
  }

  try {
    runStep(paths.installerPath, ["/S", `/D=${installRoot}`], {
      timeout: 120_000
    });

    if (!fs.existsSync(installedExe)) {
      throw new Error(`Silent install did not create launch executable: ${installedExe}`);
    }

    report.install = {
      status: "passed",
      createdExecutable: installedExe
    };
    report.launch = await launchAndVerify(installedExe, timeoutMs, shutdownGraceMs);

    const uninstaller = findUninstaller(installRoot);

    if (!uninstaller) {
      throw new Error(`Could not find NSIS uninstaller under ${installRoot}`);
    }

    runStep(uninstaller, ["/S"], {
      timeout: 120_000
    });

    report.uninstall = {
      status: "passed",
      uninstaller
    };

    report.cleanup = removeInstallRoot(installRoot);
    report.status = "passed";
  } finally {
    fs.mkdirSync(paths.deliveryRoot, { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log(`Phase 8 installer smoke passed. Report: ${reportPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Phase 8 installer smoke failed: ${message}`);
  process.exit(1);
});
