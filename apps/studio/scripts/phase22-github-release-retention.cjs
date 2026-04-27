const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const DATE = "20260427";
const UPSTREAM_DATE = "20260426";
const REPO = process.env.OPENCLAW_GITHUB_REPO || "qz057/openclaw-studio";
const DEFAULT_ACTIVE_VERSION = "v0.1.0-preview.4";

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

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "")) : null;
}

function deriveRetiredVersions(activeVersion) {
  if (process.env.OPENCLAW_RETIRED_RELEASES) {
    return process.env.OPENCLAW_RETIRED_RELEASES
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const match = /^v(?<base>\d+\.\d+\.\d+)-preview\.(?<index>\d+)$/.exec(activeVersion);
  if (!match) {
    return ["v0.1.0-preview.1", "v0.1.0-preview.2", "v0.1.0-preview.3"];
  }

  const index = Number(match.groups.index);
  if (!Number.isInteger(index) || index <= 1) {
    return [];
  }

  return Array.from({ length: index - 1 }, (_, offset) => `v${match.groups.base}-preview.${offset + 1}`);
}

async function listReleasesViaApi(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
    headers: {
      "User-Agent": "openclaw-studio-release-retention"
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      detail: `GitHub API release list returned ${response.status}.`
    };
  }

  const releases = await response.json();
  return {
    ok: true,
    releases: releases.map((release) => ({
      tagName: release.tag_name,
      name: release.name,
      isPrerelease: release.prerelease
    }))
  };
}

async function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const phase19 = readJsonIfExists(path.join(deliveryRoot, `phase19-github-release-staging-${UPSTREAM_DATE}.json`));
  const activeVersion = process.env.OPENCLAW_RELEASE_VERSION || phase19?.version || DEFAULT_ACTIVE_VERSION;
  const retiredVersions = deriveRetiredVersions(activeVersion);
  const blockers = [];
  const warnings = [];

  const releaseListResult = run("gh", ["release", "list", "--repo", REPO, "--limit", "100", "--json", "tagName,name,isPrerelease"], repoRoot);
  let releases = [];
  let releaseSource = "gh";

  if (releaseListResult.status === 0) {
    releases = JSON.parse(releaseListResult.stdout);
  } else {
    const apiResult = await listReleasesViaApi(REPO);
    if (apiResult.ok) {
      releases = apiResult.releases;
      releaseSource = "github-api";
      warnings.push("GitHub CLI release list failed, so Phase 22 used the public GitHub API fallback.");
    } else {
      releaseSource = "missing";
      blockers.push({
        id: "github-release-list-failed",
        detail:
          `${releaseListResult.stderr || releaseListResult.stdout || `gh release list exited with ${releaseListResult.status}`} ` +
          `GitHub API fallback: ${apiResult.detail}`
      });
    }
  }

  if (releaseSource === "missing") {
    blockers.push({
      id: "github-release-list-unavailable",
      detail: `Could not list GitHub releases for ${REPO}.`
    });
  }

  const activeRelease = releases.find((release) => release.tagName === activeVersion);
  const retiredReleaseFindings = retiredVersions
    .map((version) => ({
      version,
      releasePresent: releases.some((release) => release.tagName === version)
    }));

  if (!activeRelease) {
    blockers.push({
      id: "active-release-missing",
      detail: `${activeVersion} is not present in GitHub releases.`
    });
  }

  for (const finding of retiredReleaseFindings) {
    if (finding.releasePresent) {
      blockers.push({
        id: "retired-release-still-present",
        detail: `${finding.version} still exists as a GitHub release.`
      });
    }
  }

  const remoteTagChecks = [];
  for (const version of [activeVersion, ...retiredVersions]) {
    const tagResult = run("git", ["ls-remote", "--tags", "origin", `${version}*`], repoRoot);
    if (tagResult.status !== 0) {
      blockers.push({
        id: "remote-tag-check-failed",
        detail: `Could not check remote tag ${version}: ${tagResult.stderr || tagResult.stdout}`
      });
      continue;
    }

    const present = tagResult.stdout.length > 0;
    remoteTagChecks.push({
      version,
      present,
      refs: tagResult.stdout ? tagResult.stdout.split(/\r?\n/).filter(Boolean) : []
    });
  }

  const activeTag = remoteTagChecks.find((entry) => entry.version === activeVersion);
  if (!activeTag?.present) {
    blockers.push({
      id: "active-tag-missing",
      detail: `${activeVersion} is not present on origin.`
    });
  }

  for (const entry of remoteTagChecks.filter((item) => retiredVersions.includes(item.version))) {
    if (entry.present) {
      blockers.push({
        id: "retired-tag-still-present",
        detail: `${entry.version} still exists on origin.`
      });
    }
  }

  const localTagsResult = run("git", ["tag", "--list", "v0.1.0-preview.*"], repoRoot);
  const localTags = localTagsResult.stdout ? localTagsResult.stdout.split(/\r?\n/).filter(Boolean) : [];
  for (const version of retiredVersions) {
    if (localTags.includes(version)) {
      warnings.push(`Retired local tag is still present: ${version}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0 ? "github-release-retention-clean" : "github-release-retention-blocked",
    repo: REPO,
    activeVersion,
    releaseSource,
    retiredVersions,
    activeRelease: activeRelease
      ? {
          tagName: activeRelease.tagName,
          name: activeRelease.name,
          isPrerelease: activeRelease.isPrerelease,
          url: `https://github.com/${REPO}/releases/tag/${activeVersion}`
        }
      : null,
    releaseTags: releases.map((release) => release.tagName),
    retiredReleaseFindings,
    remoteTagChecks,
    localTags,
    warnings,
    blockers
  };

  const reportPath = path.join(deliveryRoot, `phase22-github-release-retention-${DATE}.json`);
  writeJson(reportPath, report);

  const closeoutPath = path.join(deliveryRoot, `phase22-github-release-retention-${DATE}.md`);
  writeFile(
    closeoutPath,
    [
      "# Phase 22 GitHub Release Retention Closeout - 2026-04-27",
      "",
      "## Status",
      "",
      report.status,
      "",
      "## Active Release",
      "",
      `- repo: \`${REPO}\``,
      `- active version: \`${activeVersion}\``,
      report.activeRelease?.url ? `- url: ${report.activeRelease.url}` : "- url: missing",
      "",
      "## Retired Versions",
      "",
      ...retiredVersions.map((version) => {
        const releaseFinding = retiredReleaseFindings.find((item) => item.version === version);
        const tagFinding = remoteTagChecks.find((item) => item.version === version);
        return `- ${version}: release=${releaseFinding?.releasePresent ? "present" : "absent"}, remoteTag=${tagFinding?.present ? "present" : "absent"}`;
      }),
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
      `npm run -C "${appRoot}" phase22:github-release-retention`,
      "```",
      ""
    ].join("\n")
  );

  console.log(`Phase 22 GitHub release retention: ${report.status}`);
  console.log(`Report: ${reportPath}`);

  if (blockers.length > 0) {
    for (const blocker of blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
