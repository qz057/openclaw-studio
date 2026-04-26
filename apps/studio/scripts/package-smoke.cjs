const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const { getPaths } = require("./studio-preflight.cjs");
const { copyPath, packageWindowsLocalTarget, resolveTarget } = require("./package-windows-local.cjs");

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_SHUTDOWN_GRACE_MS = 5_000;
const MAX_CAPTURE_CHARS = 12_000;

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

function appendOutput(target, chunk) {
  target.value += chunk.toString("utf8");

  if (target.value.length > MAX_CAPTURE_CHARS) {
    target.value = target.value.slice(-MAX_CAPTURE_CHARS);
  }
}

function formatCapturedOutput(label, value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return `${label}:\n${trimmed}`;
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function hasExplicitTarget(argv) {
  return argv.some((value) => value === "--portable" || value === "--dir" || value.startsWith("--target="));
}

function resolveDeliveryArtifact() {
  const { deliveryRoot } = getPaths();
  const manifestPath = path.join(deliveryRoot, "installers", "windows", "INSTALLER-ARTIFACT-MANIFEST.json");

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  const manifest = readJson(manifestPath);

  if (!manifest.launchTarget) {
    return null;
  }

  const installersRoot = path.dirname(manifestPath);
  const launchTarget = path.join(installersRoot, manifest.launchTarget);

  if (!fs.existsSync(launchTarget)) {
    return null;
  }

  return {
    source: "delivery-manifest",
    target: manifest.target,
    builderMode: manifest.builderMode ?? "delivery-manifest",
    outputRoot: installersRoot,
    launchTarget
  };
}

function resolveSmokeTarget(argv) {
  if (!hasExplicitTarget(argv)) {
    const deliveryArtifact = resolveDeliveryArtifact();

    if (deliveryArtifact) {
      return deliveryArtifact;
    }
  }

  const target = resolveTarget(argv);
  return {
    source: "fresh-package",
    ...packageWindowsLocalTarget(target)
  };
}

function localizeLaunchTarget(launchTarget) {
  if (process.platform !== "win32") {
    return {
      launchTarget,
      cleanupRoot: null
    };
  }

  const localizedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-studio-package-smoke-"));
  const localizedTarget = path.join(localizedRoot, path.basename(launchTarget));

  copyPath(path.dirname(launchTarget), localizedRoot);

  return {
    launchTarget: localizedTarget,
    cleanupRoot: localizedRoot
  };
}

function cleanupLocalizedTarget(cleanupRoot) {
  if (!cleanupRoot) {
    return;
  }

  try {
    fs.rmSync(cleanupRoot, { recursive: true, force: true });
  } catch {
    // Best-effort temp cleanup only.
  }
}


async function main() {
  if (process.platform !== "win32") {
    throw new Error("OpenClaw Studio package smoke must run on a Windows host.");
  }

  const timeoutMs = readDuration("STUDIO_PACKAGE_SMOKE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const shutdownGraceMs = readDuration("STUDIO_PACKAGE_SMOKE_SHUTDOWN_GRACE_MS", DEFAULT_SHUTDOWN_GRACE_MS);
  const packageResult = resolveSmokeTarget(process.argv.slice(2));

  if (!packageResult.launchTarget) {
    throw new Error(
      [
        `OpenClaw Studio package smoke could not find a launch target for ${packageResult.target}.`,
        `Output root: ${packageResult.outputRoot}`
      ].join("\n")
    );
  }

  const { launchTarget, cleanupRoot } = localizeLaunchTarget(packageResult.launchTarget);

  console.log(
    `OpenClaw Studio package smoke: launching ${launchTarget} for up to ${timeoutMs}ms (${packageResult.target}, builder ${packageResult.builderMode}, source ${packageResult.source}).`
  );

  const stdout = { value: "" };
  const stderr = { value: "" };
  let timeoutReached = false;
  let killEscalated = false;
  let settled = false;
  let timeoutHandle = null;
  let killHandle = null;

  const child = spawn(launchTarget, [], {
    cwd: path.dirname(launchTarget),
    stdio: process.platform === "win32" ? "ignore" : ["ignore", "pipe", "pipe"],
    windowsHide: process.platform === "win32",
    env: {
      ...process.env
    }
  });

  if (child.stdout) {
    child.stdout.on("data", (chunk) => {
      appendOutput(stdout, chunk);
    });
  }

  if (child.stderr) {
    child.stderr.on("data", (chunk) => {
      appendOutput(stderr, chunk);
    });
  }

  const finish = (code) => {
    if (settled) {
      return;
    }

    settled = true;
    clearTimeout(timeoutHandle);
    clearTimeout(killHandle);
    cleanupLocalizedTarget(cleanupRoot);
    process.exit(code);
  };

  child.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`OpenClaw Studio package smoke failed: could not launch packaged app: ${message}`);
    finish(1);
  });

  timeoutHandle = setTimeout(() => {
    timeoutReached = true;
    console.log(
      `OpenClaw Studio package smoke: packaged app stayed alive for ${timeoutMs}ms. Requesting shutdown to end the verification run.`
    );

    terminateChild(child, false);

    killHandle = setTimeout(() => {
      killEscalated = true;
      terminateChild(child, true);
    }, shutdownGraceMs);
  }, timeoutMs);

  child.on("exit", (code, signal) => {
    if (timeoutReached) {
      const shutdownMode = killEscalated ? "forced taskkill" : signal || "taskkill";
      console.log(
        `OpenClaw Studio package smoke passed: packaged app stayed alive for ${timeoutMs}ms and shut down via ${shutdownMode}.`
      );
      finish(0);
      return;
    }

    console.error(
      `OpenClaw Studio package smoke failed: packaged app exited before ${timeoutMs}ms` +
        `${signal ? ` with signal ${signal}` : ` with code ${code ?? 0}`}.`
    );

    const sections = [
      formatCapturedOutput("Recent stdout", stdout.value),
      formatCapturedOutput("Recent stderr", stderr.value)
    ].filter(Boolean);

    if (sections.length > 0) {
      console.error("");
      console.error(sections.join("\n\n"));
    }

    finish(code === 0 ? 1 : code ?? 1);
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`OpenClaw Studio package smoke failed: ${message}`);
  process.exit(1);
});
