const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { getPreflightSummary } = require("./studio-preflight.cjs");
const {
  createReleaseSkeleton,
  formatReleasePlanSummary,
  verifyReleaseSkeletonOutput,
  writeReleaseSkeleton
} = require("./release-skeleton.cjs");
const { copyPath, packageWindowsLocalTarget, resolveTarget, scanFiles } = require("./package-windows-local.cjs");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendSection(filePath, section) {
  const current = fs.readFileSync(filePath, "utf8");
  const normalized = current.endsWith("\n") ? current : `${current}\n`;
  fs.writeFileSync(filePath, `${normalized}\n${section.trim()}\n`, "utf8");
}

function resolveWindowsAlphaTarget() {
  const envTarget = process.env.OPENCLAW_STUDIO_WINDOWS_PACKAGE_TARGET;

  if (!envTarget) {
    return "portable";
  }

  return resolveTarget([`--target=${envTarget}`]);
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function stageWindowsArtifacts(deliveryRoot, packageResult) {
  const installersRoot = path.join(deliveryRoot, "installers", "windows");

  try {
    fs.rmSync(installersRoot, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 1000
    });
  } catch (error) {
    console.warn(`Warning: Could not remove ${installersRoot}: ${error.message}`);
  }
  fs.mkdirSync(installersRoot, {
    recursive: true
  });

  for (const entry of packageResult.entries) {
    copyPath(entry.path, path.join(installersRoot, entry.name));
  }

  const files = scanFiles(installersRoot);
  const manifest = {
    platform: "windows",
    channel: "alpha",
    target: packageResult.target,
    outputRoot: installersRoot,
    launchTarget: packageResult.launchTarget ? path.relative(packageResult.outputRoot, packageResult.launchTarget) : null,
    builderMode: packageResult.builderMode,
    buildTimestamp: new Date().toISOString(),
    artifacts: files.map((filePath) => {
      const stats = fs.statSync(filePath);

      return {
        file: path.relative(installersRoot, filePath),
        size: stats.size,
        sha256: hashFile(filePath)
      };
    })
  };

  const manifestPath = path.join(installersRoot, "INSTALLER-ARTIFACT-MANIFEST.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    installersRoot,
    manifestPath,
    fileCount: files.length,
    launchTarget: manifest.launchTarget,
    target: packageResult.target,
    builderMode: packageResult.builderMode
  };
}

function writeWindowsDeliveryMetadata(deliveryRoot, windowsArtifacts) {
  const relativeManifestPath = path
    .relative(deliveryRoot, windowsArtifacts.manifestPath)
    .split(path.sep)
    .join("/");
  const structuredPath = path.join(deliveryRoot, "release", "WINDOWS-LOCAL-ALPHA.json");
  const structured = {
    schemaVersion: "openclaw-studio-windows-local-alpha/v1",
    generatedAt: new Date().toISOString(),
    platform: "windows",
    channel: "alpha",
    status: "realized-local-alpha",
    target: windowsArtifacts.target,
    builderMode: windowsArtifacts.builderMode,
    installersRoot: path.relative(deliveryRoot, windowsArtifacts.installersRoot).split(path.sep).join("/"),
    manifestPath: relativeManifestPath,
    launchTarget: windowsArtifacts.launchTarget
      ? path.posix.join("installers/windows", windowsArtifacts.launchTarget.split(path.sep).join("/"))
      : null
  };

  writeJson(structuredPath, structured);

  const releaseManifestPath = path.join(deliveryRoot, "release", "RELEASE-MANIFEST.json");
  const releaseManifest = readJson(releaseManifestPath);
  releaseManifest.installer = {
    ...(releaseManifest.installer ?? {}),
    windowsLocalAlpha: {
      status: structured.status,
      target: structured.target,
      builderMode: structured.builderMode,
      manifestPath: structured.manifestPath,
      launchTarget: structured.launchTarget
    }
  };
  writeJson(releaseManifestPath, releaseManifest);

  const releaseSummarySection = `
## Windows local alpha package
- Realized on Windows host: yes
- Target: ${windowsArtifacts.target}
- Builder mode: ${windowsArtifacts.builderMode}
- Installers root: installers/windows
- Manifest: ${relativeManifestPath}
${windowsArtifacts.launchTarget ? `- Launch target: installers/windows/${windowsArtifacts.launchTarget.split(path.sep).join("/")}` : "- Launch target: unavailable"}
`;
  appendSection(path.join(deliveryRoot, "release", "RELEASE-SUMMARY.md"), releaseSummarySection);

  const packageReadmeSection = `
## Windows local alpha package

When \`package:alpha\` runs on a Windows host, it now copies a real local test package into \`installers/windows\`.

- Target: ${windowsArtifacts.target}
- Builder mode: ${windowsArtifacts.builderMode}
- Manifest: ${relativeManifestPath}
${windowsArtifacts.launchTarget ? `- Launch target: installers/windows/${windowsArtifacts.launchTarget.split(path.sep).join("/")}` : "- Launch target: unavailable"}
`;
  appendSection(path.join(deliveryRoot, "PACKAGE-README.md"), packageReadmeSection);
}

function main() {
  const summary = getPreflightSummary();

  if (!summary.buildReady) {
    console.error("OpenClaw Studio package snapshot could not be created because build artifacts are missing.");
    console.error("Run `npm run build` from the repo root and try again.");
    process.exit(1);
  }

  const skeleton = createReleaseSkeleton(summary);

  try {
    fs.rmSync(skeleton.paths.deliveryRoot, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 1000
    });
  } catch (error) {
    console.warn(`Warning: Could not remove ${skeleton.paths.deliveryRoot}: ${error.message}`);
    console.warn("Attempting to continue anyway...");
  }

  fs.mkdirSync(skeleton.paths.deliveryRoot, {
    recursive: true
  });

  writeReleaseSkeleton(skeleton.paths.deliveryRoot, skeleton);
  verifyReleaseSkeletonOutput(skeleton.paths.deliveryRoot, skeleton);

  let windowsArtifacts = null;

  if (process.platform === "win32") {
    const target = resolveWindowsAlphaTarget();
    const packageResult = packageWindowsLocalTarget(target);
    windowsArtifacts = stageWindowsArtifacts(skeleton.paths.deliveryRoot, packageResult);
    writeWindowsDeliveryMetadata(skeleton.paths.deliveryRoot, windowsArtifacts);
  }

  console.log(`OpenClaw Studio alpha package snapshot created at ${skeleton.paths.deliveryRoot}`);
  console.log(formatReleasePlanSummary(skeleton));

  if (windowsArtifacts) {
    console.log(
      `Windows alpha package copied to ${windowsArtifacts.installersRoot} (${windowsArtifacts.target}, ${windowsArtifacts.fileCount} files, builder ${windowsArtifacts.builderMode}).`
    );
    console.log(`Windows installer manifest: ${windowsArtifacts.manifestPath}`);

    if (windowsArtifacts.launchTarget) {
      console.log(`Windows launch target: ${windowsArtifacts.launchTarget}`);
    }
  } else {
    console.log("Windows installer packaging was skipped because this command is not running on a Windows host.");
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(`OpenClaw Studio package alpha failed: ${message}`);
  process.exit(1);
}
