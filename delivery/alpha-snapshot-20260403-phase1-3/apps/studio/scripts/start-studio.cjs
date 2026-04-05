const { spawn } = require("node:child_process");
const path = require("node:path");

function resolveElectronBinary() {
  try {
    return require("electron");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("OpenClaw Studio could not start because Electron is not installed in this workspace.");
    console.error("Run `npm install` from the project root and try again.");
    console.error(`Original error: ${message}`);
    process.exit(1);
  }
}

const electronBinary = resolveElectronBinary();
const appRoot = path.resolve(__dirname, "..");
const child = spawn(electronBinary, ["."], {
  cwd: appRoot,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

