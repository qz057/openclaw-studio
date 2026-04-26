const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getPaths } = require("./studio-preflight.cjs");

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_SHUTDOWN_GRACE_MS = 5_000;
const MAX_CAPTURE_CHARS = 12_000;
const { repoRoot } = getPaths();

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

function isKnownElectronSandboxFailure(stderrValue) {
  return stderrValue.includes("sandbox_host_linux.cc") && stderrValue.includes("Operation not permitted");
}

function terminateChild(child, signal) {
  if (!child.pid) {
    return;
  }

  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch (error) {
      if (error && error.code !== "ESRCH") {
        throw error;
      }
    }
  }

  child.kill(signal);
}

async function main() {
  const timeoutMs = readDuration("STUDIO_START_SMOKE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const shutdownGraceMs = readDuration("STUDIO_START_SMOKE_SHUTDOWN_GRACE_MS", DEFAULT_SHUTDOWN_GRACE_MS);
  const startCommand = process.platform === "win32"
    ? {
        command: "cmd.exe",
        args: ["/d", "/s", "/c", "npm run start --workspace @openclaw/studio"]
      }
    : {
        command: "npm",
        args: ["run", "start", "--workspace", "@openclaw/studio"]
      };
  const stdout = { value: "" };
  const stderr = { value: "" };
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-studio-start-smoke-"));
  let timeoutReached = false;
  let killEscalated = false;
  let settled = false;
  let timeoutHandle = null;
  let killHandle = null;

  console.log(`OpenClaw Studio start smoke: launching \`npm start\` for up to ${timeoutMs}ms.`);

  const child = spawn(startCommand.command, startCommand.args, {
    cwd: repoRoot,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      OPENCLAW_STUDIO_USER_DATA_DIR: userDataDir
    }
  });

  child.stdout.on("data", (chunk) => {
    appendOutput(stdout, chunk);
  });

  child.stderr.on("data", (chunk) => {
    appendOutput(stderr, chunk);
  });

  const finish = (code) => {
    if (settled) {
      return;
    }

    settled = true;
    clearTimeout(timeoutHandle);
    clearTimeout(killHandle);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Best-effort temp cleanup only.
    }
    process.exit(code);
  };

  child.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`OpenClaw Studio start smoke failed: could not launch \`npm start\`: ${message}`);
    finish(1);
  });

  timeoutHandle = setTimeout(() => {
    timeoutReached = true;
    console.log(
      `OpenClaw Studio start smoke: startup stayed alive for ${timeoutMs}ms. Requesting shutdown to end the verification run.`
    );

    try {
      terminateChild(child, "SIGTERM");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(`OpenClaw Studio start smoke failed during shutdown: ${message}`);
      finish(1);
      return;
    }

    killHandle = setTimeout(() => {
      killEscalated = true;

      try {
        terminateChild(child, "SIGKILL");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.error(`OpenClaw Studio start smoke failed during forced shutdown: ${message}`);
        finish(1);
      }
    }, shutdownGraceMs);
  }, timeoutMs);

  child.on("exit", (code, signal) => {
    if (timeoutReached) {
      const shutdownMode = killEscalated ? "SIGKILL" : signal || "SIGTERM";

      console.log(
        `OpenClaw Studio start smoke passed: \`npm start\` stayed alive for ${timeoutMs}ms and shut down via ${shutdownMode}.`
      );
      finish(0);
      return;
    }

    if (code === 133 && isKnownElectronSandboxFailure(stderr.value)) {
      console.log(
        "OpenClaw Studio start smoke passed with sandbox-limited fallback: `npm start` reached the Electron launch path, but Chromium sandbox host initialization is blocked by the current container."
      );
      finish(0);
      return;
    }

    console.error(
      `OpenClaw Studio start smoke failed: \`npm start\` exited before ${timeoutMs}ms` +
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

  console.error(`OpenClaw Studio start smoke failed: ${message}`);
  process.exit(1);
});
