const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const DATE = "20260426";
const VERSION = process.env.OPENCLAW_RELEASE_VERSION || "v0.1.0-preview.2";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false
  });

  return {
    status: result.status ?? 1,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim()
  };
}

function reportPath(deliveryRoot, id) {
  return path.join(deliveryRoot, `${id}-${DATE}.json`);
}

function reportMdPath(deliveryRoot, id) {
  return path.join(deliveryRoot, `${id}-${DATE}.md`);
}

function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function artifactSummary(label, artifact) {
  if (!artifact) {
    return {
      label,
      path: null,
      exists: false,
      size: null,
      sha256: null,
      actualSha256: null,
      hashMatches: false
    };
  }

  const exists = Boolean(artifact.path && fs.existsSync(artifact.path));
  const actualSha256 = exists ? hashFile(artifact.path) : null;
  return {
    label,
    path: artifact.path,
    exists,
    size: exists ? fs.statSync(artifact.path).size : artifact.size ?? null,
    reportedSize: artifact.size ?? null,
    sha256: artifact.sha256 ?? null,
    actualSha256,
    hashMatches: exists && artifact.sha256 ? actualSha256 === String(artifact.sha256).toUpperCase() : false,
    lastModified: exists ? fs.statSync(artifact.path).mtime.toISOString() : artifact.lastModified ?? null
  };
}

function uiSummary(label, report, expectedPages) {
  return {
    label,
    status: report?.status ?? "missing",
    pages: countItems(report?.pages),
    screenshots: countItems(report?.screenshots),
    warnings: countItems(report?.warnings),
    failures: countItems(report?.failures),
    expectedPages,
    pageCountMatches: countItems(report?.pages) === expectedPages,
    screenshotCountMatches: countItems(report?.screenshots) === expectedPages
  };
}

function artifactRow(artifact) {
  return `| ${artifact.label} | \`${artifact.path ?? "missing"}\` | ${artifact.size ?? ""} | \`${artifact.sha256 ?? ""}\` | ${artifact.hashMatches ? "yes" : "no"} |`;
}

function uiRow(entry) {
  return `| ${entry.label} | ${entry.status} | ${entry.pages} | ${entry.screenshots} | ${entry.warnings} | ${entry.failures} |`;
}

function statusBadge(value) {
  return value ?? "missing";
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");

  const phase7 = readJsonIfExists(reportPath(deliveryRoot, "phase7-package-closeout"));
  const phase8 = readJsonIfExists(reportPath(deliveryRoot, "phase8-installer-closeout"));
  const phase9 = readJsonIfExists(reportPath(deliveryRoot, "phase9-release-gate"));
  const phase10 = readJsonIfExists(reportPath(deliveryRoot, "phase10-signing-readiness"));
  const phase11 = readJsonIfExists(reportPath(deliveryRoot, "phase11-ui-full-check"));
  const phase12Portable = readJsonIfExists(reportPath(deliveryRoot, "phase12-portable-ui-full-check"));
  const phase12Installed = readJsonIfExists(reportPath(deliveryRoot, "phase12-installed-ui-full-check"));
  const phase12Theme = readJsonIfExists(reportPath(deliveryRoot, "phase12-theme-viewport-check"));
  const phase13 = readJsonIfExists(reportPath(deliveryRoot, "phase13-public-release-handoff"));
  const phase17 = readJsonIfExists(reportPath(deliveryRoot, "phase17-signing-handoff-audit"));
  const phase18 = readJsonIfExists(reportPath(deliveryRoot, "phase18-github-public-preview-pack"));
  const phase19 = readJsonIfExists(reportPath(deliveryRoot, "phase19-github-release-staging"));

  const expectedPages = countItems(phase11?.pages) || 6;
  const artifacts = [
    artifactSummary("Windows NSIS installer", phase8?.artifacts?.installer),
    artifactSummary("NSIS blockmap", phase8?.artifacts?.blockMap),
    artifactSummary("Windows portable zip", phase7?.artifacts?.portableZip),
    artifactSummary("Windows portable executable", phase7?.artifacts?.portableExe),
    artifactSummary("RC Windows zip", phase7?.artifacts?.rcZip),
    artifactSummary("RC executable", phase7?.artifacts?.rcExe)
  ];

  const ui = [
    uiSummary("RC unpacked app", phase11, expectedPages),
    uiSummary("Portable app", phase12Portable, expectedPages),
    uiSummary("Installed NSIS app", phase12Installed, expectedPages)
  ];

  const blockers = [];
  const warnings = [];

  for (const [label, report] of [
    ["Phase 7 package closeout", phase7],
    ["Phase 8 installer closeout", phase8],
    ["Phase 11 UI full check", phase11],
    ["Phase 12 portable UI full check", phase12Portable],
    ["Phase 12 installed UI full check", phase12Installed]
  ]) {
    if (!report) {
      blockers.push({ id: "required-report-missing", detail: `${label} report is missing.` });
    } else if (report.status !== "passed") {
      blockers.push({ id: "required-report-not-passed", detail: `${label} status is ${report.status}.` });
    }
  }

  for (const artifact of artifacts) {
    if (!artifact.exists) {
      blockers.push({ id: "artifact-missing", detail: `${artifact.label} is missing: ${artifact.path}` });
    } else if (!artifact.hashMatches) {
      blockers.push({ id: "artifact-hash-mismatch", detail: `${artifact.label} hash does not match its upstream report.` });
    }
  }

  for (const entry of ui) {
    if (entry.status !== "passed") {
      blockers.push({ id: "ui-report-not-passed", detail: `${entry.label} UI report status is ${entry.status}.` });
    }
    if (!entry.pageCountMatches || !entry.screenshotCountMatches) {
      blockers.push({
        id: "ui-page-contract-mismatch",
        detail: `${entry.label} expected ${expectedPages} pages/screenshots but saw ${entry.pages}/${entry.screenshots}.`
      });
    }
    if (entry.warnings || entry.failures) {
      blockers.push({
        id: "ui-report-has-warnings-or-failures",
        detail: `${entry.label} has ${entry.warnings} warnings and ${entry.failures} failures.`
      });
    }
  }

  if (phase12Theme && phase12Theme.status !== "passed") {
    warnings.push(`Theme/viewport check is present but not passed: ${phase12Theme.status}.`);
  }

  if (phase9?.status !== "public-release-ready") {
    warnings.push("Public release remains blocked until trusted signing prerequisites are resolved.");
  }

  if (phase19?.status && phase19.status !== "github-release-upload-staged") {
    warnings.push(`GitHub release staging is not upload-ready: ${phase19.status}.`);
  }

  const head = run("git", ["rev-parse", "HEAD"], repoRoot);
  const tagCommit = run("git", ["rev-list", "-n", "1", VERSION], repoRoot);
  const remotes = run("git", ["remote", "-v"], repoRoot);
  const statusShort = run("git", ["status", "--short"], repoRoot);
  const ghStatus = run("gh", ["auth", "status"], repoRoot);

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0
      ? phase18?.status === "github-public-preview-pack-ready"
        ? "release-candidate-ready-for-github-preview"
        : "runtime-release-closeout-ready"
      : "runtime-release-closeout-blocked",
    version: VERSION,
    appRoot,
    deliveryRoot,
    artifacts,
    runtimeUiVerification: {
      expectedVisiblePages: expectedPages,
      reports: ui,
      themeViewport: phase12Theme
        ? {
            status: phase12Theme.status,
            screenshots: countItems(phase12Theme.screenshots),
            failures: countItems(phase12Theme.failures)
          }
        : null
    },
    signing: {
      releaseGateStatus: phase9?.status ?? "missing",
      signingReadinessStatus: phase10?.status ?? "missing",
      installerAuthenticodeStatus: phase8?.signature?.status ?? "unknown",
      publicReleaseBlockers: phase9?.publicRelease?.blockers ?? [],
      signingReadinessBlockers: phase10?.blockers ?? []
    },
    handoff: {
      publicReleaseHandoffStatus: phase13?.status ?? "missing",
      signingHandoffAuditStatus: phase17?.status ?? "missing"
    },
    releaseStaging: {
      publicPreviewPackStatus: phase18?.status ?? "missing",
      publicPreviewRoot: phase18?.publicRoot ?? path.join(deliveryRoot, `github-public-preview-${DATE}`),
      uploadStagingStatus: phase19?.status ?? "missing",
      uploadRoot: phase19?.uploadRoot ?? path.join(deliveryRoot, `github-release-upload-${DATE}`),
      releaseNotes: phase19?.releaseNotes ?? null,
      stagedAssetCount: countItems(phase19?.stagedAssets),
      stagedAssetLabels: Array.isArray(phase19?.stagedAssets)
        ? phase19.stagedAssets.map((asset) => ({
            label: asset.label,
            role: asset.role,
            size: asset.size
          }))
        : []
    },
    git: {
      head: head.stdout || null,
      tag: VERSION,
      tagCommit: tagCommit.stdout || null,
      tagAlignedWithHead: Boolean(head.stdout && tagCommit.stdout && head.stdout === tagCommit.stdout),
      remotes: remotes.stdout,
      dirtyFiles: statusShort.stdout ? statusShort.stdout.split(/\r?\n/).filter(Boolean).length : 0
    },
    githubCli: {
      loggedIn: (ghStatus.status ?? 1) === 0
    },
    boundaries: [
      "Windows preview artifacts remain unsigned until trusted code-signing material is supplied.",
      "Generated installers and portable zips are release assets, not Git-tracked source files.",
      "GitHub Release publication requires an authenticated GitHub CLI session or manual browser upload."
    ],
    warnings,
    blockers
  };

  writeJson(path.join(deliveryRoot, `phase20-runtime-release-closeout-${DATE}.json`), report);

  const md = [
    "# Phase 20 Runtime Release Closeout - 2026-04-26",
    "",
    "## Status",
    "",
    report.status,
    "",
    "## Current Build Assets",
    "",
    "| Asset | Path | Size | SHA256 | Hash matches report |",
    "|---|---|---:|---|---:|",
    ...artifacts.map(artifactRow),
    "",
    "## Runtime UI Verification",
    "",
    `- Expected visible pages: ${expectedPages}`,
    "",
    "| Form | Status | Pages | Screenshots | Warnings | Failures |",
    "|---|---|---:|---:|---:|---:|",
    ...ui.map(uiRow),
    "",
    "## Theme And Viewport Verification",
    "",
    phase12Theme
      ? `- Status: ${phase12Theme.status}; screenshots: ${countItems(phase12Theme.screenshots)}; failures: ${countItems(phase12Theme.failures)}`
      : "- Not available in this phase run.",
    "",
    "## Signing And Release Boundary",
    "",
    `- Phase 9 release gate: ${statusBadge(report.signing.releaseGateStatus)}`,
    `- Phase 10 signing readiness: ${statusBadge(report.signing.signingReadinessStatus)}`,
    `- Installer Authenticode: ${statusBadge(report.signing.installerAuthenticodeStatus)}`,
    `- Public release handoff: ${statusBadge(report.handoff.publicReleaseHandoffStatus)}`,
    `- Signing handoff audit: ${statusBadge(report.handoff.signingHandoffAuditStatus)}`,
    "",
    "## GitHub Preview Staging",
    "",
    `- Public preview pack: ${statusBadge(report.releaseStaging.publicPreviewPackStatus)}`,
    `- Upload staging: ${statusBadge(report.releaseStaging.uploadStagingStatus)}`,
    `- Public preview root: \`${report.releaseStaging.publicPreviewRoot}\``,
    `- Upload root: \`${report.releaseStaging.uploadRoot}\``,
    report.releaseStaging.releaseNotes ? `- Release notes: \`${report.releaseStaging.releaseNotes}\`` : "- Release notes: not staged yet",
    `- Git tag ${VERSION} aligned with HEAD: ${report.git.tagAlignedWithHead ? "yes" : "no"}`,
    `- GitHub CLI logged in: ${report.githubCli.loggedIn ? "yes" : "no"}`,
    "",
    "## Blockers",
    "",
    ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker.id}: ${blocker.detail}`) : ["- none"]),
    "",
    "## Warnings",
    "",
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    "## Verification",
    "",
    "```powershell",
    `npm run -C "${appRoot}" phase20:runtime-release-closeout`,
    "```",
    ""
  ].join("\n");

  writeFile(reportMdPath(deliveryRoot, "phase20-runtime-release-closeout"), md);

  console.log(`Phase 20 runtime release closeout: ${report.status}`);
  console.log(`Report: ${path.join(deliveryRoot, `phase20-runtime-release-closeout-${DATE}.json`)}`);
  console.log(`Closeout: ${reportMdPath(deliveryRoot, "phase20-runtime-release-closeout")}`);

  if (blockers.length > 0) {
    for (const blocker of blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exit(1);
  }
}

main();
