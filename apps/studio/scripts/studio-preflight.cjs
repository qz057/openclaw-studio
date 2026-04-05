const fs = require("node:fs");
const path = require("node:path");

function getPaths() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");

  return {
    appRoot,
    repoRoot,
    rendererRoot: path.join(appRoot, "dist-renderer"),
    electronRoot: path.join(appRoot, "dist-electron"),
    rendererIndexHtml: path.join(appRoot, "dist-renderer", "index.html"),
    electronMain: path.join(appRoot, "dist-electron", "electron", "main.js"),
    electronPreload: path.join(appRoot, "dist-electron", "electron", "preload.js"),
    electronRuntime: path.join(appRoot, "dist-electron", "electron", "runtime", "studio-runtime.js"),
    deliveryRoot: path.join(repoRoot, "delivery", "openclaw-studio-alpha-shell"),
    readmePath: path.join(repoRoot, "README.md"),
    handoffPath: path.join(repoRoot, "HANDOFF.md"),
    implementationPlanPath: path.join(repoRoot, "IMPLEMENTATION-PLAN.md")
  };
}

function checkFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: stats.isFile()
    };
  } catch {
    return {
      exists: false
    };
  }
}

function resolveElectronBinary() {
  try {
    return {
      available: true,
      binary: require("electron"),
      errorMessage: null
    };
  } catch (error) {
    return {
      available: false,
      binary: null,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
}

function resolveDisplayState() {
  if (process.platform !== "linux") {
    return {
      required: false,
      available: true,
      source: "not-required",
      detail: "Display preflight is only enforced on Linux/WSL.",
      env: {}
    };
  }

  const display = process.env.DISPLAY;
  const waylandDisplay = process.env.WAYLAND_DISPLAY;
  const runtimeDir = process.env.XDG_RUNTIME_DIR;

  if (display || waylandDisplay) {
    return {
      required: true,
      available: true,
      source: "environment",
      detail: display ? `DISPLAY=${display}` : `WAYLAND_DISPLAY=${waylandDisplay}`,
      env: {
        ...(display ? { DISPLAY: display } : {}),
        ...(waylandDisplay ? { WAYLAND_DISPLAY: waylandDisplay } : {}),
        ...(runtimeDir ? { XDG_RUNTIME_DIR: runtimeDir } : {})
      }
    };
  }

  const inferredDisplay = "/mnt/wslg/.X11-unix/X0";
  const inferredWayland = "/mnt/wslg/runtime-dir/wayland-0";
  const inferredRuntimeDir = "/mnt/wslg/runtime-dir";

  if (fs.existsSync(inferredDisplay) && fs.existsSync(inferredWayland)) {
    return {
      required: true,
      available: true,
      source: "wslg-auto",
      detail: "Auto-detected WSLg sockets under /mnt/wslg.",
      env: {
        DISPLAY: ":0",
        WAYLAND_DISPLAY: "wayland-0",
        XDG_RUNTIME_DIR: inferredRuntimeDir
      }
    };
  }

  return {
    required: true,
    available: false,
    source: "missing",
    detail: "No DISPLAY or WAYLAND_DISPLAY is set for the current Linux session, and no WSLg sockets were auto-detected.",
    env: {}
  };
}

function getPreflightSummary() {
  const paths = getPaths();
  const artifacts = [
    { label: "Renderer HTML", path: paths.rendererIndexHtml },
    { label: "Electron main", path: paths.electronMain },
    { label: "Electron preload", path: paths.electronPreload },
    { label: "Electron runtime", path: paths.electronRuntime }
  ].map((artifact) => ({
    ...artifact,
    ...checkFile(artifact.path)
  }));
  const missingArtifacts = artifacts.filter((artifact) => !artifact.exists);
  const electron = resolveElectronBinary();
  const display = resolveDisplayState();

  return {
    paths,
    artifacts,
    missingArtifacts,
    buildReady: missingArtifacts.length === 0,
    electron,
    display,
    startReady: missingArtifacts.length === 0 && electron.available && display.available
  };
}

function formatArtifactLine(artifact) {
  return `- ${artifact.label}: ${artifact.exists ? "ok" : "missing"} (${artifact.path})`;
}

function formatPreflightSummary(summary) {
  const lines = [
    `Build ready: ${summary.buildReady ? "yes" : "no"}`,
    `Electron ready: ${summary.electron.available ? "yes" : "no"}`,
    `Display ready: ${summary.display.available ? "yes" : "no"}`,
    `Start ready: ${summary.startReady ? "yes" : "no"}`,
    "Artifacts:"
  ];

  for (const artifact of summary.artifacts) {
    lines.push(formatArtifactLine(artifact));
  }

  if (!summary.electron.available) {
    lines.push(`Electron resolution error: ${summary.electron.errorMessage}`);
  }

  lines.push(`Display check: ${summary.display.detail}`);

  if (summary.display.available && Object.keys(summary.display.env || {}).length > 0) {
    lines.push(`Display env: ${Object.entries(summary.display.env)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ")}`);
  }

  return lines.join("\n");
}

module.exports = {
  getPaths,
  getPreflightSummary,
  formatPreflightSummary
};
