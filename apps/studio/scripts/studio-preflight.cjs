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
    return { exists: stats.isFile() };
  } catch {
    return { exists: false };
  }
}

function getBinaryArchitecture(binaryPath) {
  if (!binaryPath || !fs.existsSync(binaryPath)) {
    return null;
  }

  try {
    const fd = fs.openSync(binaryPath, "r");
    try {
      const header = Buffer.alloc(20);
      fs.readSync(fd, header, 0, header.length, 0);

      if (header[0] === 0x7f && header[1] === 0x45 && header[2] === 0x4c && header[3] === 0x46) {
        const machine = header.readUInt16LE(18);
        if (machine === 0x3e) return "linux-x64";
        if (machine === 0xb7) return "linux-arm64";
        return `linux-elf-${machine}`;
      }

      if (header[0] === 0x4d && header[1] === 0x5a) {
        return "windows-pe";
      }

      return null;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}

function isBinaryCompatible(binaryPath) {
  const binaryArchitecture = getBinaryArchitecture(binaryPath);

  if (!binaryArchitecture) {
    return true;
  }

  if (process.platform === "linux") {
    const expected = process.arch === "arm64" ? "linux-arm64" : "linux-x64";
    return binaryArchitecture === expected;
  }

  if (process.platform === "win32") {
    return binaryArchitecture === "windows-pe";
  }

  return true;
}

function resolveElectronBinary() {
  const expectedBinaryName = process.platform === "win32" ? "electron.exe" : "electron";
  const fallbackRoots = [];

  const defaultResolved = (() => {
    try {
      return {
        binary: require("electron"),
        moduleRoot: path.dirname(require.resolve("electron")),
        error: null
      };
    } catch (error) {
      return {
        binary: null,
        moduleRoot: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  })();

  if (defaultResolved.moduleRoot) {
    fallbackRoots.push({
      label: "default",
      moduleRoot: defaultResolved.moduleRoot,
      resolvedBinary: defaultResolved.binary
    });
  }

  const repoElectronRoot = path.resolve(__dirname, "..", "..", "..", "node_modules", "electron");
  if (!fallbackRoots.some((entry) => entry.moduleRoot === repoElectronRoot) && fs.existsSync(path.join(repoElectronRoot, "index.js"))) {
    fallbackRoots.push({
      label: "repo-root",
      moduleRoot: repoElectronRoot,
      resolvedBinary: null
    });
  }

  const candidates = fallbackRoots.map((entry) => {
    const platformBinary = path.join(entry.moduleRoot, "dist", expectedBinaryName);
    const hasPlatformBinary = fs.existsSync(platformBinary);
    return {
      ...entry,
      platformBinary,
      hasPlatformBinary,
      compatible: hasPlatformBinary ? isBinaryCompatible(platformBinary) : false
    };
  });

  const matchingCandidate = candidates.find((entry) => entry.hasPlatformBinary && entry.compatible);
  if (matchingCandidate) {
    const defaultMismatch =
      defaultResolved.binary &&
      path.resolve(defaultResolved.binary) !== path.resolve(matchingCandidate.platformBinary);

    return {
      available: true,
      binary: matchingCandidate.platformBinary,
      errorMessage: null,
      warningMessage: defaultMismatch
        ? `Electron default resolution pointed at ${defaultResolved.binary}, but ${expectedBinaryName} for ${process.platform} was found under ${matchingCandidate.moduleRoot}. Using fallback binary ${matchingCandidate.platformBinary}.`
        : null
    };
  }

  const searchedRoots = candidates.map((entry) => entry.moduleRoot);
  const incompatibleBinaries = candidates
    .filter((entry) => entry.hasPlatformBinary && !entry.compatible)
    .map((entry) => `${entry.platformBinary} (${getBinaryArchitecture(entry.platformBinary) ?? "unknown"})`);
  const resolutionLead = defaultResolved.binary
    ? `Resolved Electron binary ${defaultResolved.binary}, but no compatible ${expectedBinaryName} candidate was found.`
    : `Could not resolve Electron via require("electron"): ${defaultResolved.error}`;

  return {
    available: false,
    binary: defaultResolved.binary,
    errorMessage:
      `${resolutionLead} Searched module roots: ${searchedRoots.join(", ") || "(none)"}. ` +
      `${incompatibleBinaries.length > 0 ? `Incompatible binaries: ${incompatibleBinaries.join(", ")}. ` : ""}` +
      "Reinstall Electron for the current platform or provide a platform-correct local install before using `npm start` or `npm run start:smoke`.",
    warningMessage: null
  };
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

  if (summary.electron.binary) {
    lines.push(`Electron binary: ${summary.electron.binary}`);
  }

  if (summary.electron.warningMessage) {
    lines.push(`Electron warning: ${summary.electron.warningMessage}`);
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
