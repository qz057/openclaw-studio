const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const DATE = "20260426";
const VERSION = process.env.OPENCLAW_RELEASE_VERSION || "v0.1.0-preview.4";
const TWO_GIB = 2 * 1024 * 1024 * 1024;

function releaseTitle(version) {
  const match = /^v?(\d+\.\d+\.\d+)-preview\.(\d+)$/.exec(version);
  if (match) {
    return `OpenClaw Studio v${match[1]} Preview ${match[2]}`;
  }

  return `OpenClaw Studio ${version}`;
}

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

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function copyFileVerified(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  const sourceHash = hashFile(source);
  const targetHash = hashFile(target);

  if (sourceHash !== targetHash) {
    throw new Error(`Hash mismatch after copy: ${source} -> ${target}`);
  }

  return {
    source,
    target,
    size: fs.statSync(target).size,
    sha256: targetHash
  };
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

function quotePs(value) {
  return String(value).replace(/'/g, "''");
}

function githubRepoFromRemote(remotesOutput) {
  const match = String(remotesOutput || "").match(/github\.com[:/](?<repo>[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?(?:\s|$)/);
  return match?.groups?.repo ?? null;
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const publicRoot = path.join(deliveryRoot, `github-public-preview-${DATE}`);
  const uploadRoot = path.join(deliveryRoot, `github-release-upload-${DATE}`);
  const assetsRoot = path.join(uploadRoot, "assets");
  const phase18Path = path.join(deliveryRoot, `phase18-github-public-preview-pack-${DATE}.json`);
  const phase18AssetsPath = path.join(publicRoot, "GITHUB_RELEASE_ASSETS.json");
  const releaseNotesPath = path.join(publicRoot, `RELEASE_NOTES_${VERSION}.md`);

  if (!fs.existsSync(phase18Path)) {
    throw new Error(`Missing Phase 18 report: ${phase18Path}`);
  }

  if (!fs.existsSync(phase18AssetsPath)) {
    throw new Error(`Missing Phase 18 release asset manifest: ${phase18AssetsPath}`);
  }

  if (!fs.existsSync(releaseNotesPath)) {
    throw new Error(`Missing release notes: ${releaseNotesPath}`);
  }

  fs.rmSync(uploadRoot, { recursive: true, force: true });
  fs.mkdirSync(assetsRoot, { recursive: true });

  const phase18 = readJson(phase18Path);
  const assetManifest = readJson(phase18AssetsPath);
  const releaseAssets = assetManifest.assets.filter((asset) => asset.role === "release-asset");
  const evidenceAssets = assetManifest.assets.filter((asset) => asset.role === "release-note-evidence");
  const optionalAssets = assetManifest.assets.filter((asset) => asset.role === "optional-release-asset");
  const staged = [];
  const blockers = [];
  const warnings = [];

  for (const asset of [...releaseAssets, ...evidenceAssets]) {
    if (!asset.exists || !fs.existsSync(asset.path)) {
      blockers.push({
        id: "release-upload-source-missing",
        detail: `${asset.label} source is missing: ${asset.path}`
      });
      continue;
    }

    if (asset.size >= TWO_GIB) {
      blockers.push({
        id: "release-upload-source-too-large",
        detail: `${asset.label} exceeds GitHub Release asset target size: ${asset.size}`
      });
      continue;
    }

    staged.push({
      label: asset.label,
      role: asset.role,
      publicWarning: asset.publicWarning,
      ...copyFileVerified(asset.path, path.join(assetsRoot, path.basename(asset.path)))
    });
  }

  for (const asset of optionalAssets) {
    if (asset.exists) {
      warnings.push(`Optional asset not staged by default: ${asset.label} (${asset.path})`);
    }
  }

  const shaLines = staged
    .map((asset) => `${asset.sha256}  ${path.basename(asset.target)}`)
    .sort();
  writeFile(path.join(assetsRoot, "SHA256SUMS.txt"), `${shaLines.join("\n")}\n`);

  const releaseNotesCopy = path.join(uploadRoot, `RELEASE_NOTES_${VERSION}.md`);
  const releaseNotes = fs.readFileSync(releaseNotesPath, "utf8");
  writeFile(releaseNotesCopy, releaseNotes);

  const ghStatus = run("gh", ["auth", "status"], repoRoot);
  const remotes = run("git", ["remote", "-v"], repoRoot);
  const githubRepo = githubRepoFromRemote(remotes.stdout) ?? "<github-owner>/<github-repo>";
  const [owner, repo] = githubRepo.includes("/")
    ? githubRepo.split("/", 2)
    : ["<github-owner>", "<github-repo>"];
  const currentCommit = run("git", ["rev-parse", "HEAD"], repoRoot);
  const tagCommit = run("git", ["rev-list", "-n", "1", VERSION], repoRoot);

  if ((currentCommit.status ?? 1) !== 0 || (tagCommit.status ?? 1) !== 0 || currentCommit.stdout !== tagCommit.stdout) {
    blockers.push({
      id: "tag-not-aligned-with-head",
      detail: `${VERSION} must point to current HEAD before publishing.`
    });
  }

  if ((ghStatus.status ?? 1) !== 0) {
    warnings.push("GitHub CLI is not logged in. Use browser upload or run gh auth login before CLI publishing.");
  }

  if (!remotes.stdout) {
    warnings.push("No Git remote is configured. Add origin before pushing main/tag.");
  }

  const uploadCommand = [
    "$ErrorActionPreference = 'Stop'",
    "function Invoke-NativeChecked {",
    "  param(",
    "    [Parameter(Mandatory = $true)] [string] $FilePath,",
    "    [Parameter(ValueFromRemainingArguments = $true)] [string[]] $ArgumentList",
    "  )",
    "  & $FilePath @ArgumentList",
    "  if ($LASTEXITCODE -ne 0) {",
    "    throw \"$FilePath $($ArgumentList -join ' ') failed with exit code $LASTEXITCODE\"",
    "  }",
    "}",
    "",
    "$UploadRoot = $PSScriptRoot",
    "$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $UploadRoot '..\\..')).Path",
    "$AssetsRoot = Join-Path $UploadRoot 'assets'",
    "Set-Location -LiteralPath $RepoRoot",
    `$Owner = "${owner}"`,
    `$Repo = "${repo}"`,
    `$Tag = "${VERSION}"`,
    `$Notes = Join-Path $UploadRoot "RELEASE_NOTES_${VERSION}.md"`,
    `$Assets = @(`,
    ...staged.map((asset) => `  (Join-Path $AssetsRoot "${path.basename(asset.target)}"),`),
    `  (Join-Path $AssetsRoot "SHA256SUMS.txt")`,
    ")",
    "",
    "Invoke-NativeChecked gh auth status",
    "Invoke-NativeChecked git push origin main",
    "Invoke-NativeChecked git push origin $Tag",
    "$ReleaseArgs = @(",
    "  \"release\",",
    "  \"create\",",
    "  $Tag,",
    "  \"--repo\",",
    "  \"$Owner/$Repo\",",
    "  \"--title\",",
    `  "${releaseTitle(VERSION)}",`,
    "  \"--notes-file\",",
    "  $Notes,",
    "  \"--prerelease\"",
    ") + $Assets",
    "Invoke-NativeChecked gh @ReleaseArgs",
    ""
  ].join("\n");
  writeFile(path.join(uploadRoot, "PUBLISH_WITH_GH.ps1"), uploadCommand);

  const cleanupCommand = [
    "$ErrorActionPreference = 'Stop'",
    "function Invoke-NativeChecked {",
    "  param(",
    "    [Parameter(Mandatory = $true)] [string] $FilePath,",
    "    [Parameter(ValueFromRemainingArguments = $true)] [string[]] $ArgumentList",
    "  )",
    "  & $FilePath @ArgumentList",
    "  if ($LASTEXITCODE -ne 0) {",
    "    throw \"$FilePath $($ArgumentList -join ' ') failed with exit code $LASTEXITCODE\"",
    "  }",
    "}",
    "",
    "$UploadRoot = $PSScriptRoot",
    "$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $UploadRoot '..\\..')).Path",
    "Set-Location -LiteralPath $RepoRoot",
    `$Owner = "${owner}"`,
    `$Repo = "${repo}"`,
    `$ActiveTag = "${VERSION}"`,
    "$RepoFullName = \"$Owner/$Repo\"",
    "",
    "Invoke-NativeChecked gh auth status",
    "$ReleaseJson = gh release list --repo $RepoFullName --limit 100 --json tagName,isPrerelease",
    "if ($LASTEXITCODE -ne 0) { throw \"gh release list failed with exit code $LASTEXITCODE\" }",
    "$OldReleases = @($ReleaseJson | ConvertFrom-Json | Where-Object { $_.tagName -like 'v0.1.0-preview.*' -and $_.tagName -ne $ActiveTag })",
    "foreach ($Release in $OldReleases) {",
    "  Write-Host \"Deleting old release $($Release.tagName)\"",
    "  Invoke-NativeChecked gh release delete $Release.tagName --repo $RepoFullName --yes --cleanup-tag",
    "}",
    "$RemoteTags = git ls-remote --tags origin 'v0.1.0-preview.*'",
    "if ($LASTEXITCODE -ne 0) { throw \"git ls-remote failed with exit code $LASTEXITCODE\" }",
    "$OldTags = @($RemoteTags -split \"`n\" | ForEach-Object {",
    "  if ($_ -match 'refs/tags/(v0\\.1\\.0-preview\\.[0-9]+)(\\^\\{\\})?$') { $Matches[1] }",
    "} | Where-Object { $_ -and $_ -ne $ActiveTag } | Sort-Object -Unique)",
    "foreach ($Tag in $OldTags) {",
    "  Write-Host \"Deleting old remote tag $Tag\"",
    "  Invoke-NativeChecked git push origin --delete $Tag",
    "}",
    "Write-Host \"Old preview release cleanup complete. Active tag: $ActiveTag\"",
    ""
  ].join("\n");
  writeFile(path.join(uploadRoot, "DELETE_OLD_RELEASES_WITH_GH.ps1"), cleanupCommand);

  const browserSteps = [
    "# Browser Release Upload Steps",
    "",
    `1. Open \`https://github.com/${githubRepo}\`.`,
    `2. Push \`main\` and \`${VERSION}\` from this local repository: \`git push origin main; git push origin ${VERSION}\`.`,
    "3. Open the GitHub repository page.",
    "4. Go to Releases -> Draft a new release.",
    `5. Select or type tag \`${VERSION}\`.`,
    `6. Title: \`${releaseTitle(VERSION)}\`.`,
    `7. Paste release notes from \`${releaseNotesCopy}\`.`,
    `8. Upload all files from \`${assetsRoot}\`.`,
    "9. Mark the release as pre-release.",
    "10. Publish release.",
    "",
    "## Required Uploaded Files",
    "",
    ...staged.map((asset) => `- \`${path.basename(asset.target)}\` (${asset.size} bytes, SHA256 \`${asset.sha256}\`)`),
    "- `SHA256SUMS.txt`",
    "",
    "## Unsigned Preview Notice",
    "",
    "The Windows installer is unsigned. Keep the warning in the release notes so users understand the Unknown publisher / SmartScreen prompt.",
    ""
  ].join("\n");
  writeFile(path.join(uploadRoot, "BROWSER_UPLOAD_STEPS.md"), browserSteps);

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0 ? "github-release-upload-staged" : "github-release-upload-staging-blocked",
    version: VERSION,
    uploadRoot,
    assetsRoot,
    releaseNotes: releaseNotesCopy,
    githubRepo,
    stagedAssets: staged,
    sha256Sums: path.join(assetsRoot, "SHA256SUMS.txt"),
    commands: {
      browserSteps: path.join(uploadRoot, "BROWSER_UPLOAD_STEPS.md"),
      ghPublish: path.join(uploadRoot, "PUBLISH_WITH_GH.ps1"),
      ghCleanupOldReleases: path.join(uploadRoot, "DELETE_OLD_RELEASES_WITH_GH.ps1")
    },
    git: {
      head: currentCommit.stdout,
      tagCommit: tagCommit.stdout,
      tagAlignedWithHead: currentCommit.stdout === tagCommit.stdout,
      remotes: remotes.stdout
    },
    githubCli: {
      loggedIn: (ghStatus.status ?? 1) === 0
    },
    upstream: {
      phase18Status: phase18.status
    },
    warnings,
    blockers
  };

  writeJson(path.join(deliveryRoot, `phase19-github-release-staging-${DATE}.json`), report);
  writeFile(
    path.join(deliveryRoot, `phase19-github-release-staging-closeout-${DATE}.md`),
    [
      "# Phase 19 GitHub Release Staging Closeout - 2026-04-26",
      "",
      "## Status",
      "",
      report.status,
      "",
      "## Upload Root",
      "",
      `\`${uploadRoot}\``,
      "",
      "## Staged Assets",
      "",
      "| Asset | Size | SHA256 |",
      "|---|---:|---|",
      ...staged.map((asset) => `| ${path.basename(asset.target)} | ${asset.size} | \`${asset.sha256}\` |`),
      "| SHA256SUMS.txt | | |",
      "",
      "## Commands",
      "",
      `- Browser steps: \`${path.join(uploadRoot, "BROWSER_UPLOAD_STEPS.md")}\``,
      `- GitHub CLI script: \`${path.join(uploadRoot, "PUBLISH_WITH_GH.ps1")}\``,
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
      `npm run -C "${appRoot}" phase19:github-release-staging`,
      "```",
      ""
    ].join("\n")
  );

  console.log(`Phase 19 GitHub release staging: ${report.status}`);
  console.log(`Upload root: ${uploadRoot}`);
  console.log(`Assets staged: ${staged.length}`);

  if (blockers.length > 0) {
    for (const blocker of blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exit(1);
  }
}

main();
