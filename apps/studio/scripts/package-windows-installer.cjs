const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function normalizeElectronVersion(rawVersion) {
  if (typeof rawVersion !== "string") {
    return null;
  }

  const match = rawVersion.trim().match(/\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/);
  return match ? match[0] : null;
}

function getPaths() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const packagingRoot = path.join(appRoot, ".packaging", "windows-installer");

  return {
    appRoot,
    repoRoot,
    packagingRoot,
    outputRoot: path.join(packagingRoot, "out"),
    generatedConfigPath: path.join(packagingRoot, "electron-builder.nsis.generated.json"),
    baseConfigPath: path.join(appRoot, "electron-builder.json"),
    builderCliPath: path.join(repoRoot, "node_modules", "electron-builder", "cli.js")
  };
}

function writeGeneratedConfig(paths) {
  const baseConfig = readJson(paths.baseConfigPath);
  const appPackageJson = readJson(path.join(paths.appRoot, "package.json"));
  const electronVersion = normalizeElectronVersion(
    appPackageJson.optionalDependencies?.electron ??
      appPackageJson.devDependencies?.electron ??
      appPackageJson.dependencies?.electron
  );

  if (!electronVersion) {
    throw new Error("Could not determine Electron version for NSIS installer packaging.");
  }

  const generatedConfig = {
    ...baseConfig,
    electronVersion,
    directories: {
      ...(baseConfig.directories ?? {}),
      output: ".packaging/windows-installer/out"
    },
    win: {
      ...(baseConfig.win ?? {}),
      target: [
        {
          target: "nsis",
          arch: ["x64"]
        }
      ],
      artifactName: "OpenClaw-Studio-${version}-win-${arch}-setup.${ext}",
      icon: "build/icons/icon.ico",
      verifyUpdateCodeSignature: false,
      signAndEditExecutable: false
    },
    nsis: {
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: false,
      createStartMenuShortcut: false,
      shortcutName: "OpenClaw Studio",
      uninstallDisplayName: "OpenClaw Studio"
    },
    publish: null
  };

  fs.mkdirSync(paths.packagingRoot, { recursive: true });
  fs.rmSync(paths.outputRoot, { recursive: true, force: true });
  fs.writeFileSync(paths.generatedConfigPath, `${JSON.stringify(generatedConfig, null, 2)}\n`, "utf8");

  return generatedConfig;
}

function runBuilder(paths) {
  if (!fs.existsSync(paths.builderCliPath)) {
    throw new Error(`Local electron-builder CLI is missing: ${paths.builderCliPath}`);
  }

  const result = spawnSync(
    process.execPath,
    [paths.builderCliPath, "--win", "nsis", "--x64", "--config", paths.generatedConfigPath],
    {
      cwd: paths.appRoot,
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false"
      }
    }
  );

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`electron-builder NSIS packaging exited with code ${result.status ?? 1}`);
  }
}

function findInstaller(outputRoot) {
  if (!fs.existsSync(outputRoot)) {
    return null;
  }

  const candidates = fs
    .readdirSync(outputRoot)
    .filter((name) => /setup\.exe$/i.test(name))
    .map((name) => path.join(outputRoot, name));

  return candidates[0] ?? null;
}

function main() {
  if (process.platform !== "win32") {
    throw new Error("OpenClaw Studio Windows installer packaging must run on a Windows host.");
  }

  const paths = getPaths();

  writeGeneratedConfig(paths);
  runBuilder(paths);

  const installerPath = findInstaller(paths.outputRoot);

  if (!installerPath) {
    throw new Error(`NSIS installer was not generated under ${paths.outputRoot}`);
  }

  console.log(`OpenClaw Studio Windows NSIS installer created: ${installerPath}`);
  console.log(`Generated builder config: ${paths.generatedConfigPath}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(`OpenClaw Studio Windows installer packaging failed: ${message}`);
  process.exit(1);
}
