const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const DELIVERY_DATE = "20260427";
const UPSTREAM_DATE = "20260426";
const DEFAULT_VERSION = "v0.1.0-preview.4";
const REPO = process.env.OPENCLAW_GITHUB_REPO || "qz057/openclaw-studio";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
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

function basename(filePath) {
  return path.basename(filePath);
}

async function fetchReleaseViaApi(repo, version) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${version}`, {
    headers: {
      "User-Agent": "openclaw-studio-release-closeout"
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      detail: `GitHub API release lookup returned ${response.status}.`
    };
  }

  const release = await response.json();
  return {
    ok: true,
    release: {
      tagName: release.tag_name,
      name: release.name,
      isPrerelease: release.prerelease,
      url: release.html_url,
      assets: (release.assets ?? []).map((asset) => ({
        name: asset.name,
        size: asset.size
      }))
    }
  };
}

async function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const phase19Path = path.join(deliveryRoot, `phase19-github-release-staging-${UPSTREAM_DATE}.json`);
  const phase20Path = path.join(deliveryRoot, `phase20-runtime-release-closeout-${UPSTREAM_DATE}.json`);

  if (!fs.existsSync(phase19Path)) {
    throw new Error(`Missing Phase 19 staging report: ${phase19Path}`);
  }

  const phase19 = readJson(phase19Path);
  const phase20 = fs.existsSync(phase20Path) ? readJson(phase20Path) : null;
  const version = process.env.OPENCLAW_RELEASE_VERSION || phase19.version || DEFAULT_VERSION;
  const releaseResult = run("gh", [
    "release",
    "view",
    version,
    "--repo",
    REPO,
    "--json",
    "tagName,name,isPrerelease,url,assets"
  ], repoRoot);

  const blockers = [];
  const warnings = [];
  let release = null;
  let releaseSource = "gh";

  if (releaseResult.status === 0) {
    release = JSON.parse(releaseResult.stdout);
  } else {
    const apiResult = await fetchReleaseViaApi(REPO, version);
    if (apiResult.ok) {
      release = apiResult.release;
      releaseSource = "github-api";
      warnings.push("GitHub CLI release view failed, so Phase 21 used the public GitHub API fallback.");
    } else {
      releaseSource = "missing";
      blockers.push({
        id: "github-release-view-failed",
        detail:
          `${releaseResult.stderr || releaseResult.stdout || `gh release view exited with ${releaseResult.status}`} ` +
          `GitHub API fallback: ${apiResult.detail}`
      });
    }
  }

  if (!release) {
    blockers.push({
      id: "github-release-missing",
      detail: `${version} is not visible as a GitHub release for ${REPO}.`
    });
  }

  const expectedAssets = [
    ...(phase19.stagedAssets ?? []).map((asset) => ({
      name: basename(asset.target),
      size: asset.size,
      role: asset.role,
      sha256: asset.sha256
    })),
    {
      name: "SHA256SUMS.txt",
      size: fs.existsSync(phase19.sha256Sums) ? fs.statSync(phase19.sha256Sums).size : null,
      role: "checksum-manifest",
      sha256: null
    }
  ];
  const releaseAssets = release?.assets ?? [];
  const releaseAssetMap = new Map(releaseAssets.map((asset) => [asset.name, asset]));
  const assetChecks = expectedAssets.map((expected) => {
    const actual = releaseAssetMap.get(expected.name);
    return {
      name: expected.name,
      role: expected.role,
      expectedSize: expected.size,
      releaseSize: actual?.size ?? null,
      existsOnRelease: Boolean(actual),
      sizeMatches: Boolean(actual) && expected.size === actual.size,
      sha256: expected.sha256
    };
  });

  if (release) {
    if (release.tagName !== version) {
      blockers.push({
        id: "github-release-tag-mismatch",
        detail: `Expected ${version}, got ${release.tagName}.`
      });
    }

    if (!release.isPrerelease) {
      blockers.push({
        id: "github-release-not-prerelease",
        detail: "GitHub release is not marked as a prerelease."
      });
    }
  }

  for (const asset of assetChecks) {
    if (!asset.existsOnRelease) {
      blockers.push({
        id: "github-release-asset-missing",
        detail: `${asset.name} is missing from the GitHub release.`
      });
    } else if (!asset.sizeMatches) {
      blockers.push({
        id: "github-release-asset-size-mismatch",
        detail: `${asset.name} expected ${asset.expectedSize} bytes, got ${asset.releaseSize}.`
      });
    }
  }

  for (const asset of releaseAssets) {
    if (!expectedAssets.some((expected) => expected.name === asset.name)) {
      warnings.push(`Unexpected release asset is present on GitHub: ${asset.name}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0 ? "github-prerelease-published" : "github-prerelease-closeout-blocked",
    version,
    repo: REPO,
    release: release
      ? {
          tagName: release.tagName,
          name: release.name,
          isPrerelease: release.isPrerelease,
          url: release.url,
          assetCount: releaseAssets.length,
          source: releaseSource
        }
      : null,
    upstream: {
      phase19Status: phase19.status,
      phase20Status: phase20?.status ?? "missing"
    },
    assetChecks,
    warnings,
    blockers
  };

  const reportPath = path.join(deliveryRoot, `phase21-github-prerelease-closeout-${DELIVERY_DATE}.json`);
  writeJson(reportPath, report);

  const closeoutPath = path.join(deliveryRoot, `phase21-github-prerelease-closeout-${DELIVERY_DATE}.md`);
  writeFile(
    closeoutPath,
    [
      "# Phase 21 GitHub Prerelease Closeout - 2026-04-27",
      "",
      "## Status",
      "",
      report.status,
      "",
      "## Release",
      "",
      `- repo: \`${REPO}\``,
      `- tag: \`${version}\``,
      report.release?.url ? `- url: ${report.release.url}` : "- url: missing",
      `- prerelease: ${report.release?.isPrerelease ? "yes" : "no"}`,
      `- assets: ${report.release?.assetCount ?? 0}`,
      "",
      "## Asset Checks",
      "",
      "| Asset | Exists | Expected Size | Release Size |",
      "|---|---:|---:|---:|",
      ...assetChecks.map((asset) => `| ${asset.name} | ${asset.existsOnRelease ? "yes" : "no"} | ${asset.expectedSize ?? ""} | ${asset.releaseSize ?? ""} |`),
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
      `npm run -C "${appRoot}" phase21:github-prerelease-closeout`,
      "```",
      ""
    ].join("\n")
  );

  console.log(`Phase 21 GitHub prerelease closeout: ${report.status}`);
  console.log(`Release: ${report.release?.url ?? "missing"}`);
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
