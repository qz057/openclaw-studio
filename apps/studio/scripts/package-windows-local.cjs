const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { formatPreflightSummary, getPaths, getPreflightSummary } = require("./studio-preflight.cjs");

const STAGE_ROOT_SEGMENTS = [".packaging", "windows-local"];
const DEFAULT_TARGET = "dir";
const VALID_TARGETS = new Set(["dir", "portable"]);
const LOCAL_BUILDER_REQUIRED_MODULES = [
  "electron-builder/package.json",
  "builder-util/package.json",
  "app-builder-bin/package.json"
];

function copyDirectory(source, target) {
  const stats = fs.statSync(source);

  if (!stats.isDirectory()) {
    throw new Error(`Expected directory copy source, received file: ${source}`);
  }

  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const realPath = fs.realpathSync(sourcePath);
      const realStats = fs.statSync(realPath);

      if (realStats.isDirectory()) {
        copyDirectory(realPath, targetPath);
      } else {
        fs.copyFileSync(realPath, targetPath);
      }

      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyPath(source, target) {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    copyDirectory(source, target);
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

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

function resolveTarget(argv) {
  if (argv.includes("--portable")) {
    return "portable";
  }

  if (argv.includes("--dir")) {
    return "dir";
  }

  const inlineTarget = argv.find((value) => value.startsWith("--target="));

  if (!inlineTarget) {
    return DEFAULT_TARGET;
  }

  const target = inlineTarget.slice("--target=".length).trim();

  if (!VALID_TARGETS.has(target)) {
    throw new Error(`Unsupported Windows local package target: ${target}`);
  }

  return target;
}

function getPackagingPaths(paths) {
  const packagingRoot = path.join(paths.appRoot, ...STAGE_ROOT_SEGMENTS);

  return {
    packagingRoot,
    stageRoot: path.join(packagingRoot, "app"),
    outputRoot: path.join(packagingRoot, "out"),
    builderConfigPath: path.join(paths.appRoot, "electron-builder.local-test.json"),
    generatedConfigPath: path.join(packagingRoot, "electron-builder.generated.json"),
    builderCliPath: path.join(paths.repoRoot, "node_modules", "electron-builder", "cli.js"),
    sharedSourceRoot: path.join(paths.repoRoot, "packages", "shared")
  };
}

function resolveBuilderTarget(target) {
  return target === "portable" ? "dir" : target;
}

function buildStagePackageJson(version, sharedVersion) {
  return {
    name: "openclaw-studio-local-alpha",
    productName: "OpenClaw Studio",
    version,
    private: true,
    author: "OpenClaw",
    description: "Local Windows alpha package stage for OpenClaw Studio.",
    main: "dist-electron/electron/main.js",
    dependencies: {
      "@openclaw/shared": sharedVersion || version
    }
  };
}

function prepareStage(summary, packagingPaths) {
  const appPackageJson = readJson(path.join(summary.paths.appRoot, "package.json"));
  const sharedPackageJson = readJson(path.join(packagingPaths.sharedSourceRoot, "package.json"));
  const sharedStageRoot = path.join(packagingPaths.stageRoot, "node_modules", "@openclaw", "shared");

  fs.rmSync(packagingPaths.stageRoot, { recursive: true, force: true });
  fs.rmSync(packagingPaths.outputRoot, { recursive: true, force: true });
  fs.mkdirSync(packagingPaths.stageRoot, { recursive: true });
  fs.mkdirSync(packagingPaths.outputRoot, { recursive: true });

  copyDirectory(summary.paths.rendererRoot, path.join(packagingPaths.stageRoot, "dist-renderer"));
  copyDirectory(summary.paths.electronRoot, path.join(packagingPaths.stageRoot, "dist-electron"));

  fs.mkdirSync(sharedStageRoot, { recursive: true });
  fs.writeFileSync(
    path.join(sharedStageRoot, "package.json"),
    `${JSON.stringify(sharedPackageJson, null, 2)}\n`,
    "utf8"
  );
  copyDirectory(path.join(packagingPaths.sharedSourceRoot, "dist"), path.join(sharedStageRoot, "dist"));

  fs.writeFileSync(
    path.join(packagingPaths.stageRoot, "package.json"),
    `${JSON.stringify(buildStagePackageJson(appPackageJson.version, sharedPackageJson.version), null, 2)}\n`,
    "utf8"
  );
}

function writeGeneratedBuilderConfig(paths, packagingPaths) {
  const appPackageJson = readJson(path.join(paths.appRoot, "package.json"));
  const baseConfig = readJson(packagingPaths.builderConfigPath);
  const electronVersion = normalizeElectronVersion(
    appPackageJson.optionalDependencies?.electron ??
      appPackageJson.devDependencies?.electron ??
      appPackageJson.dependencies?.electron
  );

  if (!electronVersion) {
    throw new Error("Could not determine the Electron version for Windows local packaging.");
  }

  fs.mkdirSync(packagingPaths.packagingRoot, { recursive: true });
  fs.writeFileSync(
    packagingPaths.generatedConfigPath,
    `${JSON.stringify({ ...baseConfig, electronVersion }, null, 2)}\n`,
    "utf8"
  );
}

function resolveFrom(specifier, searchPaths) {
  try {
    return require.resolve(specifier, { paths: searchPaths });
  } catch {
    return null;
  }
}

function getLocalBuilderReadiness(paths, packagingPaths) {
  if (!fs.existsSync(packagingPaths.builderCliPath)) {
    return {
      ready: false,
      reason: `Local electron-builder CLI is missing: ${packagingPaths.builderCliPath}`
    };
  }

  const searchPaths = [paths.appRoot, paths.repoRoot, path.dirname(packagingPaths.builderCliPath)];

  for (const specifier of LOCAL_BUILDER_REQUIRED_MODULES) {
    const resolved = resolveFrom(specifier, searchPaths);

    if (!resolved) {
      return {
        ready: false,
        reason: `Local electron-builder dependency is missing: ${specifier}`
      };
    }
  }

  return {
    ready: true,
    reason: null
  };
}

function resolveAppBuilderBinSpec(paths, packagingPaths) {
  const builderUtilPackagePath = resolveFrom("builder-util/package.json", [
    paths.appRoot,
    paths.repoRoot,
    path.dirname(packagingPaths.builderCliPath)
  ]);

  if (!builderUtilPackagePath) {
    return null;
  }

  const builderUtilPackageJson = readJson(builderUtilPackagePath);
  return builderUtilPackageJson.dependencies?.["app-builder-bin"] ?? null;
}

function resolveBuilderInvocation(paths, packagingPaths) {
  const appPackageJson = readJson(path.join(paths.appRoot, "package.json"));
  const builderSpec = appPackageJson.devDependencies?.["electron-builder"] ?? "24.13.3";
  const localBuilder = getLocalBuilderReadiness(paths, packagingPaths);

  if (localBuilder.ready) {
    return {
      command: process.execPath,
      args: [packagingPaths.builderCliPath],
      shell: false,
      mode: "local",
      note: null
    };
  }

  const extraPackages = [`electron-builder@${builderSpec}`];
  const appBuilderBinSpec = resolveAppBuilderBinSpec(paths, packagingPaths);

  if (appBuilderBinSpec) {
    extraPackages.push(`app-builder-bin@${appBuilderBinSpec}`);
  }

  const npmExecPackageArgs = extraPackages.flatMap((specifier) => ["--package", specifier]);
  const note = `${localBuilder.reason}. Falling back to npm exec for an isolated builder toolchain.`;

  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd", "exec", "--yes", ...npmExecPackageArgs, "--", "electron-builder"],
      shell: false,
      mode: "npm-exec",
      note
    };
  }

  return {
    command: "npm",
    args: ["exec", "--yes", ...npmExecPackageArgs, "--", "electron-builder"],
    shell: false,
    mode: "npm-exec",
    note
  };
}

function resolveLocalToolPath(packageSpecs, toolName, cwd) {
  const searchPaths = [cwd, path.join(cwd, "apps", "studio")];

  for (const specifier of packageSpecs) {
    const packageJsonPath = resolveFrom(`${specifier}/package.json`, searchPaths);

    if (!packageJsonPath) {
      continue;
    }

    const packageJson = readJson(packageJsonPath);
    const relativeToolPath =
      typeof packageJson.bin === "string"
        ? packageJson.bin
        : packageJson.bin?.[toolName] ?? Object.values(packageJson.bin ?? {})[0] ?? null;

    if (!relativeToolPath) {
      continue;
    }

    return path.join(path.dirname(packageJsonPath), relativeToolPath);
  }

  return null;
}

function runNpmExecTool(packageSpecs, toolName, args, cwd) {
  const normalizedPackages = packageSpecs.filter(Boolean);
  const localToolPath = resolveLocalToolPath(normalizedPackages, toolName, cwd);

  if (localToolPath) {
    const result = spawnSync(process.execPath, [localToolPath, ...args], {
      cwd,
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env
      }
    });

    if (result.error) {
      throw result.error;
    }

    if ((result.status ?? 1) !== 0) {
      throw new Error(`${toolName} exited with code ${result.status ?? 1}`);
    }

    return;
  }

  const packageArgs = normalizedPackages.flatMap((specifier) => ["--package", specifier]);

  if (process.platform === "win32") {
    const result = spawnSync(
      process.env.ComSpec || "cmd.exe",
      ["/d", "/s", "/c", "npm.cmd", "exec", "--yes", ...packageArgs, "--", toolName, ...args],
      {
        cwd,
        stdio: "inherit",
        shell: false,
        env: {
          ...process.env
        }
      }
    );

    if (result.error) {
      throw result.error;
    }

    if ((result.status ?? 1) !== 0) {
      throw new Error(`${toolName} exited with code ${result.status ?? 1}`);
    }

    return;
  }

  const result = spawnSync("npm", ["exec", "--yes", ...packageArgs, "--", toolName, ...args], {
    cwd,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env
    }
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`${toolName} exited with code ${result.status ?? 1}`);
  }
}

function runBuilder(paths, packagingPaths, target) {
  const builder = resolveBuilderInvocation(paths, packagingPaths);
  const builderTarget = resolveBuilderTarget(target);
  const args = [
    ...builder.args,
    "--config",
    packagingPaths.generatedConfigPath,
    "--projectDir",
    paths.appRoot,
    "--win",
    builderTarget,
    "--x64"
  ];

  if (builder.note) {
    console.log(builder.note);
  }

  const result = spawnSync(builder.command, args, {
    cwd: paths.appRoot,
    stdio: "inherit",
    shell: builder.shell,
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: "false"
    }
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`electron-builder exited with code ${result.status ?? 1}`);
  }

  return builder;
}

function patchPackagedSharedDist(paths, packagingPaths) {
  const appAsarPath = path.join(packagingPaths.outputRoot, "win-unpacked", "resources", "app.asar");

  if (!fs.existsSync(appAsarPath)) {
    return;
  }

  const patchRoot = path.join(packagingPaths.packagingRoot, "asar-shared-patch");
  const extractedRoot = path.join(patchRoot, "app");
  const packagedSharedRoot = path.join(extractedRoot, "node_modules", "@openclaw", "shared");

  fs.rmSync(patchRoot, { recursive: true, force: true });
  fs.mkdirSync(patchRoot, { recursive: true });

  runNpmExecTool(["@electron/asar"], "asar", ["extract", appAsarPath, extractedRoot], paths.repoRoot);

  fs.mkdirSync(packagedSharedRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packagedSharedRoot, "package.json"),
    `${JSON.stringify(readJson(path.join(packagingPaths.sharedSourceRoot, "package.json")), null, 2)}\n`,
    "utf8"
  );
  copyDirectory(path.join(packagingPaths.sharedSourceRoot, "dist"), path.join(packagedSharedRoot, "dist"));

  fs.rmSync(appAsarPath, { force: true });
  runNpmExecTool(["@electron/asar"], "asar", ["pack", extractedRoot, appAsarPath], paths.repoRoot);
  fs.rmSync(patchRoot, { recursive: true, force: true });
}

function createPortableArchive(paths, packagingPaths) {
  const appPackageJson = readJson(path.join(paths.appRoot, "package.json"));
  const unpackedRoot = path.join(packagingPaths.outputRoot, "win-unpacked");

  if (!fs.existsSync(unpackedRoot)) {
    throw new Error(`Portable archive packaging could not find ${unpackedRoot}.`);
  }

  const archiveName = `OpenClaw-Studio-${appPackageJson.version}-alpha-x64-portable.zip`;
  const archivePath = path.join(packagingPaths.outputRoot, archiveName);

  fs.rmSync(archivePath, { force: true });

  const result = spawnSync("tar.exe", ["-a", "-cf", archiveName, "win-unpacked"], {
    cwd: packagingPaths.outputRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`portable archive creation exited with code ${result.status ?? 1}`);
  }

  return archivePath;
}

function scanFiles(root) {
  const files = [];

  if (!fs.existsSync(root)) {
    return files;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...scanFiles(absolutePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function selectLaunchTarget(packagingPaths, target) {
  const unpackedRoot = path.join(packagingPaths.outputRoot, "win-unpacked");
  const preferredExecutable = path.join(unpackedRoot, "OpenClaw Studio.exe");

  if (fs.existsSync(preferredExecutable)) {
    return preferredExecutable;
  }

  if (target === "dir") {
    const unpackedFiles = scanFiles(unpackedRoot).filter((filePath) => filePath.toLowerCase().endsWith(".exe"));
    return unpackedFiles[0] ?? null;
  }

  const unpackedFiles = scanFiles(unpackedRoot).filter((filePath) => filePath.toLowerCase().endsWith(".exe"));
  return unpackedFiles[0] ?? null;
}

function collectPackageResult(packagingPaths, target) {
  const entries = fs.existsSync(packagingPaths.outputRoot)
    ? fs.readdirSync(packagingPaths.outputRoot, { withFileTypes: true }).map((entry) => {
        const absolutePath = path.join(packagingPaths.outputRoot, entry.name);
        const stats = fs.statSync(absolutePath);

        return {
          name: entry.name,
          path: absolutePath,
          type: entry.isDirectory() ? "directory" : "file",
          size: stats.size
        };
      })
    : [];

  return {
    target,
    outputRoot: packagingPaths.outputRoot,
    entries,
    launchTarget: selectLaunchTarget(packagingPaths, target)
  };
}

function assertWindowsHost() {
  if (process.platform !== "win32") {
    throw new Error(
      "OpenClaw Studio Windows local packaging must run on a Windows host. Use a Windows shell against a local or UNC-accessible checkout after `npm run build` has completed."
    );
  }
}

function packageWindowsLocalTarget(target, options = {}) {
  const { requireWindowsHost = true } = options;

  if (requireWindowsHost) {
    assertWindowsHost();
  }

  const summary = getPreflightSummary();
  const paths = getPaths();
  const packagingPaths = getPackagingPaths(paths);

  if (!summary.buildReady) {
    throw new Error(
      [
        "OpenClaw Studio Windows local packaging could not start because build artifacts are missing.",
        formatPreflightSummary(summary),
        "Run `npm run build --workspace @openclaw/studio` and try again."
      ].join("\n")
    );
  }

  prepareStage(summary, packagingPaths);
  writeGeneratedBuilderConfig(paths, packagingPaths);
  const builder = runBuilder(paths, packagingPaths, target);

  if (target === "portable") {
    createPortableArchive(paths, packagingPaths);
  }

  const result = collectPackageResult(packagingPaths, target);

  return {
    ...result,
    builderMode: builder.mode,
    packagingRoot: packagingPaths.packagingRoot,
    stageRoot: packagingPaths.stageRoot,
    generatedConfigPath: packagingPaths.generatedConfigPath
  };
}

function main() {
  try {
    assertWindowsHost();

    const target = resolveTarget(process.argv.slice(2));
    const result = packageWindowsLocalTarget(target);

    console.log(`OpenClaw Studio Windows local package: staged ${target} target under ${result.stageRoot}`);
    console.log(`OpenClaw Studio Windows local package created under ${result.outputRoot}`);

    if (result.launchTarget) {
      console.log(`Launch target: ${result.launchTarget}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_TARGET,
  VALID_TARGETS,
  collectPackageResult,
  copyDirectory,
  copyPath,
  getPackagingPaths,
  packageWindowsLocalTarget,
  resolveTarget,
  scanFiles,
  selectLaunchTarget
};
