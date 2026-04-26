const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const DATE = "20260426";
const VERSION = "v0.1.0-preview.1";
const TWO_GIB = 2 * 1024 * 1024 * 1024;
const GIT_WARN_SIZE = 50 * 1024 * 1024;
const GIT_BLOCK_SIZE = 100 * 1024 * 1024;

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

function toPosixRelative(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function shouldSkipDir(root, dirPath) {
  const rel = toPosixRelative(root, dirPath);
  return (
    rel === "" ||
    rel === ".git" ||
    rel === "node_modules" ||
    rel === ".tmp" ||
    rel === ".playwright-cli" ||
    rel === "apps/studio/.packaging" ||
    rel === "apps/studio/release" ||
    rel === "apps/studio/output" ||
    rel === "delivery/openclaw-studio-alpha-shell/installers" ||
    rel.startsWith("delivery/github-release-upload-") ||
    rel.startsWith("node_modules/") ||
    rel.startsWith(".tmp/") ||
    rel.startsWith(".playwright-cli/") ||
    rel.startsWith("apps/studio/.packaging/") ||
    rel.startsWith("apps/studio/release/") ||
    rel.startsWith("apps/studio/output/") ||
    rel.startsWith("delivery/openclaw-studio-alpha-shell/installers/") ||
    rel.startsWith("delivery/github-release-upload-") ||
    /^delivery\/alpha-snapshot-/.test(rel) ||
    /^delivery\/phase\d+-.*screenshots/.test(rel)
  );
}

function listPublicSourceCandidateFiles(root) {
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!shouldSkipDir(root, entryPath)) {
          stack.push(entryPath);
        }
      } else {
        files.push(entryPath);
      }
    }
  }

  return files.sort();
}

function isTextScanCandidate(filePath, size) {
  if (size > 2 * 1024 * 1024) {
    return false;
  }

  const name = path.basename(filePath).toLowerCase();
  const ext = path.extname(name);
  return (
    [
      ".cjs",
      ".mjs",
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
      ".md",
      ".yml",
      ".yaml",
      ".toml",
      ".ps1",
      ".html",
      ".css",
      ".gitignore"
    ].includes(ext) ||
    ["package-lock.json", "package.json", ".gitignore"].includes(name)
  );
}

function secretFindingsFor(filePath, content) {
  const patterns = [
    { id: "private-key-block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/i },
    { id: "openai-style-api-key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { id: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/ },
    { id: "code-sign-password-env", pattern: /(WINDOWS_CODESIGN_CERT_PASSWORD|CSC_KEY_PASSWORD|WIN_CSC_KEY_PASSWORD)\s*=\s*['"][^<][^'"]{5,}['"]/i },
    { id: "generic-secret-assignment", pattern: /(api[_-]?key|secret|token|password)\s*[:=]\s*['"][A-Za-z0-9_./+=-]{24,}['"]/i }
  ];

  return patterns
    .filter((entry) => entry.pattern.test(content))
    .map((entry) => ({
      id: entry.id,
      path: filePath
    }));
}

function assetFrom(label, filePath, role, publicWarning) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      label,
      role,
      path: filePath,
      exists: false,
      size: null,
      sha256: null,
      releaseAssetEligible: false,
      publicWarning
    };
  }

  const size = fs.statSync(filePath).size;
  return {
    label,
    role,
    path: filePath,
    exists: true,
    size,
    sha256: hashFile(filePath),
    releaseAssetEligible: size < TWO_GIB,
    publicWarning
  };
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const publicRoot = path.join(deliveryRoot, `github-public-preview-${DATE}`);
  const phase7Path = path.join(deliveryRoot, `phase7-package-closeout-${DATE}.json`);
  const phase8Path = path.join(deliveryRoot, `phase8-installer-closeout-${DATE}.json`);
  const phase12InstalledPath = path.join(deliveryRoot, `phase12-installed-ui-full-check-${DATE}.json`);
  const phase12PortablePath = path.join(deliveryRoot, `phase12-portable-ui-full-check-${DATE}.json`);
  const phase13Path = path.join(deliveryRoot, `phase13-public-release-handoff-${DATE}.json`);
  const phase17Path = path.join(deliveryRoot, `phase17-signing-handoff-audit-${DATE}.json`);
  const phase20Path = path.join(deliveryRoot, `phase20-runtime-release-closeout-${DATE}.json`);

  const phase7 = fs.existsSync(phase7Path) ? readJson(phase7Path) : null;
  const phase8 = fs.existsSync(phase8Path) ? readJson(phase8Path) : null;
  const phase12Installed = fs.existsSync(phase12InstalledPath) ? readJson(phase12InstalledPath) : null;
  const phase12Portable = fs.existsSync(phase12PortablePath) ? readJson(phase12PortablePath) : null;
  const phase13 = fs.existsSync(phase13Path) ? readJson(phase13Path) : null;
  const phase17 = fs.existsSync(phase17Path) ? readJson(phase17Path) : null;
  const phase20 = fs.existsSync(phase20Path) ? readJson(phase20Path) : null;

  const ghStatus = run("gh", ["auth", "status"], repoRoot);
  const gitInside = run("git", ["rev-parse", "--is-inside-work-tree"], repoRoot);
  const gitRemote = run("git", ["remote", "-v"], repoRoot);

  const assets = [
    assetFrom(
      "Windows NSIS installer",
      phase8?.artifacts?.installer?.path,
      "release-asset",
      "Unsigned preview installer. Windows may show Unknown publisher or SmartScreen warnings."
    ),
    assetFrom(
      "Windows portable zip",
      phase7?.artifacts?.portableZip?.path,
      "release-asset",
      "Unsigned preview portable package."
    ),
    assetFrom(
      "RC Windows zip",
      phase7?.artifacts?.rcZip?.path,
      "optional-release-asset",
      "Unsigned RC zip. Prefer portable zip for public preview downloads."
    ),
    assetFrom(
      "RC manifest",
      path.join(deliveryRoot, `openclaw-studio-rc-manifest-${DATE}.md`),
      "release-note-evidence",
      "Public evidence document."
    ),
    assetFrom(
      "Public release handoff",
      path.join(deliveryRoot, `phase13-public-release-handoff-${DATE}.md`),
      "release-note-evidence",
      "Public evidence document."
    ),
    assetFrom(
      "Signing handoff audit",
      path.join(deliveryRoot, `phase17-signing-handoff-audit-closeout-${DATE}.md`),
      "release-note-evidence",
      "Shows unsigned preview boundary and signing handoff readiness."
    ),
    assetFrom(
      "Runtime release closeout",
      path.join(deliveryRoot, `phase20-runtime-release-closeout-${DATE}.md`),
      "release-note-evidence",
      "Shows final runtime UI, session stream, GPU sampling, and release staging evidence."
    )
  ];

  const publicSourceFiles = listPublicSourceCandidateFiles(repoRoot);
  const largeFiles = publicSourceFiles
    .map((filePath) => ({
      path: filePath,
      relativePath: toPosixRelative(repoRoot, filePath),
      size: fs.statSync(filePath).size
    }))
    .filter((entry) => entry.size >= GIT_WARN_SIZE)
    .sort((a, b) => b.size - a.size);

  const secretFindings = [];
  let scannedTextFiles = 0;
  for (const filePath of publicSourceFiles) {
    const size = fs.statSync(filePath).size;
    if (!isTextScanCandidate(filePath, size)) {
      continue;
    }
    scannedTextFiles += 1;
    const content = fs.readFileSync(filePath, "utf8");
    secretFindings.push(...secretFindingsFor(toPosixRelative(repoRoot, filePath), content));
  }

  const blockers = [];
  const warnings = [];

  for (const asset of assets) {
    if (!asset.exists && asset.role === "release-asset") {
      blockers.push({
        id: "required-release-asset-missing",
        detail: `${asset.label} is missing: ${asset.path}`
      });
    }
    if (asset.exists && !asset.releaseAssetEligible) {
      blockers.push({
        id: "release-asset-too-large",
        detail: `${asset.label} is ${asset.size} bytes and exceeds the 2 GiB GitHub release asset target.`
      });
    }
  }

  for (const entry of largeFiles) {
    if (entry.size >= GIT_BLOCK_SIZE) {
      blockers.push({
        id: "public-source-file-too-large",
        detail: `${entry.relativePath} is ${entry.size} bytes. Do not commit files larger than 100 MiB to GitHub.`
      });
    } else {
      warnings.push(`${entry.relativePath} is ${entry.size} bytes and will trigger GitHub's 50 MiB warning if committed.`);
    }
  }

  if (secretFindings.length > 0) {
    blockers.push({
      id: "potential-secret-in-public-source",
      detail: `${secretFindings.length} potential secret finding(s) detected in public source candidates.`
    });
  }

  if ((gitInside.status ?? 1) !== 0) {
    warnings.push("Current workspace is not a Git repository yet. Initialize git before pushing to GitHub.");
  }

  if ((ghStatus.status ?? 1) !== 0) {
    warnings.push("GitHub CLI is not logged in. Manual GitHub login or browser release upload is required.");
  }

  const releaseNotes = [
    `# OpenClaw Studio ${VERSION}`,
    "",
    "## Preview Status",
    "",
    "This is an unsigned Windows public preview build for GitHub distribution.",
    "",
    "## Download",
    "",
    "- Windows installer: upload `OpenClaw-Studio-0.1.0-win-x64-setup.exe` as a GitHub Release asset.",
    "- Windows portable zip: upload `OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` as a GitHub Release asset.",
    "",
    "## Windows Notice",
    "",
    "This preview build is unsigned. Windows may show an Unknown publisher or SmartScreen warning when launching the installer. This is expected for this preview release. The signed public release track is prepared separately and can be enabled after a trusted code-signing certificate is available.",
    "",
    "## Verification Summary",
    "",
    `- Installed app UI parity: ${phase12Installed?.status ?? "missing"} (${phase12Installed?.pages?.length ?? 0} pages, ${phase12Installed?.failures?.length ?? 0} failures).`,
    `- Portable app UI parity: ${phase12Portable?.status ?? "missing"} (${phase12Portable?.pages?.length ?? 0} pages, ${phase12Portable?.failures?.length ?? 0} failures).`,
    `- Public handoff status: ${phase13?.status ?? "missing"}.`,
    `- Signing handoff audit: ${phase17?.status ?? "missing"}.`,
    `- Runtime release closeout: ${phase20?.status ?? "missing"}.`,
    "",
    "## SHA256",
    "",
    "| Asset | Size | SHA256 |",
    "|---|---:|---|",
    ...assets
      .filter((asset) => asset.exists && asset.role.includes("release-asset"))
      .map((asset) => `| ${asset.label} | ${asset.size} | \`${asset.sha256}\` |`),
    "",
    "## Known Boundary",
    "",
    "- This preview is not code-signed.",
    "- Real trusted signing remains tracked by Phase 14-17 reports.",
    "- Release binaries are distributed as GitHub Release assets, not committed into Git.",
    ""
  ].join("\n");

  const publicReadme = [
    "# OpenClaw Studio Public Preview",
    "",
    "OpenClaw Studio is an Electron + React + TypeScript desktop control console.",
    "",
    "## Current Public Build",
    "",
    `- Version: ${VERSION}`,
    "- Channel: unsigned public preview",
    "- Platform artifact focus: Windows installer and Windows portable zip",
    "",
    "## Important Windows Notice",
    "",
    "The preview installer is unsigned. Windows may display Unknown publisher or SmartScreen warnings. This is expected for the preview channel.",
    "",
    "## Build And Verify",
    "",
    "```powershell",
    "npm install",
    "npm run -C apps/studio contract:audit",
    "npm run -C apps/studio typecheck",
    "npm run -C apps/studio test",
    "```",
    "",
    "## Release Assets",
    "",
    "Do not commit generated installers, portable zips, or unpacked Electron app directories to Git. Upload them to GitHub Releases as release assets.",
    "",
    "## License",
    "",
    "No open-source license has been selected in this repository by this automation step. Until a license is explicitly added by the project owner, all rights are reserved by default.",
    ""
  ].join("\n");

  const securityMd = [
    "# Security Policy",
    "",
    "## Supported Versions",
    "",
    `The current public preview line is ${VERSION}.`,
    "",
    "## Reporting A Vulnerability",
    "",
    "Use GitHub Security Advisories if enabled for the repository, or open a private maintainer contact channel before publishing exploit details publicly.",
    "",
    "## Signing Status",
    "",
    "The preview release artifacts are unsigned. The trusted code-signing track is prepared separately and remains blocked until trusted certificate material is available.",
    ""
  ].join("\n");

  const releaseCommands = [
    "$ErrorActionPreference = 'Stop'",
    "$Owner = '<github-owner>'",
    "$Repo = '<github-repo>'",
    `$Tag = '${VERSION}'`,
    `$Notes = '${path.join(publicRoot, `RELEASE_NOTES_${VERSION}.md`)}'`,
    "",
    "gh auth status",
    "git status --short",
    "git tag $Tag",
    "git push origin $Tag",
    "gh release create $Tag `",
    "  --repo \"$Owner/$Repo\" `",
    "  --title \"OpenClaw Studio v0.1.0 Preview 1\" `",
    "  --notes-file $Notes `",
    "  --prerelease `",
    ...assets
      .filter((asset) => asset.exists && asset.role.includes("release-asset"))
      .map((asset, index, arr) => `  \"${asset.path}\"${index === arr.length - 1 ? "" : " `"}`),
    ""
  ].join("\n");

  writeFile(path.join(publicRoot, `RELEASE_NOTES_${VERSION}.md`), releaseNotes);
  writeFile(path.join(publicRoot, "README-PUBLIC-PREVIEW.md"), publicReadme);
  writeFile(path.join(publicRoot, "SECURITY.md"), securityMd);
  writeFile(path.join(publicRoot, "GITHUB_RELEASE_COMMANDS.ps1"), releaseCommands);
  writeJson(path.join(publicRoot, "GITHUB_RELEASE_ASSETS.json"), {
    version: VERSION,
    assets
  });

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0 ? "github-public-preview-pack-ready" : "github-public-preview-pack-blocked",
    version: VERSION,
    appRoot,
    publicRoot,
    git: {
      insideWorktree: (gitInside.status ?? 1) === 0,
      remoteOutput: gitRemote.stdout
    },
    githubCli: {
      loggedIn: (ghStatus.status ?? 1) === 0
    },
    assets,
    publicSourceScan: {
      candidateFiles: publicSourceFiles.length,
      scannedTextFiles,
      largeFiles,
      secretFindings
    },
    upstream: {
      phase7Status: phase7?.status ?? "missing",
      phase8Status: phase8?.status ?? "missing",
      phase12InstalledStatus: phase12Installed?.status ?? "missing",
      phase12PortableStatus: phase12Portable?.status ?? "missing",
      phase13Status: phase13?.status ?? "missing",
      phase17Status: phase17?.status ?? "missing",
      phase20Status: phase20?.status ?? "missing"
    },
    warnings,
    blockers
  };

  writeJson(path.join(deliveryRoot, `phase18-github-public-preview-pack-${DATE}.json`), report);

  writeFile(
    path.join(deliveryRoot, `phase18-github-public-preview-pack-closeout-${DATE}.md`),
    [
      "# Phase 18 GitHub Public Preview Pack Closeout - 2026-04-26",
      "",
      "## Status",
      "",
      report.status,
      "",
      "## Generated Pack",
      "",
      `- root: \`${publicRoot}\``,
      `- release notes: \`delivery/github-public-preview-${DATE}/RELEASE_NOTES_${VERSION}.md\``,
      "- release asset manifest: `delivery/github-public-preview-20260426/GITHUB_RELEASE_ASSETS.json`",
      "- release commands: `delivery/github-public-preview-20260426/GITHUB_RELEASE_COMMANDS.ps1`",
      "- public preview README: `delivery/github-public-preview-20260426/README-PUBLIC-PREVIEW.md`",
      "- security policy draft: `delivery/github-public-preview-20260426/SECURITY.md`",
      "- runtime release closeout: `delivery/phase20-runtime-release-closeout-20260426.md`",
      "",
      "## Release Assets",
      "",
      "| Asset | Exists | Size | SHA256 |",
      "|---|---:|---:|---|",
      ...assets.map((asset) => `| ${asset.label} | ${asset.exists ? "yes" : "no"} | ${asset.size ?? ""} | ${asset.sha256 ? `\`${asset.sha256}\`` : ""} |`),
      "",
      "## Public Source Scan",
      "",
      `- candidate files: ${publicSourceFiles.length}`,
      `- text files scanned: ${scannedTextFiles}`,
      `- large files >= 50 MiB: ${largeFiles.length}`,
      `- secret findings: ${secretFindings.length}`,
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
      `npm run -C "${appRoot}" phase18:github-public-preview-pack`,
      "```",
      ""
    ].join("\n")
  );

  console.log(`Phase 18 GitHub public preview pack: ${report.status}`);
  console.log(`Pack: ${publicRoot}`);
  console.log(`Report: ${path.join(deliveryRoot, `phase18-github-public-preview-pack-${DATE}.json`)}`);

  if (blockers.length > 0) {
    for (const blocker of blockers) {
      console.error(`- ${blocker.id}: ${blocker.detail}`);
    }
    process.exit(1);
  }
}

main();
