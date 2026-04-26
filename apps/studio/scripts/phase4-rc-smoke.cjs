const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const appRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..", "..");
const releaseRoot = path.join(appRoot, "release");
const smokeRoot = path.join(workspaceRoot, ".tmp", "phase4-rc-smoke");
const reportPath = path.join(workspaceRoot, "delivery", "phase4-rc-smoke-20260426.json");
const launchDurationMs = readPositiveInt("STUDIO_PHASE4_RC_LAUNCH_MS", 10_000);
const shutdownGraceMs = readPositiveInt("STUDIO_PHASE4_RC_SHUTDOWN_GRACE_MS", 5_000);

function readPositiveInt(name, fallback) {
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

function assertSafeSmokeRoot(targetPath) {
  const resolved = path.resolve(targetPath);
  const expectedPrefix = path.join(workspaceRoot, ".tmp") + path.sep;
  if (!resolved.startsWith(expectedPrefix) || !resolved.endsWith(`${path.sep}phase4-rc-smoke`)) {
    throw new Error(`Refusing to clean unsafe smoke directory: ${resolved}`);
  }
}

function findLatestZip() {
  if (!fs.existsSync(releaseRoot)) {
    throw new Error(`Release directory does not exist: ${releaseRoot}`);
  }

  const zips = fs
    .readdirSync(releaseRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^OpenClaw Studio-.+-win-x64\.zip$/i.test(entry.name))
    .map((entry) => {
      const targetPath = path.join(releaseRoot, entry.name);
      return {
        path: targetPath,
        mtimeMs: fs.statSync(targetPath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  if (zips.length === 0) {
    throw new Error(`No RC zip found under ${releaseRoot}`);
  }

  return zips[0].path;
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    ...options
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(" ")} failed with code ${result.status ?? 1}.`,
        result.stderr?.trim() || result.stdout?.trim() || "No command output."
      ].join("\n")
    );
  }

  return result;
}

function psLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function expandZip(zipPath, destination) {
  fs.mkdirSync(destination, { recursive: true });
  runChecked("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `Expand-Archive -LiteralPath ${psLiteral(zipPath)} -DestinationPath ${psLiteral(destination)} -Force`
  ]);
}

function findExe(root) {
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const targetPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(targetPath);
        continue;
      }

      if (entry.isFile() && entry.name === "OpenClaw Studio.exe") {
        return targetPath;
      }
    }
  }

  throw new Error(`OpenClaw Studio.exe was not found after extracting ${root}`);
}

function sha256(targetPath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(targetPath));
  return hash.digest("hex").toUpperCase();
}

function terminateChild(child) {
  if (!child.pid) {
    return;
  }

  spawnSync("taskkill", ["/pid", String(child.pid), "/t"], { stdio: "ignore", windowsHide: true });
}

function forceTerminateChild(child) {
  if (!child.pid) {
    return;
  }

  spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
}

function launchAndClose(exePath, label) {
  const userDataDir = path.join(smokeRoot, `user-data-${label}`);
  fs.mkdirSync(userDataDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let exitedEarly = false;
    let closed = false;
    let closeTimer = null;
    let forceTimer = null;

    const child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      stdio: "ignore",
      windowsHide: true,
      env: {
        ...process.env,
        OPENCLAW_STUDIO_USER_DATA_DIR: userDataDir
      }
    });

    const cleanup = () => {
      clearTimeout(closeTimer);
      clearTimeout(forceTimer);
    };

    child.on("error", (error) => {
      cleanup();
      reject(error);
    });

    child.on("exit", (code, signal) => {
      cleanup();
      const durationMs = Date.now() - startedAt;

      if (exitedEarly || (!closed && durationMs < launchDurationMs)) {
        reject(new Error(`${label} launch exited before ${launchDurationMs}ms with ${signal || `code ${code ?? 0}`}.`));
        return;
      }

      resolve({
        label,
        pid: child.pid,
        stayedAliveMs: durationMs,
        shutdown: closed ? "taskkill" : signal || `code ${code ?? 0}`,
        userDataDir
      });
    });

    closeTimer = setTimeout(() => {
      if (child.exitCode !== null || child.signalCode !== null) {
        exitedEarly = true;
        return;
      }

      closed = true;
      terminateChild(child);
      forceTimer = setTimeout(() => {
        forceTerminateChild(child);
      }, shutdownGraceMs);
    }, launchDurationMs);
  });
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("Phase 4 RC smoke must run on Windows.");
  }

  assertSafeSmokeRoot(smokeRoot);
  fs.rmSync(smokeRoot, { recursive: true, force: true });
  fs.mkdirSync(smokeRoot, { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const zipPath = findLatestZip();
  const extractRoot = path.join(smokeRoot, "extracted");
  expandZip(zipPath, extractRoot);

  const exePath = findExe(extractRoot);
  const firstLaunch = await launchAndClose(exePath, "first");
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  const restartLaunch = await launchAndClose(exePath, "restart");

  const report = {
    generatedAt: new Date().toISOString(),
    host: {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname()
    },
    artifact: {
      zipPath,
      zipSize: fs.statSync(zipPath).size,
      zipSha256: sha256(zipPath),
      exePath,
      exeSize: fs.statSync(exePath).size,
      exeSha256: sha256(exePath)
    },
    checks: {
      extract: "passed",
      firstLaunch,
      shutdown: "passed",
      restartLaunch
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Phase 4 RC smoke passed. Report: ${reportPath}`);
  console.log(`Zip SHA256: ${report.artifact.zipSha256}`);
  console.log(`Exe SHA256: ${report.artifact.exeSha256}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Phase 4 RC smoke failed: ${message}`);
  process.exit(1);
});
