const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function fileInfo(filePath) {
  const exists = fs.existsSync(filePath);

  if (!exists) {
    return {
      path: filePath,
      exists: false,
      size: null,
      sha256: null,
      lastModified: null
    };
  }

  const stats = fs.statSync(filePath);

  return {
    path: filePath,
    exists: true,
    size: stats.size,
    sha256: stats.isFile() ? hashFile(filePath) : null,
    lastModified: stats.mtime.toISOString()
  };
}

function listArchiveEntries(zipPath) {
  if (!fs.existsSync(zipPath)) {
    return [];
  }

  const result = spawnSync("tar.exe", ["-tf", zipPath], {
    encoding: "utf8",
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`Could not inspect archive ${zipPath}: ${result.stderr || result.stdout}`);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function findFiles(root, predicate) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const found = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      found.push(...findFiles(absolutePath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(absolutePath)) {
      found.push(absolutePath);
    }
  }

  return found;
}

function assertContains(entries, expected, label, failures) {
  if (!entries.some((entry) => entry.replaceAll("\\", "/").endsWith(expected))) {
    failures.push(`${label} is missing ${expected}`);
  }
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const releaseRoot = path.join(appRoot, "release");
  const localOutRoot = path.join(appRoot, ".packaging", "windows-local", "out");
  const portableZip = path.join(localOutRoot, "OpenClaw-Studio-0.1.0-alpha-x64-portable.zip");
  const portableExe = path.join(localOutRoot, "win-unpacked", "OpenClaw Studio.exe");
  const rcZip = path.join(releaseRoot, "OpenClaw Studio-0.1.0-win-x64.zip");
  const rcExe = path.join(releaseRoot, "win-unpacked", "OpenClaw Studio.exe");
  const setupCandidates = findFiles(releaseRoot, (filePath) => /setup.*\.exe$/i.test(path.basename(filePath)));
  const portableEntries = listArchiveEntries(portableZip);
  const rcEntries = listArchiveEntries(rcZip);
  const failures = [];

  if (!fs.existsSync(portableZip)) {
    failures.push(`Portable zip is missing: ${portableZip}`);
  }

  if (!fs.existsSync(portableExe)) {
    failures.push(`Portable launch executable is missing: ${portableExe}`);
  }

  if (!fs.existsSync(rcZip)) {
    failures.push(`RC zip is missing: ${rcZip}`);
  }

  if (!fs.existsSync(rcExe)) {
    failures.push(`RC launch executable is missing: ${rcExe}`);
  }

  assertContains(portableEntries, "win-unpacked/OpenClaw Studio.exe", "Portable archive", failures);
  assertContains(portableEntries, "win-unpacked/resources/app.asar", "Portable archive", failures);
  assertContains(rcEntries, "OpenClaw Studio.exe", "RC archive", failures);
  assertContains(rcEntries, "resources/app.asar", "RC archive", failures);

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "passed" : "failed",
    artifacts: {
      portableZip: fileInfo(portableZip),
      portableExe: fileInfo(portableExe),
      rcZip: fileInfo(rcZip),
      rcExe: fileInfo(rcExe)
    },
    archiveChecks: {
      portableEntryCount: portableEntries.length,
      rcEntryCount: rcEntries.length,
      portableRequiredEntries: ["win-unpacked/OpenClaw Studio.exe", "win-unpacked/resources/app.asar"],
      rcRequiredEntries: ["OpenClaw Studio.exe", "resources/app.asar"]
    },
    installerBoundary: {
      nsisInstallerGenerated: setupCandidates.length > 0,
      setupCandidates,
      status: setupCandidates.length > 0 ? "available" : "not-generated",
      reason:
        setupCandidates.length > 0
          ? null
          : "Current release configuration generates win-unpacked, RC zip, and local portable zip. NSIS installer remains outside this RC until explicit installer target and signing policy are enabled."
    },
    failures
  };

  fs.mkdirSync(deliveryRoot, { recursive: true });
  const reportPath = path.join(deliveryRoot, "phase7-package-closeout-20260426.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Phase 7 package closeout failed. Report: ${reportPath}`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Phase 7 package closeout passed. Report: ${reportPath}`);
  console.log(`Portable zip: ${report.artifacts.portableZip.size} bytes ${report.artifacts.portableZip.sha256}`);
  console.log(`RC zip: ${report.artifacts.rcZip.size} bytes ${report.artifacts.rcZip.sha256}`);
  console.log(`NSIS installer: ${report.installerBoundary.status}`);
}

main();
