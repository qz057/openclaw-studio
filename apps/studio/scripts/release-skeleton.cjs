const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { getPaths, getPreflightSummary } = require("./studio-preflight.cjs");

const APP_NAME = "OpenClaw Studio";
const PHASE_ID = "phase41";
const PHASE_MILESTONE =
  "phase41 sealed-bundle integrity contract / channel promotion evidence / publish rollback handshake + docs / smoke / package / release-plan / UI / shared data closeout";
const RELEASE_CHANNEL = "alpha";
const PACKAGE_ID = "openclaw-studio-alpha-shell";
const PACKAGE_KIND = "alpha-shell-release-skeleton";
const REQUIRED_RELEASE_COMMANDS = [
  "npm run typecheck",
  "npm run build",
  "npm run smoke",
  "npm run start:smoke",
  "npm run package:alpha"
];
const OPTIONAL_RELEASE_COMMANDS = ["npm run release:plan"];
const CURRENT_DELIVERY_SURFACES = [
  "structured alpha-shell snapshot under delivery/openclaw-studio-alpha-shell",
  "built renderer bundle copied into artifacts/renderer",
  "built Electron bundle copied into artifacts/electron",
  "deeper inspector drilldowns, active flow state, route-aware next-step boards, and inspector-command linkage",
  "persisted shell layout foundation backed by localStorage",
  "cross-view local orchestration boards linking route, workflow lane, workspace, detached candidate, intent focus, focused slot, and handoff posture",
  "release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged app materialization skeleton / packaged app directory materialization / packaged app staged output skeleton / packaged app bundle sealing skeleton / sealed-bundle integrity contract / installer targets / installer-target builder skeleton / installer builder execution skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / signing-ready metadata / signing-publish pipeline / signing-publish gating handshake / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / release approval workflow / release notes / publish gates / promotion gates under release/",
  "docs closeout: README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README / RELEASE-SUMMARY / REVIEW-MANIFEST / BUNDLE-MATRIX / BUNDLE-ASSEMBLY / PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-MATERIALIZATION-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION / PACKAGED-APP-STAGED-OUTPUT-SKELETON.json / PACKAGED-APP-BUNDLE-SEALING-SKELETON.json / SEALED-BUNDLE-INTEGRITY-CONTRACT.json / INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON / INSTALLER-BUILDER-EXECUTION-SKELETON / INSTALLER-BUILDER-ORCHESTRATION.json / INSTALLER-CHANNEL-ROUTING.json / CHANNEL-PROMOTION-EVIDENCE.json / SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE / SIGNING-PUBLISH-GATING-HANDSHAKE / SIGNING-PUBLISH-APPROVAL-BRIDGE.json / SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json / PUBLISH-ROLLBACK-HANDSHAKE.json / RELEASE-APPROVAL-WORKFLOW / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES",
  "placeholder installer explainer script that never installs anything"
];
const FORMAL_INSTALLER_GAPS = [
  "no packaged per-OS staged output materialization yet; staged outputs remain review-only metadata",
  "no packaged per-OS bundle sealing yet; sealing remains review-only metadata",
  "no per-platform sealed-bundle integrity attestation or digest publication yet; integrity contract remains review-only metadata",
  "no Windows / macOS / Linux installer builder orchestration and channel routing wiring yet; routing remains review-only skeleton",
  "no executable channel promotion evidence pack or promotion routing apply yet; evidence remains review-only metadata",
  "no signing / notarization / hash publication workflow yet; approval bridge remains metadata-only",
  "no executable signing-publish gating handshake yet; handshake remains metadata-only",
  "no executable release approval handshake yet; workflow remains metadata-only",
  "no release publishing / artifact upload / promotion handshake / rollback apply automation yet; publish rollback handshake remains metadata-only",
  "real host-side execution remains disabled until approval / lifecycle / rollback close the loop"
];
const DELIVERY_CONSTRAINTS = [
  "real host-side execution remains disabled",
  "no ~/.openclaw writes",
  "no services / install / config mutation",
  "no external connector process control"
];
const FUTURE_INSTALLER_PIPELINE = [
  "materialize packaged Electron staged outputs from built renderer/electron outputs using the reviewed staged-output metadata",
  "turn packaged-app bundle sealing skeleton metadata into per-platform sealed bundle manifests without materializing any real host-side bundle yet",
  "turn the sealed-bundle integrity contract into per-platform digest, audit, and verification evidence only after packaged outputs are reviewable end-to-end",
  "turn installer builder orchestration metadata into real per-platform builder wiring without leaving local-only review mode first",
  "turn installer channel routing metadata into explicit alpha/beta/stable routing manifests only after builder execution, approval, and rollback are reviewable end-to-end",
  "turn channel promotion evidence metadata into explicit promotion packets only after upload, approval, and rollback evidence exist together",
  "add signing-ready metadata / signing-publish pipeline / signing-publish approval bridge / notarization / checksum publishing",
  "turn the signing-publish gating handshake from metadata into an executable review gate only after approval / lifecycle / rollback are real",
  "turn the signing-publish promotion handshake from metadata into a gated promotion contract only after upload, approval, and rollback are real",
  "turn the publish rollback handshake from metadata into an executable rollback path only after publish lifecycle and recovery checkpoints are real",
  "turn the release approval workflow from metadata into a gated review handshake only after approval / lifecycle / rollback are real",
  "attach release notes, uploaded artifacts, publish gating, and promotion gating metadata",
  "gate any future live host execution behind approval / lifecycle / rollback validation"
];
const REVIEW_ARTIFACTS = ["release/REVIEW-MANIFEST.json", "release/RELEASE-SUMMARY.md"];
const FORMAL_RELEASE_ARTIFACTS = [
  "release/BUNDLE-MATRIX.json",
  "release/BUNDLE-ASSEMBLY.json",
  "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
  "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
  "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
  "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
  "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
  "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
  "release/INSTALLER-TARGETS.json",
  "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
  "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
  "release/INSTALLER-BUILDER-ORCHESTRATION.json",
  "release/INSTALLER-CHANNEL-ROUTING.json",
  "release/CHANNEL-PROMOTION-EVIDENCE.json",
  "release/SIGNING-METADATA.json",
  "release/NOTARIZATION-PLAN.json",
  "release/SIGNING-PUBLISH-PIPELINE.json",
  "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
  "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
  "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
  "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
  "release/RELEASE-APPROVAL-WORKFLOW.json",
  "release/RELEASE-NOTES.md",
  "release/PUBLISH-GATES.json",
  "release/PROMOTION-GATES.json"
];
const RELEASE_PIPELINE_STAGES = [
  "docs-closeout",
  "artifact-snapshot",
  "bundle-assembly-skeleton",
  "packaged-app-directory-skeleton",
  "packaged-app-materialization-skeleton",
  "packaged-app-directory-materialization",
  "packaged-app-staged-output-skeleton",
  "packaged-app-bundle-sealing-skeleton",
  "sealed-bundle-integrity-contract",
  "installer-target-metadata",
  "installer-target-builder-skeleton",
  "installer-builder-execution-skeleton",
  "installer-builder-orchestration",
  "installer-channel-routing",
  "channel-promotion-evidence",
  "signing-ready-metadata",
  "signing-publish-pipeline-skeleton",
  "signing-publish-gating-handshake",
  "signing-publish-approval-bridge",
  "signing-publish-promotion-handshake",
  "publish-rollback-handshake",
  "approval-workflow-skeleton",
  "notarization-blocked",
  "promotion-gated"
];
const REVIEW_STAGE_ID = "sealed-bundle-integrity-channel-promotion-evidence-publish-rollback-handshake-skeleton";
const PACKAGE_LAYOUT = [
  {
    id: "docs-root",
    label: "Snapshot docs",
    path: ".",
    description: "Top-level README, HANDOFF, IMPLEMENTATION-PLAN, PACKAGE-README, and formal-release skeleton docs for artifact review."
  },
  {
    id: "artifacts-renderer",
    label: "Renderer artifacts",
    path: "artifacts/renderer",
    description: "Built Vite renderer output copied from apps/studio/dist-renderer."
  },
  {
    id: "artifacts-electron",
    label: "Electron artifacts",
    path: "artifacts/electron",
    description: "Built Electron main/preload/runtime output copied from apps/studio/dist-electron."
  },
  {
    id: "release-metadata",
    label: "Release metadata",
    path: "release",
    description:
      "Manifest, build metadata, packaged app directory skeletons, sealed-bundle integrity metadata, channel promotion evidence, builder execution skeletons, signing/publish handshake metadata, installer targets, approval workflow, installer placeholder contract, and release checklist."
  },
  {
    id: "release-scripts",
    label: "Placeholder scripts",
    path: "scripts",
    description: "Non-installer helper scripts that explain the current release posture."
  }
];

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listFilesRecursive(rootPath) {
  const entries = fs.readdirSync(rootPath, {
    withFileTypes: true
  });
  const sortedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name));
  const files = [];

  for (const entry of sortedEntries) {
    const absolutePath = path.join(rootPath, entry.name);

    if (entry.isDirectory()) {
      for (const nestedEntry of listFilesRecursive(absolutePath)) {
        files.push(toPosixPath(path.join(entry.name, nestedEntry)));
      }
      continue;
    }

    if (entry.isFile()) {
      files.push(entry.name);
    }
  }

  return files;
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function ensureBuildReady(summary) {
  if (!summary.buildReady) {
    throw new Error("OpenClaw Studio release skeleton requires built renderer/electron artifacts. Run `npm run build` first.");
  }
}

function summarizeDirectory({ id, label, sourceRoot, outputRoot, entrypoints, repoRoot }) {
  const files = listFilesRecursive(sourceRoot).map((relativePath) => {
    const sourcePath = path.join(sourceRoot, ...relativePath.split("/"));
    const stats = fs.statSync(sourcePath);
    const packagePath = toPosixPath(path.join(outputRoot, relativePath));

    return {
      id: `${id}:${relativePath}`,
      relativePath,
      packagePath,
      sourceRelativePath: toPosixPath(path.relative(repoRoot, sourcePath)),
      sizeBytes: stats.size,
      sha256: hashFile(sourcePath),
      isEntrypoint: entrypoints.includes(relativePath)
    };
  });

  return {
    id,
    label,
    sourceRoot,
    outputRoot,
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.sizeBytes, 0),
    entrypoints: entrypoints.map((relativePath) => toPosixPath(path.join(outputRoot, relativePath))),
    files
  };
}

function buildSourceDocs(paths) {
  return [
    {
      id: "readme",
      label: "Repo README",
      sourcePath: paths.readmePath,
      outputPath: "README.md"
    },
    {
      id: "handoff",
      label: "Repo HANDOFF",
      sourcePath: paths.handoffPath,
      outputPath: "HANDOFF.md"
    },
    {
      id: "implementation-plan",
      label: "Repo implementation plan",
      sourcePath: paths.implementationPlanPath,
      outputPath: "IMPLEMENTATION-PLAN.md"
    }
  ];
}

function buildGeneratedDocs() {
  return [
    {
      id: "package-readme",
      label: "Package snapshot overview",
      outputPath: "PACKAGE-README.md",
      generated: true
    },
    {
      id: "release-summary",
      label: "Release summary",
      outputPath: "release/RELEASE-SUMMARY.md",
      generated: true
    },
    {
      id: "review-manifest",
      label: "Review manifest",
      outputPath: "release/REVIEW-MANIFEST.json",
      generated: true
    },
    {
      id: "bundle-matrix",
      label: "Bundle matrix",
      outputPath: "release/BUNDLE-MATRIX.json",
      generated: true
    },
    {
      id: "bundle-assembly",
      label: "Bundle assembly",
      outputPath: "release/BUNDLE-ASSEMBLY.json",
      generated: true
    },
    {
      id: "packaged-app-directory-skeleton",
      label: "Packaged app directory skeleton",
      outputPath: "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
      generated: true
    },
    {
      id: "packaged-app-materialization-skeleton",
      label: "Packaged app materialization skeleton",
      outputPath: "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
      generated: true
    },
    {
      id: "packaged-app-directory-materialization",
      label: "Packaged app directory materialization",
      outputPath: "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
      generated: true
    },
    {
      id: "packaged-app-staged-output-skeleton",
      label: "Packaged-app staged output skeleton",
      outputPath: "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
      generated: true
    },
    {
      id: "packaged-app-bundle-sealing-skeleton",
      label: "Packaged-app bundle sealing skeleton",
      outputPath: "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
      generated: true
    },
    {
      id: "sealed-bundle-integrity-contract",
      label: "Sealed-bundle integrity contract",
      outputPath: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
      generated: true
    },
    {
      id: "installer-targets",
      label: "Installer targets",
      outputPath: "release/INSTALLER-TARGETS.json",
      generated: true
    },
    {
      id: "installer-target-builder-skeleton",
      label: "Installer-target builder skeleton",
      outputPath: "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
      generated: true
    },
    {
      id: "installer-builder-execution-skeleton",
      label: "Installer builder execution skeleton",
      outputPath: "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
      generated: true
    },
    {
      id: "installer-builder-orchestration",
      label: "Installer builder orchestration",
      outputPath: "release/INSTALLER-BUILDER-ORCHESTRATION.json",
      generated: true
    },
    {
      id: "installer-channel-routing",
      label: "Installer channel routing",
      outputPath: "release/INSTALLER-CHANNEL-ROUTING.json",
      generated: true
    },
    {
      id: "channel-promotion-evidence",
      label: "Channel promotion evidence",
      outputPath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
      generated: true
    },
    {
      id: "signing-metadata",
      label: "Signing-ready metadata",
      outputPath: "release/SIGNING-METADATA.json",
      generated: true
    },
    {
      id: "notarization-plan",
      label: "Notarization plan",
      outputPath: "release/NOTARIZATION-PLAN.json",
      generated: true
    },
    {
      id: "signing-publish-pipeline",
      label: "Signing & publish pipeline skeleton",
      outputPath: "release/SIGNING-PUBLISH-PIPELINE.json",
      generated: true
    },
    {
      id: "signing-publish-gating-handshake",
      label: "Signing-publish gating handshake",
      outputPath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
      generated: true
    },
    {
      id: "signing-publish-approval-bridge",
      label: "Signing-publish approval bridge",
      outputPath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
      generated: true
    },
    {
      id: "signing-publish-promotion-handshake",
      label: "Signing-publish promotion handshake",
      outputPath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
      generated: true
    },
    {
      id: "publish-rollback-handshake",
      label: "Publish rollback handshake",
      outputPath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
      generated: true
    },
    {
      id: "release-approval-workflow",
      label: "Release approval workflow",
      outputPath: "release/RELEASE-APPROVAL-WORKFLOW.json",
      generated: true
    },
    {
      id: "release-notes",
      label: "Release notes",
      outputPath: "release/RELEASE-NOTES.md",
      generated: true
    },
    {
      id: "publish-gates",
      label: "Publish gates",
      outputPath: "release/PUBLISH-GATES.json",
      generated: true
    },
    {
      id: "promotion-gates",
      label: "Promotion gates",
      outputPath: "release/PROMOTION-GATES.json",
      generated: true
    },
    {
      id: "release-checklist",
      label: "Release checklist",
      outputPath: "release/RELEASE-CHECKLIST.md",
      generated: true
    }
  ];
}

function formatBytes(value) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KiB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
}

function renderPackageReadme({ generatedAt, artifactGroups, allDocs }) {
  const layoutTree = [
    `${PACKAGE_ID}/`,
    "  README.md",
    "  HANDOFF.md",
    "  IMPLEMENTATION-PLAN.md",
    "  PACKAGE-README.md",
    "  artifacts/",
    "    renderer/",
    "    electron/",
    "  release/",
    "    RELEASE-MANIFEST.json",
    "    BUILD-METADATA.json",
    "    REVIEW-MANIFEST.json",
    "    BUNDLE-MATRIX.json",
    "    BUNDLE-ASSEMBLY.json",
    "    PACKAGED-APP-DIRECTORY-SKELETON.json",
    "    PACKAGED-APP-MATERIALIZATION-SKELETON.json",
    "    PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
    "    PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
    "    PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
    "    SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    "    INSTALLER-TARGETS.json",
    "    INSTALLER-TARGET-BUILDER-SKELETON.json",
    "    INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    "    INSTALLER-BUILDER-ORCHESTRATION.json",
    "    INSTALLER-CHANNEL-ROUTING.json",
    "    CHANNEL-PROMOTION-EVIDENCE.json",
    "    SIGNING-METADATA.json",
    "    NOTARIZATION-PLAN.json",
    "    SIGNING-PUBLISH-PIPELINE.json",
    "    SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    "    SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    "    SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    "    PUBLISH-ROLLBACK-HANDSHAKE.json",
    "    RELEASE-APPROVAL-WORKFLOW.json",
    "    RELEASE-NOTES.md",
    "    PUBLISH-GATES.json",
    "    PROMOTION-GATES.json",
    "    RELEASE-SUMMARY.md",
    "    INSTALLER-PLACEHOLDER.json",
    "    RELEASE-CHECKLIST.md",
    "  scripts/",
    "    install-placeholder.cjs"
  ];

  return [
    "# OpenClaw Studio Phase41 Package Snapshot",
    "",
    "这是一个 **phase41 alpha-shell release skeleton**，在 phase26/27/28/29/30/31/32/33/34/35/36/37/38/39/40 packaging 与 shell foundations 的基础上继续补齐 sealed-bundle integrity contract、channel promotion evidence 与 publish rollback handshake，但它依然 **不是 installer**。",
    "",
    `当前已验证里程碑：${PHASE_MILESTONE}。`,
    "",
    "## 当前能交付什么",
    "",
    ...CURRENT_DELIVERY_SURFACES.map((item) => `- ${item}`),
    "",
    "## 当前还没交付什么",
    "",
    "- 不会安装到系统目录",
    "- 不会修改 services/install/config",
    "- 不会写入 `~/.openclaw`",
    "- 不会启动真实 external connector processes",
    "- 不会开放真实 host-side execution",
    "",
    "## 正式 installer 仍缺什么",
    "",
    ...FORMAL_INSTALLER_GAPS.map((item) => `- ${item}`),
    "",
    "## 快照结构",
    "",
    "```text",
    ...layoutTree,
    "```",
    "",
    "## 已复制的 artifact 组",
    "",
    ...artifactGroups.map(
      (group) =>
        `- ${group.label}: ${group.fileCount} files, ${formatBytes(group.totalBytes)}, output=${group.outputRoot}`
    ),
    "",
    "## 已包含的文档",
    "",
    ...allDocs.map((doc) => `- ${doc.outputPath}${doc.generated ? "（generated）" : ""}`),
    "",
    "## 查看顺序建议",
    "",
    "- 先看 `release/RELEASE-MANIFEST.json`",
    "- 再看 `release/BUILD-METADATA.json`",
    "- 再看 `release/REVIEW-MANIFEST.json`",
    "- 再看 `release/BUNDLE-MATRIX.json`",
    "- 再看 `release/BUNDLE-ASSEMBLY.json`",
    "- 再看 `release/PACKAGED-APP-DIRECTORY-SKELETON.json`",
    "- 再看 `release/PACKAGED-APP-MATERIALIZATION-SKELETON.json`",
    "- 再看 `release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json`",
    "- 再看 `release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json`",
    "- 再看 `release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json`",
    "- 再看 `release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json`",
    "- 再看 `release/INSTALLER-TARGETS.json`",
    "- 再看 `release/INSTALLER-TARGET-BUILDER-SKELETON.json`",
    "- 再看 `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json`",
    "- 再看 `release/INSTALLER-BUILDER-ORCHESTRATION.json`",
    "- 再看 `release/INSTALLER-CHANNEL-ROUTING.json`",
    "- 再看 `release/CHANNEL-PROMOTION-EVIDENCE.json`",
    "- 再看 `release/SIGNING-METADATA.json`",
    "- 再看 `release/NOTARIZATION-PLAN.json`",
    "- 再看 `release/SIGNING-PUBLISH-PIPELINE.json`",
    "- 再看 `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json`",
    "- 再看 `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json`",
    "- 再看 `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json`",
    "- 再看 `release/PUBLISH-ROLLBACK-HANDSHAKE.json`",
    "- 再看 `release/RELEASE-APPROVAL-WORKFLOW.json`",
    "- 再看 `release/RELEASE-NOTES.md`",
    "- 再看 `release/PUBLISH-GATES.json`",
    "- 再看 `release/PROMOTION-GATES.json`",
    "- 再看 `release/RELEASE-SUMMARY.md`",
    "- 再看 `release/INSTALLER-PLACEHOLDER.json`",
    "- 再看 `release/RELEASE-CHECKLIST.md`",
    "- 最后审阅 `artifacts/renderer` 与 `artifacts/electron`",
    "",
    "## 说明",
    "",
    "- `scripts/install-placeholder.cjs` 只解释当前 installer 仍缺什么，不执行安装",
    "- 如需重新生成整个 snapshot，请回到 repo root 运行 `npm run package:alpha`",
    "",
    `Generated: ${generatedAt}`
  ].join("\n");
}

function renderReleaseChecklist() {
  return [
    "# OpenClaw Studio Phase41 Release Checklist",
    "",
    "## Required Commands",
    "",
    ...REQUIRED_RELEASE_COMMANDS.map((command) => `- \`${command}\``),
    "",
    "## Optional Dry-Run",
    "",
    ...OPTIONAL_RELEASE_COMMANDS.map((command) => `- \`${command}\``),
    "",
    "## Artifact Contract",
    "",
    "- `artifacts/renderer/index.html` 必须存在并指向打包后的 asset",
    "- `artifacts/electron/electron/main.js` 与 `artifacts/electron/electron/preload.js` 必须存在",
    "- `release/RELEASE-MANIFEST.json` 必须列出 docs、artifact groups、installer placeholder contract",
    "- `release/BUILD-METADATA.json` 必须记录 build/preflight/toolchain 元数据",
    `- \`release/REVIEW-MANIFEST.json\` 必须列出 ${REVIEW_STAGE_ID} pipeline stage、review docs、artifact groups、blocked 发布动作`,
    "- `release/BUNDLE-MATRIX.json` 必须列出 per-platform bundle skeleton",
    "- `release/BUNDLE-ASSEMBLY.json` 必须列出 bundle assembly skeleton",
    "- `release/PACKAGED-APP-DIRECTORY-SKELETON.json` 必须列出 per-platform packaged app directory skeleton",
    "- `release/PACKAGED-APP-MATERIALIZATION-SKELETON.json` 必须列出 packaged-app materialization skeleton",
    "- `release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json` 必须列出 packaged-app directory materialization metadata",
    "- `release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json` 必须列出 packaged-app staged output skeleton",
    "- `release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json` 必须列出 packaged-app bundle sealing skeleton",
    "- `release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json` 必须列出 sealed-bundle integrity contract",
    "- `release/INSTALLER-TARGETS.json` 必须列出 installer target metadata",
    "- `release/INSTALLER-TARGET-BUILDER-SKELETON.json` 必须列出 installer-target builder skeleton",
    "- `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json` 必须列出 installer builder execution skeleton",
    "- `release/INSTALLER-BUILDER-ORCHESTRATION.json` 必须列出 installer builder orchestration metadata",
    "- `release/INSTALLER-CHANNEL-ROUTING.json` 必须列出 installer channel routing metadata",
    "- `release/CHANNEL-PROMOTION-EVIDENCE.json` 必须列出 channel promotion evidence metadata",
    "- `release/SIGNING-METADATA.json` 必须列出 signing-ready metadata",
    "- `release/NOTARIZATION-PLAN.json` 必须列出 signing / notarization skeleton",
    "- `release/SIGNING-PUBLISH-PIPELINE.json` 必须列出 signing & publish pipeline skeleton",
    "- `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json` 必须列出 signing-publish gating handshake metadata",
    "- `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json` 必须列出 signing-publish approval bridge metadata",
    "- `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json` 必须列出 signing-publish promotion handshake metadata",
    "- `release/PUBLISH-ROLLBACK-HANDSHAKE.json` 必须列出 publish rollback handshake metadata",
    "- `release/RELEASE-APPROVAL-WORKFLOW.json` 必须列出 release approval workflow metadata",
    "- `release/RELEASE-NOTES.md` 必须列出当前 release notes 草案",
    "- `release/PUBLISH-GATES.json` 必须列出 publish gating 条目",
    "- `release/PROMOTION-GATES.json` 必须列出 promotion gating 条目",
    "- `release/RELEASE-SUMMARY.md` 必须给出当前 snapshot 的 release review 摘要",
    "- `release/INSTALLER-PLACEHOLDER.json` 必须明确当前不是 installer，以及正式 installer 仍缺哪些步骤",
    "- `scripts/install-placeholder.cjs` 只能输出说明，不得执行任何安装动作",
    "",
    "## Current Delivery Surface",
    "",
    ...CURRENT_DELIVERY_SURFACES.map((item) => `- ${item}`),
    "",
    "## Still Blocked For Formal Installer",
    "",
    ...FORMAL_INSTALLER_GAPS.map((item) => `- ${item}`),
    "",
    "## Safety Boundaries",
    "",
    ...DELIVERY_CONSTRAINTS.map((item) => `- ${item}`)
  ].join("\n");
}

function renderReleaseSummary({ generatedAt, artifactGroups, reviewManifest }) {
  return [
    "# OpenClaw Studio Phase41 Release Summary",
    "",
    `Milestone: ${PHASE_MILESTONE}`,
    `Review stage: ${reviewManifest.pipeline.stage}`,
    `Review docs: ${reviewManifest.reviewDocs.join(", ")}`,
    "",
    "## Artifact groups",
    ...artifactGroups.map((group) => `- ${group.label}: ${group.fileCount} files, ${formatBytes(group.totalBytes)}, output=${group.outputRoot}`),
    "",
    "## Pipeline depth",
    ...reviewManifest.pipeline.stages.map((stage) => `- ${stage.id}: ${stage.label} (${stage.status}) · ${stage.detail}`),
    "",
    "## Still blocked",
    ...reviewManifest.blockedActions.map((item) => `- ${item}`),
    "",
    `Generated: ${generatedAt}`
  ].join("\n");
}

function renderReleaseNotes({ generatedAt }) {
  return [
    "# OpenClaw Studio Phase41 Release Notes",
    "",
    `Milestone: ${PHASE_MILESTONE}`,
    "",
    "## Highlights",
    "- sealed-bundle integrity contract now turns review-only bundle sealing metadata into explicit per-platform integrity, digest, and audit checkpoints without sealing anything for real",
    "- channel promotion evidence now maps installer channel routing and promotion targets into explicit alpha -> beta -> stable evidence packets without promoting any artifact for real",
    "- publish rollback handshake now connects publish gates, promotion evidence, and rollback checkpoints without publishing, promoting, or rolling back anything",
    "",
    "## Current posture",
    "- still local-only",
    "- still not an installer",
    "- still no real publish/upload/sign/notarize actions",
    "",
    `Generated: ${generatedAt}`
  ].join("\n");
}

function buildReviewManifest({ generatedAt, artifactGroups, allDocs }) {
  return {
    schemaVersion: "openclaw-studio-review-manifest/v1",
    generatedAt,
    phase: PHASE_ID,
    milestone: PHASE_MILESTONE,
    reviewDocs: allDocs.map((doc) => doc.outputPath),
    artifactGroups: artifactGroups.map((group) => ({
      id: group.id,
      label: group.label,
      outputRoot: group.outputRoot,
      fileCount: group.fileCount,
      entrypoints: group.entrypoints
    })),
    pipeline: {
      stage: REVIEW_STAGE_ID,
      stages: [
        { id: "pipeline-docs", label: "Docs closeout", status: "ready", detail: "README, HANDOFF, IMPLEMENTATION-PLAN, PACKAGE-README, and release docs are generated together." },
        { id: "pipeline-artifacts", label: "Artifact snapshot", status: "ready", detail: "Renderer and Electron bundles are copied into a reviewable alpha-shell snapshot." },
        { id: "pipeline-bundles", label: "Bundle assembly skeleton", status: "ready", detail: "Per-platform bundle matrix and bundle assembly metadata describe future packaged outputs without building them yet." },
        { id: "pipeline-materialization", label: "Packaged-app materialization skeleton", status: "ready", detail: "Packaged app directory plans still map into explicit materialization steps without creating a real packaged app." },
        { id: "pipeline-directory-materialization", label: "Packaged-app directory materialization", status: "ready", detail: "Per-platform directory staging roots, launcher paths, verification manifests, and review checkpoints are now formalized as metadata." },
        { id: "pipeline-staged-output", label: "Packaged-app staged output skeleton", status: "ready", detail: "Directory materialization now feeds explicit staged outputs and manifests without creating any real packaged artifact." },
        { id: "pipeline-bundle-sealing", label: "Packaged-app bundle sealing skeleton", status: "ready", detail: "Staged outputs now feed review-only sealing manifests and integrity checkpoints without freezing any real packaged bundle." },
        { id: "pipeline-bundle-integrity", label: "Sealed-bundle integrity contract", status: "ready", detail: "Bundle sealing metadata now feeds explicit integrity, digest, and audit checkpoints without attesting any real packaged bundle." },
        { id: "pipeline-installer-builders", label: "Installer-target builder skeleton", status: "ready", detail: "Installer targets still map cleanly to per-platform builder identities without invoking a real builder." },
        { id: "pipeline-installer-builder-execution", label: "Installer builder execution skeleton", status: "ready", detail: "Future builder commands, environment, outputs, and review checks are now declared without executing any builder." },
        { id: "pipeline-installer-builder-orchestration", label: "Installer builder orchestration", status: "ready", detail: "Builder execution skeletons now sit inside per-platform orchestration flows without invoking any real builder." },
        { id: "pipeline-installer-channel-routing", label: "Installer channel routing", status: "ready", detail: "Review-only installer flows now map cleanly into alpha/beta/stable routing manifests without routing any build for real." },
        { id: "pipeline-channel-promotion-evidence", label: "Channel promotion evidence", status: "ready", detail: "Channel routing now feeds explicit promotion evidence packets and proof manifests without promoting any artifact for real." },
        { id: "pipeline-signing-publish", label: "Signing & publish pipeline", status: "ready", detail: "Signing, notarization, checksums, upload, and promotion stages remain reviewable as a structured pipeline contract." },
        { id: "pipeline-signing-gating", label: "Signing-publish gating handshake", status: "ready", detail: "Signing, publish, approval, and promotion evidence now flow through a structured handshake contract without approving or publishing anything." },
        { id: "pipeline-signing-approval-bridge", label: "Signing-publish approval bridge", status: "ready", detail: "Gating handshake, approval workflow, and promotion evidence are now bridged as one reviewable approval flow." },
        { id: "pipeline-signing-promotion-handshake", label: "Signing-publish promotion handshake", status: "ready", detail: "Channel routing, publish gates, and promotion evidence now converge in a dedicated review-only promotion handshake." },
        { id: "pipeline-publish-rollback", label: "Publish rollback handshake", status: "ready", detail: "Publish and promotion review now carry explicit rollback checkpoints and recovery-channel handoff metadata without rolling anything back for real." },
        { id: "pipeline-approval", label: "Release approval workflow", status: "ready", detail: "Release approval remains metadata-only and blocks any live signing, publish, or host-side execution." },
        { id: "pipeline-publish", label: "Promotion gating", status: "blocked", detail: "Installer build, signing, upload, and channel promotion remain intentionally out of scope." }
      ]
    },
    blockedActions: FORMAL_INSTALLER_GAPS
  };
}

function buildBundleMatrix({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-bundle-matrix/v1",
    generatedAt,
    phase: PHASE_ID,
    bundles: [
      { platform: "windows", targets: ["portable-dir", "nsis-installer"], status: "planned" },
      { platform: "macos", targets: ["app-bundle", "dmg"], status: "planned" },
      { platform: "linux", targets: ["AppImage", "deb", "rpm"], status: "planned" }
    ]
  };
}

function buildBundleAssembly({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-bundle-assembly/v1",
    generatedAt,
    phase: PHASE_ID,
    assemblies: [
      {
        platform: "windows",
        status: "planned",
        inputs: ["artifacts/renderer", "artifacts/electron"],
        output: "future/packaged-app/windows/OpenClaw Studio",
        packagedAppDirectoryId: "packaged-app-directory-windows"
      },
      {
        platform: "macos",
        status: "planned",
        inputs: ["artifacts/renderer", "artifacts/electron"],
        output: "future/packaged-app/macos/OpenClaw Studio.app",
        packagedAppDirectoryId: "packaged-app-directory-macos"
      },
      {
        platform: "linux",
        status: "planned",
        inputs: ["artifacts/renderer", "artifacts/electron"],
        output: "future/packaged-app/linux/openclaw-studio",
        packagedAppDirectoryId: "packaged-app-directory-linux"
      }
    ]
  };
}

function buildPackagedAppDirectorySkeleton({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-packaged-app-directory-skeleton/v1",
    generatedAt,
    phase: PHASE_ID,
    directories: [
      {
        id: "packaged-app-directory-windows",
        platform: "windows",
        status: "planned",
        root: "future/packaged-app/windows/OpenClaw Studio",
        launcher: "OpenClaw Studio.exe",
        inputs: ["artifacts/renderer", "artifacts/electron"],
        requiredPaths: [
          "OpenClaw Studio.exe",
          "resources/app.asar",
          "resources/app/package.json",
          "resources/app/assets"
        ]
      },
      {
        id: "packaged-app-directory-macos",
        platform: "macos",
        status: "planned",
        root: "future/packaged-app/macos/OpenClaw Studio.app",
        launcher: "Contents/MacOS/OpenClaw Studio",
        inputs: ["artifacts/renderer", "artifacts/electron"],
        requiredPaths: [
          "Contents/Info.plist",
          "Contents/MacOS/OpenClaw Studio",
          "Contents/Resources/app.asar",
          "Contents/Resources/app/package.json"
        ]
      },
      {
        id: "packaged-app-directory-linux",
        platform: "linux",
        status: "planned",
        root: "future/packaged-app/linux/openclaw-studio",
        launcher: "openclaw-studio",
        inputs: ["artifacts/renderer", "artifacts/electron"],
        requiredPaths: [
          "openclaw-studio",
          "resources/app.asar",
          "resources/app/package.json",
          "resources/app/assets"
        ]
      }
    ]
  };
}

function buildPackagedAppDirectoryMaterialization({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-packaged-app-directory-materialization/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    directories: [
      {
        id: "directory-materialization-windows",
        platform: "windows",
        assemblyId: "windows",
        packagedAppDirectoryId: "packaged-app-directory-windows",
        packagedAppMaterializationId: "materialize-windows-packaged-app",
        status: "planned",
        stagedOutputRoot: "future/packaged-app/windows/OpenClaw Studio",
        verificationManifestPath: "future/packaged-app/windows/materialization-manifest.json",
        launcherPath: "OpenClaw Studio.exe",
        resourcePaths: ["resources/app.asar", "resources/app/package.json", "resources/app/assets"],
        steps: [
          "resolve renderer/electron snapshot inputs",
          "declare root directory layout",
          "map launcher and resources paths",
          "record verification manifest"
        ],
        blockedBy: ["materialization remains review-only", "installer build remains disabled", "host-side execution remains disabled"]
      },
      {
        id: "directory-materialization-macos",
        platform: "macos",
        assemblyId: "macos",
        packagedAppDirectoryId: "packaged-app-directory-macos",
        packagedAppMaterializationId: "materialize-macos-packaged-app",
        status: "planned",
        stagedOutputRoot: "future/packaged-app/macos/OpenClaw Studio.app",
        verificationManifestPath: "future/packaged-app/macos/materialization-manifest.json",
        launcherPath: "Contents/MacOS/OpenClaw Studio",
        resourcePaths: ["Contents/Info.plist", "Contents/Resources/app.asar", "Contents/Resources/app/package.json"],
        steps: [
          "resolve renderer/electron snapshot inputs",
          "declare .app bundle layout",
          "map launcher and resources paths",
          "record verification manifest"
        ],
        blockedBy: ["materialization remains review-only", "installer build remains disabled", "host-side execution remains disabled"]
      },
      {
        id: "directory-materialization-linux",
        platform: "linux",
        assemblyId: "linux",
        packagedAppDirectoryId: "packaged-app-directory-linux",
        packagedAppMaterializationId: "materialize-linux-packaged-app",
        status: "planned",
        stagedOutputRoot: "future/packaged-app/linux/openclaw-studio",
        verificationManifestPath: "future/packaged-app/linux/materialization-manifest.json",
        launcherPath: "openclaw-studio",
        resourcePaths: ["resources/app.asar", "resources/app/package.json", "resources/app/assets"],
        steps: [
          "resolve renderer/electron snapshot inputs",
          "declare root directory layout",
          "map launcher and resources paths",
          "record verification manifest"
        ],
        blockedBy: ["materialization remains review-only", "installer build remains disabled", "host-side execution remains disabled"]
      }
    ]
  };
}

function buildPackagedAppMaterializationSkeleton({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-packaged-app-materialization-skeleton/v1",
    generatedAt,
    phase: PHASE_ID,
    materializations: [
      {
        id: "materialize-windows-packaged-app",
        platform: "windows",
        assemblyId: "windows",
        packagedAppDirectoryId: "packaged-app-directory-windows",
        directoryMaterializationId: "directory-materialization-windows",
        status: "planned",
        stagedOutputRoot: "future/packaged-app/windows/OpenClaw Studio",
        verificationManifestPath: "future/packaged-app/windows/materialization-manifest.json",
        reviewMode: "local-only",
        steps: ["collect renderer/electron inputs", "assemble app.asar", "stage packaged app directory", "verify launcher path"]
      },
      {
        id: "materialize-macos-packaged-app",
        platform: "macos",
        assemblyId: "macos",
        packagedAppDirectoryId: "packaged-app-directory-macos",
        directoryMaterializationId: "directory-materialization-macos",
        status: "planned",
        stagedOutputRoot: "future/packaged-app/macos/OpenClaw Studio.app",
        verificationManifestPath: "future/packaged-app/macos/materialization-manifest.json",
        reviewMode: "local-only",
        steps: ["collect renderer/electron inputs", "assemble app.asar", "stage .app bundle layout", "verify launcher path"]
      },
      {
        id: "materialize-linux-packaged-app",
        platform: "linux",
        assemblyId: "linux",
        packagedAppDirectoryId: "packaged-app-directory-linux",
        directoryMaterializationId: "directory-materialization-linux",
        status: "planned",
        stagedOutputRoot: "future/packaged-app/linux/openclaw-studio",
        verificationManifestPath: "future/packaged-app/linux/materialization-manifest.json",
        reviewMode: "local-only",
        steps: ["collect renderer/electron inputs", "assemble app.asar", "stage packaged app directory", "verify launcher path"]
      }
    ]
  };
}

function buildPackagedAppStagedOutputSkeleton({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-packaged-app-staged-output-skeleton/v1",
    generatedAt,
    phase: PHASE_ID,
    outputs: [
      {
        id: "staged-output-windows",
        platform: "windows",
        directoryMaterializationId: "directory-materialization-windows",
        materializationId: "materialize-windows-packaged-app",
        bundleSealingId: "bundle-sealing-windows",
        integrityContractId: "integrity-contract-windows",
        status: "planned",
        outputRoot: "future/staged-output/windows/OpenClaw Studio",
        manifests: ["future/staged-output/windows/output-manifest.json", "future/staged-output/windows/checksum-manifest.json"]
      },
      {
        id: "staged-output-macos",
        platform: "macos",
        directoryMaterializationId: "directory-materialization-macos",
        materializationId: "materialize-macos-packaged-app",
        bundleSealingId: "bundle-sealing-macos",
        integrityContractId: "integrity-contract-macos",
        status: "planned",
        outputRoot: "future/staged-output/macos/OpenClaw Studio.app",
        manifests: ["future/staged-output/macos/output-manifest.json", "future/staged-output/macos/checksum-manifest.json"]
      },
      {
        id: "staged-output-linux",
        platform: "linux",
        directoryMaterializationId: "directory-materialization-linux",
        materializationId: "materialize-linux-packaged-app",
        bundleSealingId: "bundle-sealing-linux",
        integrityContractId: "integrity-contract-linux",
        status: "planned",
        outputRoot: "future/staged-output/linux/openclaw-studio",
        manifests: ["future/staged-output/linux/output-manifest.json", "future/staged-output/linux/checksum-manifest.json"]
      }
    ]
  };
}

function buildPackagedAppBundleSealingSkeleton({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-packaged-app-bundle-sealing-skeleton/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    bundles: [
      {
        id: "bundle-sealing-windows",
        platform: "windows",
        stagedOutputId: "staged-output-windows",
        integrityContractId: "integrity-contract-windows",
        installerFlowId: "orchestrate-windows-builders",
        status: "planned",
        sealedBundleRoot: "future/sealed-bundles/windows/OpenClaw Studio",
        sealManifestPath: "future/sealed-bundles/windows/bundle-seal-manifest.json",
        integrityManifestPath: "future/sealed-bundles/windows/bundle-integrity-manifest.json",
        rollbackCheckpointId: "sealed-bundle-checkpoint-windows",
        reviewChecks: ["staged output layout frozen", "seal manifest declared", "integrity manifest path declared"],
        canSeal: false
      },
      {
        id: "bundle-sealing-macos",
        platform: "macos",
        stagedOutputId: "staged-output-macos",
        integrityContractId: "integrity-contract-macos",
        installerFlowId: "orchestrate-macos-builders",
        status: "planned",
        sealedBundleRoot: "future/sealed-bundles/macos/OpenClaw Studio.app",
        sealManifestPath: "future/sealed-bundles/macos/bundle-seal-manifest.json",
        integrityManifestPath: "future/sealed-bundles/macos/bundle-integrity-manifest.json",
        rollbackCheckpointId: "sealed-bundle-checkpoint-macos",
        reviewChecks: ["bundle layout frozen", "seal manifest declared", "integrity manifest path declared"],
        canSeal: false
      },
      {
        id: "bundle-sealing-linux",
        platform: "linux",
        stagedOutputId: "staged-output-linux",
        integrityContractId: "integrity-contract-linux",
        installerFlowId: "orchestrate-linux-builders",
        status: "planned",
        sealedBundleRoot: "future/sealed-bundles/linux/openclaw-studio",
        sealManifestPath: "future/sealed-bundles/linux/bundle-seal-manifest.json",
        integrityManifestPath: "future/sealed-bundles/linux/bundle-integrity-manifest.json",
        rollbackCheckpointId: "sealed-bundle-checkpoint-linux",
        reviewChecks: ["staged output layout frozen", "seal manifest declared", "integrity manifest path declared"],
        canSeal: false
      }
    ]
  };
}

function buildSealedBundleIntegrityContract({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-sealed-bundle-integrity-contract/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    contracts: [
      {
        id: "integrity-contract-windows",
        platform: "windows",
        channel: "alpha",
        stagedOutputId: "staged-output-windows",
        bundleSealingId: "bundle-sealing-windows",
        installerFlowId: "orchestrate-windows-builders",
        promotionEvidenceIds: ["promotion-evidence-alpha-to-beta", "promotion-evidence-beta-to-stable"],
        rollbackCheckpointId: "sealed-bundle-checkpoint-windows",
        status: "planned",
        contractManifestPath: "future/sealed-bundles/windows/integrity-contract.json",
        integrityManifestPath: "future/sealed-bundles/windows/bundle-integrity-manifest.json",
        auditManifestPath: "future/sealed-bundles/windows/integrity-audit.json",
        hashSources: [
          "future/staged-output/windows/output-manifest.json",
          "future/staged-output/windows/checksum-manifest.json"
        ],
        reviewChecks: [
          "seal manifest linked",
          "integrity manifest path declared",
          "digest source manifests declared",
          "promotion evidence anchors recorded"
        ],
        blockedBy: ["sealed bundle remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"],
        canVerify: false
      },
      {
        id: "integrity-contract-macos",
        platform: "macos",
        channel: "alpha",
        stagedOutputId: "staged-output-macos",
        bundleSealingId: "bundle-sealing-macos",
        installerFlowId: "orchestrate-macos-builders",
        promotionEvidenceIds: ["promotion-evidence-alpha-to-beta", "promotion-evidence-beta-to-stable"],
        rollbackCheckpointId: "sealed-bundle-checkpoint-macos",
        status: "planned",
        contractManifestPath: "future/sealed-bundles/macos/integrity-contract.json",
        integrityManifestPath: "future/sealed-bundles/macos/bundle-integrity-manifest.json",
        auditManifestPath: "future/sealed-bundles/macos/integrity-audit.json",
        hashSources: [
          "future/staged-output/macos/output-manifest.json",
          "future/staged-output/macos/checksum-manifest.json"
        ],
        reviewChecks: [
          "seal manifest linked",
          "integrity manifest path declared",
          "digest source manifests declared",
          "promotion evidence anchors recorded"
        ],
        blockedBy: ["sealed bundle remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"],
        canVerify: false
      },
      {
        id: "integrity-contract-linux",
        platform: "linux",
        channel: "alpha",
        stagedOutputId: "staged-output-linux",
        bundleSealingId: "bundle-sealing-linux",
        installerFlowId: "orchestrate-linux-builders",
        promotionEvidenceIds: ["promotion-evidence-alpha-to-beta", "promotion-evidence-beta-to-stable"],
        rollbackCheckpointId: "sealed-bundle-checkpoint-linux",
        status: "planned",
        contractManifestPath: "future/sealed-bundles/linux/integrity-contract.json",
        integrityManifestPath: "future/sealed-bundles/linux/bundle-integrity-manifest.json",
        auditManifestPath: "future/sealed-bundles/linux/integrity-audit.json",
        hashSources: [
          "future/staged-output/linux/output-manifest.json",
          "future/staged-output/linux/checksum-manifest.json"
        ],
        reviewChecks: [
          "seal manifest linked",
          "integrity manifest path declared",
          "digest source manifests declared",
          "promotion evidence anchors recorded"
        ],
        blockedBy: ["sealed bundle remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"],
        canVerify: false
      }
    ]
  };
}

function buildInstallerTargets({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-installer-targets/v1",
    generatedAt,
    phase: PHASE_ID,
    targets: [
      {
        id: "windows-portable-dir",
        platform: "windows",
        label: "Portable directory",
        type: "portable-dir",
        status: "planned",
        packagedAppDirectoryId: "packaged-app-directory-windows",
        bundleSealingId: "bundle-sealing-windows",
        integrityContractId: "integrity-contract-windows",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-windows-portable-dir-builder",
        plannedOutput: "future/installers/windows/OpenClaw Studio-portable",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "checksums", "release approval workflow"],
        canBuild: false
      },
      {
        id: "windows-nsis",
        platform: "windows",
        label: "NSIS installer",
        type: "nsis-installer",
        status: "blocked",
        packagedAppDirectoryId: "packaged-app-directory-windows",
        bundleSealingId: "bundle-sealing-windows",
        integrityContractId: "integrity-contract-windows",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-windows-nsis-builder",
        plannedOutput: "future/installers/windows/OpenClaw Studio Setup.exe",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "builder execution skeleton", "signing", "release approval workflow"],
        canBuild: false
      },
      {
        id: "macos-app-bundle",
        platform: "macos",
        label: "Application bundle",
        type: "app-bundle",
        status: "planned",
        packagedAppDirectoryId: "packaged-app-directory-macos",
        bundleSealingId: "bundle-sealing-macos",
        integrityContractId: "integrity-contract-macos",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-macos-app-bundle-builder",
        plannedOutput: "future/installers/macos/OpenClaw Studio.app",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "codesign", "release approval workflow"],
        canBuild: false
      },
      {
        id: "macos-dmg",
        platform: "macos",
        label: "DMG installer",
        type: "dmg",
        status: "blocked",
        packagedAppDirectoryId: "packaged-app-directory-macos",
        bundleSealingId: "bundle-sealing-macos",
        integrityContractId: "integrity-contract-macos",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-macos-dmg-builder",
        plannedOutput: "future/installers/macos/OpenClaw Studio.dmg",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "builder execution skeleton", "codesign", "notarization", "release approval workflow"],
        canBuild: false
      },
      {
        id: "linux-appimage",
        platform: "linux",
        label: "AppImage",
        type: "AppImage",
        status: "blocked",
        packagedAppDirectoryId: "packaged-app-directory-linux",
        bundleSealingId: "bundle-sealing-linux",
        integrityContractId: "integrity-contract-linux",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-linux-appimage-builder",
        plannedOutput: "future/installers/linux/OpenClaw Studio.AppImage",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "builder execution skeleton", "checksums", "release approval workflow"],
        canBuild: false
      },
      {
        id: "linux-deb",
        platform: "linux",
        label: "Deb package",
        type: "deb",
        status: "blocked",
        packagedAppDirectoryId: "packaged-app-directory-linux",
        bundleSealingId: "bundle-sealing-linux",
        integrityContractId: "integrity-contract-linux",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-linux-deb-builder",
        plannedOutput: "future/installers/linux/openclaw-studio.deb",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "builder execution skeleton", "signing", "release approval workflow"],
        canBuild: false
      },
      {
        id: "linux-rpm",
        platform: "linux",
        label: "RPM package",
        type: "rpm",
        status: "blocked",
        packagedAppDirectoryId: "packaged-app-directory-linux",
        bundleSealingId: "bundle-sealing-linux",
        integrityContractId: "integrity-contract-linux",
        channelRouteId: "route-alpha",
        builderExecutionSkeletonId: "execute-linux-rpm-builder",
        plannedOutput: "future/installers/linux/openclaw-studio.rpm",
        requires: ["packaged-app-directory-materialization", "packaged-app-bundle-sealing", "builder execution skeleton", "signing", "release approval workflow"],
        canBuild: false
      }
    ]
  };
}

function buildInstallerBuilderExecutionSkeleton({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-installer-builder-execution-skeleton/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    executions: [
      {
        id: "execute-windows-portable-dir-builder",
        targetId: "windows-portable-dir",
        builderId: "portable-dir-builder",
        platform: "windows",
        packagedAppDirectoryMaterializationId: "directory-materialization-windows",
        status: "planned",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "portable-dir", "--input", "future/packaged-app/windows/OpenClaw Studio", "--output", "future/installers/windows/OpenClaw Studio-portable"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/windows/OpenClaw Studio-portable",
        reviewChecks: ["packaged app directory materialized", "output path declared", "checksum publication remains blocked"],
        canExecute: false
      },
      {
        id: "execute-windows-nsis-builder",
        targetId: "windows-nsis",
        builderId: "nsis-builder",
        platform: "windows",
        packagedAppDirectoryMaterializationId: "directory-materialization-windows",
        status: "blocked",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "nsis", "--input", "future/packaged-app/windows/OpenClaw Studio", "--output", "future/installers/windows/OpenClaw Studio Setup.exe"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/windows/OpenClaw Studio Setup.exe",
        reviewChecks: ["packaged app directory materialized", "builder config declared", "signing prerequisites reviewed"],
        canExecute: false
      },
      {
        id: "execute-macos-app-bundle-builder",
        targetId: "macos-app-bundle",
        builderId: "app-bundle-builder",
        platform: "macos",
        packagedAppDirectoryMaterializationId: "directory-materialization-macos",
        status: "planned",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "app-bundle", "--input", "future/packaged-app/macos/OpenClaw Studio.app", "--output", "future/installers/macos/OpenClaw Studio.app"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/macos/OpenClaw Studio.app",
        reviewChecks: ["packaged app directory materialized", "bundle output declared", "codesign prerequisites reviewed"],
        canExecute: false
      },
      {
        id: "execute-macos-dmg-builder",
        targetId: "macos-dmg",
        builderId: "dmg-builder",
        platform: "macos",
        packagedAppDirectoryMaterializationId: "directory-materialization-macos",
        status: "blocked",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "dmg", "--input", "future/packaged-app/macos/OpenClaw Studio.app", "--output", "future/installers/macos/OpenClaw Studio.dmg"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/macos/OpenClaw Studio.dmg",
        reviewChecks: ["packaged app directory materialized", "dmg config declared", "notarization prerequisites reviewed"],
        canExecute: false
      },
      {
        id: "execute-linux-appimage-builder",
        targetId: "linux-appimage",
        builderId: "appimage-builder",
        platform: "linux",
        packagedAppDirectoryMaterializationId: "directory-materialization-linux",
        status: "blocked",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "AppImage", "--input", "future/packaged-app/linux/openclaw-studio", "--output", "future/installers/linux/OpenClaw Studio.AppImage"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/linux/OpenClaw Studio.AppImage",
        reviewChecks: ["packaged app directory materialized", "appimage config declared", "checksum prerequisites reviewed"],
        canExecute: false
      },
      {
        id: "execute-linux-deb-builder",
        targetId: "linux-deb",
        builderId: "deb-builder",
        platform: "linux",
        packagedAppDirectoryMaterializationId: "directory-materialization-linux",
        status: "blocked",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "deb", "--input", "future/packaged-app/linux/openclaw-studio", "--output", "future/installers/linux/openclaw-studio.deb"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/linux/openclaw-studio.deb",
        reviewChecks: ["packaged app directory materialized", "deb config declared", "signing prerequisites reviewed"],
        canExecute: false
      },
      {
        id: "execute-linux-rpm-builder",
        targetId: "linux-rpm",
        builderId: "rpm-builder",
        platform: "linux",
        packagedAppDirectoryMaterializationId: "directory-materialization-linux",
        status: "blocked",
        command: {
          binary: "future-installer-builder",
          args: ["--target", "rpm", "--input", "future/packaged-app/linux/openclaw-studio", "--output", "future/installers/linux/openclaw-studio.rpm"],
          workingDirectory: "."
        },
        environment: ["OC_RELEASE_CHANNEL=alpha", `OC_RELEASE_PHASE=${PHASE_ID}`],
        plannedOutput: "future/installers/linux/openclaw-studio.rpm",
        reviewChecks: ["packaged app directory materialized", "rpm config declared", "signing prerequisites reviewed"],
        canExecute: false
      }
    ]
  };
}

function buildInstallerTargetBuilderSkeleton({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-installer-target-builder-skeleton/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    builders: [
      { targetId: "windows-portable-dir", platform: "windows", builder: "portable-dir-builder", executionSkeletonId: "execute-windows-portable-dir-builder", status: "planned", canExecute: false },
      { targetId: "windows-nsis", platform: "windows", builder: "nsis-builder", executionSkeletonId: "execute-windows-nsis-builder", status: "blocked", canExecute: false },
      { targetId: "macos-app-bundle", platform: "macos", builder: "app-bundle-builder", executionSkeletonId: "execute-macos-app-bundle-builder", status: "planned", canExecute: false },
      { targetId: "macos-dmg", platform: "macos", builder: "dmg-builder", executionSkeletonId: "execute-macos-dmg-builder", status: "blocked", canExecute: false },
      { targetId: "linux-appimage", platform: "linux", builder: "appimage-builder", executionSkeletonId: "execute-linux-appimage-builder", status: "blocked", canExecute: false },
      { targetId: "linux-deb", platform: "linux", builder: "deb-builder", executionSkeletonId: "execute-linux-deb-builder", status: "blocked", canExecute: false },
      { targetId: "linux-rpm", platform: "linux", builder: "rpm-builder", executionSkeletonId: "execute-linux-rpm-builder", status: "blocked", canExecute: false }
    ]
  };
}

function buildInstallerBuilderOrchestration({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-installer-builder-orchestration/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    flows: [
      {
        id: "orchestrate-windows-builders",
        platform: "windows",
        stagedOutputId: "staged-output-windows",
        bundleSealingId: "bundle-sealing-windows",
        integrityContractId: "integrity-contract-windows",
        channelRouteId: "route-alpha",
        executionIds: ["execute-windows-portable-dir-builder", "execute-windows-nsis-builder"],
        status: "planned"
      },
      {
        id: "orchestrate-macos-builders",
        platform: "macos",
        stagedOutputId: "staged-output-macos",
        bundleSealingId: "bundle-sealing-macos",
        integrityContractId: "integrity-contract-macos",
        channelRouteId: "route-alpha",
        executionIds: ["execute-macos-app-bundle-builder", "execute-macos-dmg-builder"],
        status: "planned"
      },
      {
        id: "orchestrate-linux-builders",
        platform: "linux",
        stagedOutputId: "staged-output-linux",
        bundleSealingId: "bundle-sealing-linux",
        integrityContractId: "integrity-contract-linux",
        channelRouteId: "route-alpha",
        executionIds: ["execute-linux-appimage-builder", "execute-linux-deb-builder", "execute-linux-rpm-builder"],
        status: "blocked"
      }
    ]
  };
}

function buildInstallerChannelRouting({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-installer-channel-routing/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    defaultChannel: "alpha",
    routes: [
      {
        id: "route-alpha",
        channel: "alpha",
        status: "planned",
        bundleSealingIds: ["bundle-sealing-windows", "bundle-sealing-macos", "bundle-sealing-linux"],
        integrityContractIds: ["integrity-contract-windows", "integrity-contract-macos", "integrity-contract-linux"],
        installerFlowIds: ["orchestrate-windows-builders", "orchestrate-macos-builders", "orchestrate-linux-builders"],
        targetIds: ["windows-portable-dir", "windows-nsis", "macos-app-bundle", "macos-dmg", "linux-appimage", "linux-deb", "linux-rpm"],
        promotionEvidenceIds: ["promotion-evidence-alpha-to-beta"],
        publishRollbackPathIds: ["publish-rollback-alpha-to-beta"],
        routeManifestPath: "future/channels/alpha/installer-routing.json",
        nextPromotion: "beta",
        canRoute: false
      },
      {
        id: "route-beta",
        channel: "beta",
        status: "blocked",
        sourceChannel: "alpha",
        targetIds: ["windows-portable-dir", "macos-app-bundle", "linux-appimage"],
        promotionEvidenceIds: ["promotion-evidence-alpha-to-beta", "promotion-evidence-beta-to-stable"],
        publishRollbackPathIds: ["publish-rollback-alpha-to-beta", "publish-rollback-beta-to-stable"],
        routeManifestPath: "future/channels/beta/installer-routing.json",
        nextPromotion: "stable",
        requires: ["release approval workflow", "signing-publish promotion handshake", "uploaded artifacts"],
        canRoute: false
      },
      {
        id: "route-stable",
        channel: "stable",
        status: "blocked",
        sourceChannel: "beta",
        targetIds: ["windows-nsis", "macos-dmg", "linux-deb", "linux-rpm"],
        promotionEvidenceIds: ["promotion-evidence-beta-to-stable"],
        publishRollbackPathIds: ["publish-rollback-beta-to-stable"],
        routeManifestPath: "future/channels/stable/installer-routing.json",
        requires: ["notarization", "checksums", "signing-publish promotion handshake", "rollback-ready publish pipeline"],
        canRoute: false
      }
    ]
  };
}

function buildChannelPromotionEvidence({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-channel-promotion-evidence/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    promotions: [
      {
        id: "promotion-evidence-alpha-to-beta",
        from: "alpha",
        to: "beta",
        status: "planned",
        sourceRouteId: "route-alpha",
        targetRouteId: "route-beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        sealedBundleIntegrityIds: ["integrity-contract-windows", "integrity-contract-macos", "integrity-contract-linux"],
        evidenceManifestPath: "future/channels/alpha-to-beta/promotion-evidence.json",
        evidenceArtifacts: [
          "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
          "release/INSTALLER-CHANNEL-ROUTING.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"
        ],
        reviewChecks: [
          "source and target routes linked",
          "sealed-bundle integrity evidence linked",
          "promotion target recorded",
          "rollback handshake anchor recorded"
        ],
        canPromote: false
      },
      {
        id: "promotion-evidence-beta-to-stable",
        from: "beta",
        to: "stable",
        status: "blocked",
        sourceRouteId: "route-beta",
        targetRouteId: "route-stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        sealedBundleIntegrityIds: ["integrity-contract-windows", "integrity-contract-macos", "integrity-contract-linux"],
        evidenceManifestPath: "future/channels/beta-to-stable/promotion-evidence.json",
        evidenceArtifacts: [
          "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
          "release/INSTALLER-CHANNEL-ROUTING.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"
        ],
        reviewChecks: [
          "source and target routes linked",
          "sealed-bundle integrity evidence linked",
          "promotion target recorded",
          "rollback handshake anchor recorded"
        ],
        blockedBy: [
          "uploaded artifacts remain blocked",
          "notarization and checksums remain blocked",
          "publish rollback handshake remains metadata-only"
        ],
        canPromote: false
      }
    ]
  };
}

function buildSigningMetadata({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-signing-metadata/v1",
    generatedAt,
    phase: PHASE_ID,
    readiness: [
      { platform: "windows", status: "blocked", fields: ["publisher", "certificate", "timestamp server"] },
      { platform: "macos", status: "blocked", fields: ["team id", "signing identity", "notary profile"] },
      { platform: "linux", status: "blocked", fields: ["signing key", "checksum output", "package targets"] }
    ]
  };
}

function buildNotarizationPlan({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-notarization-plan/v1",
    generatedAt,
    phase: PHASE_ID,
    platforms: [
      { id: "windows", status: "blocked", steps: ["code signing", "checksum publication"] },
      { id: "macos", status: "blocked", steps: ["signing", "notarization", "stapling"] },
      { id: "linux", status: "blocked", steps: ["package signing", "checksum publication"] }
    ]
  };
}

function buildSigningPublishGatingHandshake({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-signing-publish-gating-handshake/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    canHandshake: false,
    sealedBundleIntegrityContractPath: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    participants: ["release-engineering", "security", "release-manager", "product-owner"],
    request: {
      id: "signing-publish-handshake-request",
      status: "planned",
      fields: [
        { id: "request-phase", label: "Phase", required: true },
        { id: "request-package-id", label: "Package id", required: true },
        { id: "request-bundle-seal", label: "Bundle sealing evidence", required: true },
        { id: "request-bundle-integrity", label: "Sealed-bundle integrity contract", required: true },
        { id: "request-channel-route", label: "Channel route", required: true },
        { id: "request-channel-promotion-evidence", label: "Channel promotion evidence", required: true },
        { id: "request-signing-evidence", label: "Signing evidence", required: true },
        { id: "request-publish-gates", label: "Publish gates", required: true },
        { id: "request-publish-rollback", label: "Publish rollback handshake", required: true },
        { id: "request-promotion-target", label: "Promotion target", required: true }
      ]
    },
    decision: {
      id: "signing-publish-handshake-decision",
      status: "blocked",
      fields: [
        { id: "decision-status", label: "Decision", required: true },
        { id: "decision-scope", label: "Scope", required: true },
        { id: "decision-notes", label: "Reviewer notes", required: false },
        { id: "decision-expiry", label: "Expires at", required: false }
      ]
    },
    acknowledgements: [
      { id: "ack-packaged-app", label: "Packaged-app directory materialization reviewed", status: "planned", artifact: "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json" },
      { id: "ack-bundle-sealing", label: "Packaged-app bundle sealing reviewed", status: "planned", artifact: "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json" },
      { id: "ack-bundle-integrity", label: "Sealed-bundle integrity contract reviewed", status: "planned", artifact: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" },
      { id: "ack-builders", label: "Installer builder execution reviewed", status: "planned", artifact: "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json" },
      { id: "ack-channel-routing", label: "Installer channel routing reviewed", status: "planned", artifact: "release/INSTALLER-CHANNEL-ROUTING.json" },
      { id: "ack-channel-promotion-evidence", label: "Channel promotion evidence reviewed", status: "planned", artifact: "release/CHANNEL-PROMOTION-EVIDENCE.json" },
      { id: "ack-signing", label: "Signing evidence reviewed", status: "blocked", artifact: "release/SIGNING-METADATA.json" },
      { id: "ack-publish", label: "Publish and promotion gates reviewed", status: "blocked", artifact: "release/PUBLISH-GATES.json" },
      { id: "ack-publish-rollback", label: "Publish rollback handshake reviewed", status: "blocked", artifact: "release/PUBLISH-ROLLBACK-HANDSHAKE.json" }
    ],
    stages: [
      {
        id: "handshake-packaged-app",
        label: "Packaged-app directory materialization review",
        status: "planned",
        evidence: ["release/PACKAGED-APP-DIRECTORY-SKELETON.json", "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json"]
      },
      {
        id: "handshake-bundle-sealing",
        label: "Packaged-app bundle sealing review",
        status: "planned",
        evidence: ["release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json", "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json"]
      },
      {
        id: "handshake-bundle-integrity",
        label: "Sealed-bundle integrity review",
        status: "planned",
        evidence: ["release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json", "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json"]
      },
      {
        id: "handshake-builders",
        label: "Installer builder execution review",
        status: "planned",
        evidence: ["release/INSTALLER-TARGET-BUILDER-SKELETON.json", "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json"]
      },
      {
        id: "handshake-channel-routing",
        label: "Installer channel routing review",
        status: "planned",
        evidence: ["release/INSTALLER-BUILDER-ORCHESTRATION.json", "release/INSTALLER-CHANNEL-ROUTING.json"]
      },
      {
        id: "handshake-channel-promotion-evidence",
        label: "Channel promotion evidence review",
        status: "planned",
        evidence: ["release/INSTALLER-CHANNEL-ROUTING.json", "release/CHANNEL-PROMOTION-EVIDENCE.json"]
      },
      {
        id: "handshake-signing",
        label: "Signing and notarization review",
        status: "blocked",
        evidence: ["release/SIGNING-METADATA.json", "release/NOTARIZATION-PLAN.json", "release/SIGNING-PUBLISH-PIPELINE.json"]
      },
      {
        id: "handshake-publish",
        label: "Publish gate review",
        status: "blocked",
        evidence: ["release/RELEASE-NOTES.md", "release/PUBLISH-GATES.json"]
      },
      {
        id: "handshake-promotion",
        label: "Promotion acknowledgement",
        status: "blocked",
        evidence: ["release/PROMOTION-GATES.json", "release/RELEASE-APPROVAL-WORKFLOW.json"]
      },
      {
        id: "handshake-publish-rollback",
        label: "Publish rollback handshake review",
        status: "blocked",
        evidence: ["release/PUBLISH-ROLLBACK-HANDSHAKE.json", "release/PROMOTION-GATES.json"]
      }
    ],
    linkedArtifacts: [
      "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
      "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
      "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
      "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
      "release/INSTALLER-CHANNEL-ROUTING.json",
      "release/CHANNEL-PROMOTION-EVIDENCE.json",
      "release/SIGNING-METADATA.json",
      "release/SIGNING-PUBLISH-PIPELINE.json",
      "release/PUBLISH-GATES.json",
      "release/PROMOTION-GATES.json",
      "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
      "release/RELEASE-APPROVAL-WORKFLOW.json"
    ],
    blockedBy: [
      "signing and notarization remain metadata-only",
      "artifact upload remains blocked",
      "publish rollback remains metadata-only",
      "release approval remains non-executable",
      "host-side execution remains disabled"
    ]
  };
}

function buildSigningPublishPipeline({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-signing-publish-pipeline/v1",
    generatedAt,
    phase: PHASE_ID,
    sealedBundleIntegrityContractPath: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    gatingHandshakePath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    approvalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    channelRoutingPath: "release/INSTALLER-CHANNEL-ROUTING.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    promotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    stages: [
      { id: "pipeline-packaged-app-directory-materialization", label: "Packaged-app directory materialization", status: "planned" },
      { id: "pipeline-packaged-app-staged-output", label: "Packaged-app staged output skeleton", status: "planned" },
      { id: "pipeline-packaged-app-bundle-sealing", label: "Packaged-app bundle sealing skeleton", status: "planned" },
      { id: "pipeline-sealed-bundle-integrity", label: "Sealed-bundle integrity contract", status: "planned" },
      { id: "pipeline-installer-builder-execution", label: "Installer builder execution skeleton", status: "planned" },
      { id: "pipeline-installer-builder-orchestration", label: "Installer builder orchestration", status: "planned" },
      { id: "pipeline-installer-channel-routing", label: "Installer channel routing", status: "planned" },
      { id: "pipeline-channel-promotion-evidence", label: "Channel promotion evidence", status: "planned" },
      { id: "pipeline-signing-metadata", label: "Signing-ready metadata", status: "ready" },
      { id: "pipeline-notarization", label: "Notarization planning", status: "blocked" },
      { id: "pipeline-checksums", label: "Checksum publication", status: "blocked" },
      { id: "pipeline-release-notes", label: "Release notes", status: "planned" },
      { id: "pipeline-gating-handshake", label: "Signing-publish gating handshake", status: "planned" },
      { id: "pipeline-approval-bridge", label: "Signing-publish approval bridge", status: "planned" },
      { id: "pipeline-promotion-handshake", label: "Signing-publish promotion handshake", status: "planned" },
      { id: "pipeline-publish-rollback-handshake", label: "Publish rollback handshake", status: "blocked" },
      { id: "pipeline-upload", label: "Artifact upload", status: "blocked" },
      { id: "pipeline-promotion", label: "Promotion gating", status: "blocked" }
    ]
  };
}

function buildSigningPublishApprovalBridge({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-signing-publish-approval-bridge/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "review-only",
    bridge: [
      { id: "bridge-integrity-to-gating", from: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json", to: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json", status: "blocked" },
      { id: "bridge-signing-to-approval", from: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json", to: "release/RELEASE-APPROVAL-WORKFLOW.json", status: "blocked" },
      { id: "bridge-approval-to-channel-routing", from: "release/RELEASE-APPROVAL-WORKFLOW.json", to: "release/INSTALLER-CHANNEL-ROUTING.json", status: "blocked" },
      { id: "bridge-channel-routing-to-promotion-evidence", from: "release/INSTALLER-CHANNEL-ROUTING.json", to: "release/CHANNEL-PROMOTION-EVIDENCE.json", status: "blocked" },
      { id: "bridge-promotion-evidence-to-promotion-handshake", from: "release/CHANNEL-PROMOTION-EVIDENCE.json", to: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json", status: "blocked" },
      { id: "bridge-promotion-handshake-to-publish-rollback", from: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json", to: "release/PUBLISH-ROLLBACK-HANDSHAKE.json", status: "blocked" },
      { id: "bridge-publish-rollback-to-publish", from: "release/PUBLISH-ROLLBACK-HANDSHAKE.json", to: "release/PUBLISH-GATES.json", status: "blocked" },
      { id: "bridge-publish-to-promotion", from: "release/PUBLISH-GATES.json", to: "release/PROMOTION-GATES.json", status: "blocked" }
    ]
  };
}

function buildSigningPublishPromotionHandshake({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-signing-publish-promotion-handshake/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    canPromote: false,
    channelRoutingPath: "release/INSTALLER-CHANNEL-ROUTING.json",
    sealedBundleIntegrityContractPath: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    approvalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    publishGatesPath: "release/PUBLISH-GATES.json",
    promotionGatesPath: "release/PROMOTION-GATES.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    participants: ["release-engineering", "security", "release-manager", "product-owner"],
    request: {
      id: "signing-publish-promotion-handshake-request",
      status: "planned",
      fields: [
        { id: "request-phase", label: "Phase", required: true },
        { id: "request-package-id", label: "Package id", required: true },
        { id: "request-channel-route", label: "Channel route", required: true },
        { id: "request-sealed-bundles", label: "Sealed bundles", required: true },
        { id: "request-bundle-integrity", label: "Sealed-bundle integrity contract", required: true },
        { id: "request-channel-promotion-evidence", label: "Channel promotion evidence", required: true },
        { id: "request-publish-evidence", label: "Publish evidence", required: true },
        { id: "request-publish-rollback", label: "Publish rollback handshake", required: true },
        { id: "request-promotion-target", label: "Promotion target", required: true }
      ]
    },
    decision: {
      id: "signing-publish-promotion-handshake-decision",
      status: "blocked",
      fields: [
        { id: "decision-status", label: "Decision", required: true },
        { id: "decision-channel", label: "Channel", required: true },
        { id: "decision-promotion-target", label: "Promotion target", required: true },
        { id: "decision-notes", label: "Reviewer notes", required: false },
        { id: "decision-expiry", label: "Expires at", required: false }
      ]
    },
    acknowledgements: [
      { id: "promotion-ack-bundle-sealing", label: "Bundle sealing evidence reviewed", status: "planned", artifact: "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json" },
      { id: "promotion-ack-bundle-integrity", label: "Sealed-bundle integrity reviewed", status: "planned", artifact: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" },
      { id: "promotion-ack-channel-routing", label: "Installer channel routing reviewed", status: "planned", artifact: "release/INSTALLER-CHANNEL-ROUTING.json" },
      { id: "promotion-ack-channel-promotion-evidence", label: "Channel promotion evidence reviewed", status: "planned", artifact: "release/CHANNEL-PROMOTION-EVIDENCE.json" },
      { id: "promotion-ack-approval-bridge", label: "Approval bridge reviewed", status: "blocked", artifact: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" },
      { id: "promotion-ack-publish-gates", label: "Publish gates reviewed", status: "blocked", artifact: "release/PUBLISH-GATES.json" },
      { id: "promotion-ack-publish-rollback", label: "Publish rollback handshake reviewed", status: "blocked", artifact: "release/PUBLISH-ROLLBACK-HANDSHAKE.json" },
      { id: "promotion-ack-promotion-gates", label: "Promotion gates reviewed", status: "blocked", artifact: "release/PROMOTION-GATES.json" }
    ],
    stages: [
      {
        id: "promotion-handshake-bundle-sealing",
        label: "Bundle sealing review",
        status: "planned",
        evidence: ["release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json", "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json"]
      },
      {
        id: "promotion-handshake-bundle-integrity",
        label: "Sealed-bundle integrity review",
        status: "planned",
        evidence: ["release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json", "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json"]
      },
      {
        id: "promotion-handshake-channel-routing",
        label: "Installer channel routing review",
        status: "planned",
        evidence: ["release/INSTALLER-BUILDER-ORCHESTRATION.json", "release/INSTALLER-CHANNEL-ROUTING.json"]
      },
      {
        id: "promotion-handshake-channel-promotion-evidence",
        label: "Channel promotion evidence review",
        status: "planned",
        evidence: ["release/INSTALLER-CHANNEL-ROUTING.json", "release/CHANNEL-PROMOTION-EVIDENCE.json"]
      },
      {
        id: "promotion-handshake-approval",
        label: "Approval bridge review",
        status: "blocked",
        evidence: ["release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json", "release/RELEASE-APPROVAL-WORKFLOW.json"]
      },
      {
        id: "promotion-handshake-publish",
        label: "Publish gate review",
        status: "blocked",
        evidence: ["release/RELEASE-NOTES.md", "release/PUBLISH-GATES.json"]
      },
      {
        id: "promotion-handshake-publish-rollback",
        label: "Publish rollback review",
        status: "blocked",
        evidence: ["release/PUBLISH-ROLLBACK-HANDSHAKE.json", "release/PUBLISH-GATES.json"]
      },
      {
        id: "promotion-handshake-promotion",
        label: "Promotion gate review",
        status: "blocked",
        evidence: ["release/PROMOTION-GATES.json", "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"]
      }
    ],
    linkedArtifacts: [
      "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
      "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
      "release/INSTALLER-CHANNEL-ROUTING.json",
      "release/CHANNEL-PROMOTION-EVIDENCE.json",
      "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
      "release/PUBLISH-GATES.json",
      "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
      "release/PROMOTION-GATES.json",
      "release/RELEASE-APPROVAL-WORKFLOW.json"
    ],
    blockedBy: [
      "sealed bundles remain metadata-only",
      "artifact upload remains blocked",
      "publish rollback remains metadata-only",
      "promotion gates remain non-executable",
      "host-side execution remains disabled"
    ]
  };
}

function buildPublishRollbackHandshake({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-publish-rollback-handshake/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    canRollback: false,
    sealedBundleIntegrityContractPath: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    promotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    publishGatesPath: "release/PUBLISH-GATES.json",
    promotionGatesPath: "release/PROMOTION-GATES.json",
    participants: ["release-engineering", "security", "release-manager", "runtime-owner"],
    request: {
      id: "publish-rollback-handshake-request",
      status: "planned",
      fields: [
        { id: "request-phase", label: "Phase", required: true },
        { id: "request-package-id", label: "Package id", required: true },
        { id: "request-publish-scope", label: "Publish scope", required: true },
        { id: "request-sealed-bundle-integrity", label: "Sealed-bundle integrity evidence", required: true },
        { id: "request-channel-promotion-evidence", label: "Channel promotion evidence", required: true },
        { id: "request-rollback-checkpoints", label: "Rollback checkpoints", required: true },
        { id: "request-recovery-channel", label: "Recovery channel", required: true }
      ]
    },
    decision: {
      id: "publish-rollback-handshake-decision",
      status: "blocked",
      fields: [
        { id: "decision-status", label: "Decision", required: true },
        { id: "decision-rollback-disposition", label: "Rollback disposition", required: true },
        { id: "decision-recovery-channel", label: "Recovery channel", required: true },
        { id: "decision-notes", label: "Reviewer notes", required: false },
        { id: "decision-expiry", label: "Expires at", required: false }
      ]
    },
    acknowledgements: [
      { id: "rollback-ack-integrity", label: "Sealed-bundle integrity reviewed", status: "planned", artifact: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" },
      { id: "rollback-ack-promotion-evidence", label: "Channel promotion evidence reviewed", status: "planned", artifact: "release/CHANNEL-PROMOTION-EVIDENCE.json" },
      { id: "rollback-ack-publish-gates", label: "Publish gates reviewed", status: "blocked", artifact: "release/PUBLISH-GATES.json" },
      { id: "rollback-ack-promotion-gates", label: "Promotion gates reviewed", status: "blocked", artifact: "release/PROMOTION-GATES.json" },
      { id: "rollback-ack-promotion-handshake", label: "Promotion handshake reviewed", status: "blocked", artifact: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" },
      { id: "rollback-ack-release-notes", label: "Release notes reviewed", status: "planned", artifact: "release/RELEASE-NOTES.md" }
    ],
    paths: [
      {
        id: "publish-rollback-alpha-to-beta",
        from: "alpha",
        to: "beta",
        status: "blocked",
        promotionEvidenceId: "promotion-evidence-alpha-to-beta",
        rollbackManifestPath: "future/publish/alpha-to-beta/rollback-handshake.json",
        recoveryChannel: "alpha",
        checkpoints: ["sealed-bundle-checkpoint-windows", "sealed-bundle-checkpoint-macos", "sealed-bundle-checkpoint-linux"],
        blockedBy: ["artifact upload remains blocked", "live publish remains blocked", "rollback apply remains blocked"]
      },
      {
        id: "publish-rollback-beta-to-stable",
        from: "beta",
        to: "stable",
        status: "blocked",
        promotionEvidenceId: "promotion-evidence-beta-to-stable",
        rollbackManifestPath: "future/publish/beta-to-stable/rollback-handshake.json",
        recoveryChannel: "beta",
        checkpoints: ["sealed-bundle-checkpoint-windows", "sealed-bundle-checkpoint-macos", "sealed-bundle-checkpoint-linux"],
        blockedBy: ["artifact upload remains blocked", "live publish remains blocked", "rollback apply remains blocked"]
      }
    ],
    stages: [
      {
        id: "rollback-handshake-integrity",
        label: "Sealed-bundle integrity review",
        status: "planned",
        evidence: ["release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json", "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json"]
      },
      {
        id: "rollback-handshake-promotion-evidence",
        label: "Channel promotion evidence review",
        status: "planned",
        evidence: ["release/INSTALLER-CHANNEL-ROUTING.json", "release/CHANNEL-PROMOTION-EVIDENCE.json"]
      },
      {
        id: "rollback-handshake-publish-gates",
        label: "Publish gate review",
        status: "blocked",
        evidence: ["release/PUBLISH-GATES.json", "release/RELEASE-NOTES.md"]
      },
      {
        id: "rollback-handshake-promotion-gates",
        label: "Promotion gate review",
        status: "blocked",
        evidence: ["release/PROMOTION-GATES.json", "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-paths",
        label: "Rollback path review",
        status: "blocked",
        evidence: ["release/PUBLISH-ROLLBACK-HANDSHAKE.json", "release/INSTALLER-PLACEHOLDER.json"]
      },
      {
        id: "rollback-handshake-recovery",
        label: "Recovery channel review",
        status: "blocked",
        evidence: ["release/CHANNEL-PROMOTION-EVIDENCE.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      }
    ],
    linkedArtifacts: [
      "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
      "release/CHANNEL-PROMOTION-EVIDENCE.json",
      "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
      "release/PUBLISH-GATES.json",
      "release/PROMOTION-GATES.json",
      "release/RELEASE-NOTES.md",
      "release/INSTALLER-PLACEHOLDER.json"
    ],
    blockedBy: [
      "artifact upload remains blocked",
      "promotion remains non-executable",
      "rollback execution remains metadata-only",
      "host-side execution remains disabled"
    ]
  };
}

function buildReleaseApprovalWorkflow({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-release-approval-workflow/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    canApprove: false,
    gatingHandshakePath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    approvalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    promotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    blockedBy: [
      "approval handshake is not executable yet",
      "signing / notarization remain metadata-only",
      "signing-publish gating handshake remains metadata-only",
      "publish rollback handshake remains metadata-only",
      "publish / promotion automation is still blocked",
      "host-side execution remains disabled"
    ],
    stages: [
      {
        id: "approval-docs-manifest",
        label: "Docs and manifest review",
        status: "ready",
        approverRoles: ["release-engineering"],
        evidence: ["release/RELEASE-MANIFEST.json", "release/BUILD-METADATA.json", "release/REVIEW-MANIFEST.json"]
      },
      {
        id: "approval-packaged-app",
        label: "Packaged app directory review",
        status: "planned",
        approverRoles: ["release-engineering", "platform-owner"],
        evidence: [
          "release/BUNDLE-ASSEMBLY.json",
          "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
          "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
          "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
          "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
          "release/INSTALLER-TARGETS.json"
        ]
      },
      {
        id: "approval-installer-builders",
        label: "Installer builder execution review",
        status: "planned",
        approverRoles: ["release-engineering", "platform-owner"],
        evidence: [
          "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
          "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
          "release/INSTALLER-CHANNEL-ROUTING.json",
          "release/CHANNEL-PROMOTION-EVIDENCE.json"
        ]
      },
      {
        id: "approval-signing",
        label: "Signing, notarization, and gating handshake review",
        status: "blocked",
        approverRoles: ["security", "platform-owner"],
        evidence: [
          "release/SIGNING-METADATA.json",
          "release/NOTARIZATION-PLAN.json",
          "release/SIGNING-PUBLISH-PIPELINE.json",
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json"
        ]
      },
      {
        id: "approval-publish-promotion",
        label: "Publish, rollback, and promotion review",
        status: "blocked",
        approverRoles: ["release-manager", "product-owner"],
        evidence: [
          "release/RELEASE-NOTES.md",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/CHANNEL-PROMOTION-EVIDENCE.json",
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-ROLLBACK-HANDSHAKE.json"
        ]
      },
      {
        id: "approval-host-safety",
        label: "Host safety boundary review",
        status: "blocked",
        approverRoles: ["runtime-owner"],
        evidence: ["release/INSTALLER-PLACEHOLDER.json"],
        blockers: ["approval / lifecycle / rollback remain placeholder-only", "host-side execution remains disabled"]
      }
    ]
  };
}

function buildPublishGates({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-publish-gates/v1",
    generatedAt,
    phase: PHASE_ID,
    gates: [
      { id: "gate-bundles", label: "Per-platform bundles ready", status: "blocked" },
      { id: "gate-packaged-app-directories", label: "Packaged app directories reviewed", status: "planned" },
      { id: "gate-packaged-app-directory-materialization", label: "Packaged-app directory materialization reviewed", status: "planned" },
      { id: "gate-packaged-app-staged-output", label: "Packaged-app staged outputs reviewed", status: "planned" },
      { id: "gate-packaged-app-bundle-sealing", label: "Packaged-app bundle sealing reviewed", status: "planned" },
      { id: "gate-sealed-bundle-integrity", label: "Sealed-bundle integrity contract reviewed", status: "planned" },
      { id: "gate-installer-targets", label: "Installer targets reviewed", status: "planned" },
      { id: "gate-installer-builder-execution", label: "Installer builder execution reviewed", status: "planned" },
      { id: "gate-installer-builder-orchestration", label: "Installer builder orchestration reviewed", status: "planned" },
      { id: "gate-installer-channel-routing", label: "Installer channel routing reviewed", status: "planned" },
      { id: "gate-channel-promotion-evidence", label: "Channel promotion evidence reviewed", status: "planned" },
      { id: "gate-signing", label: "Signing / notarization complete", status: "blocked" },
      { id: "gate-signing-handshake", label: "Signing-publish gating handshake resolved", status: "blocked" },
      { id: "gate-approval-bridge", label: "Signing-publish approval bridge resolved", status: "blocked" },
      { id: "gate-promotion-handshake", label: "Signing-publish promotion handshake resolved", status: "blocked" },
      { id: "gate-publish-rollback-handshake", label: "Publish rollback handshake resolved", status: "blocked" },
      { id: "gate-approval-workflow", label: "Release approval workflow resolved", status: "blocked" },
      { id: "gate-notes", label: "Release notes approved", status: "planned" },
      { id: "gate-upload", label: "Artifacts uploaded", status: "blocked" },
      { id: "gate-promotion", label: "Channel promotion approved", status: "blocked" }
    ]
  };
}

function buildPromotionGates({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-gates/v1",
    generatedAt,
    phase: PHASE_ID,
    promotions: [
      {
        from: "alpha",
        to: "beta",
        status: "blocked",
        requires: [
          "bundles",
          "packaged app directories",
          "packaged app directory materialization",
          "packaged app bundle sealing",
          "sealed bundle integrity contract",
          "installer targets",
          "installer builder execution",
          "installer channel routing",
          "channel promotion evidence",
          "signing",
          "signing-publish gating handshake",
          "signing-publish promotion handshake",
          "publish rollback handshake",
          "release approval workflow",
          "release notes",
          "upload"
        ]
      },
      {
        from: "beta",
        to: "stable",
        status: "blocked",
        requires: [
          "notarization",
          "checksums",
          "approval",
          "sealed bundle integrity contract",
          "installer channel routing",
          "channel promotion evidence",
          "signing-publish gating handshake",
          "signing-publish promotion handshake",
          "publish rollback handshake",
          "release approval workflow",
          "rollback plan"
        ]
      }
    ]
  };
}

function renderInstallerPlaceholderScript() {
  return [
    "#!/usr/bin/env node",
    "const fs = require(\"node:fs\");",
    "const path = require(\"node:path\");",
    "",
    "const deliveryRoot = path.resolve(__dirname, \"..\");",
    "const manifestPath = path.join(deliveryRoot, \"release\", \"INSTALLER-PLACEHOLDER.json\");",
    "const manifest = JSON.parse(fs.readFileSync(manifestPath, \"utf8\"));",
    "",
    "console.log(\"OpenClaw Studio installer placeholder\");",
    "console.log(`status: ${manifest.status}`);",
    "console.log(`current delivery: ${manifest.currentDelivery}`);",
    "console.log(`can install: ${manifest.canInstall ? \"yes\" : \"no\"}`);",
    "console.log(`package root: ${path.basename(deliveryRoot)}`);",
    "console.log(`packaged app directory metadata: ${manifest.packagedAppDirectorySkeletonPath}`);",
    "console.log(`packaged app directory materialization metadata: ${manifest.packagedAppDirectoryMaterializationPath}`);",
    "console.log(`packaged app materialization metadata: ${manifest.packagedAppMaterializationSkeletonPath}`);",
    "console.log(`packaged app staged output metadata: ${manifest.packagedAppStagedOutputSkeletonPath}`);",
    "console.log(`packaged app bundle sealing metadata: ${manifest.packagedAppBundleSealingSkeletonPath}`);",
    "console.log(`sealed-bundle integrity metadata: ${manifest.sealedBundleIntegrityContractPath}`);",
    "console.log(`installer targets metadata: ${manifest.installerTargetsPath}`);",
    "console.log(`installer builder execution metadata: ${manifest.installerBuilderExecutionSkeletonPath}`);",
    "console.log(`installer-target builder metadata: ${manifest.installerTargetBuilderSkeletonPath}`);",
    "console.log(`installer builder orchestration metadata: ${manifest.installerBuilderOrchestrationPath}`);",
    "console.log(`installer channel routing metadata: ${manifest.installerChannelRoutingPath}`);",
    "console.log(`channel promotion evidence metadata: ${manifest.channelPromotionEvidencePath}`);",
    "console.log(`signing-publish gating handshake metadata: ${manifest.signingPublishGatingHandshakePath}`);",
    "console.log(`signing & publish pipeline metadata: ${manifest.signingPublishPipelinePath}`);",
    "console.log(`signing-publish approval bridge metadata: ${manifest.signingPublishApprovalBridgePath}`);",
    "console.log(`signing-publish promotion handshake metadata: ${manifest.signingPublishPromotionHandshakePath}`);",
    "console.log(`publish rollback handshake metadata: ${manifest.publishRollbackHandshakePath}`);",
    "console.log(`approval workflow metadata: ${manifest.approvalWorkflowPath}`);",
    "console.log(\"missing capabilities:\");",
    "for (const item of manifest.missingCapabilities) {",
    "  console.log(`- ${item}`);",
    "}",
    "console.log(\"next pipeline steps:\");",
    "for (const item of manifest.futurePipeline) {",
    "  console.log(`- ${item}`);",
    "}",
    "console.log(\"This placeholder does not install anything.\");"
  ].join("\n");
}

function buildReleaseManifest({ generatedAt, studioPackage, artifactGroups, allDocs }) {
  return {
    schemaVersion: "openclaw-studio-release-manifest/v1",
    generatedAt,
    packageId: PACKAGE_ID,
    packageName: `${APP_NAME} Alpha Shell`,
    packageKind: PACKAGE_KIND,
    channel: RELEASE_CHANNEL,
    phase: PHASE_ID,
    milestone: PHASE_MILESTONE,
    version: studioPackage.version,
    docs: allDocs.map((doc) => ({
      id: doc.id,
      label: doc.label,
      path: doc.outputPath,
      generated: Boolean(doc.generated)
    })),
    layout: PACKAGE_LAYOUT,
    artifactGroups: artifactGroups.map((group) => ({
      id: group.id,
      label: group.label,
      outputRoot: group.outputRoot,
      fileCount: group.fileCount,
      totalBytes: group.totalBytes,
      entrypoints: group.entrypoints
    })),
    artifacts: artifactGroups.flatMap((group) =>
      group.files.map((file) => ({
        id: file.id,
        groupId: group.id,
        role: file.isEntrypoint ? "entrypoint" : "asset",
        path: file.packagePath,
        sourceRelativePath: file.sourceRelativePath,
        sizeBytes: file.sizeBytes,
        sha256: file.sha256
      }))
    ),
    currentDeliverySurfaces: CURRENT_DELIVERY_SURFACES,
    deliveryConstraints: DELIVERY_CONSTRAINTS,
    formalInstallerGaps: FORMAL_INSTALLER_GAPS,
    installer: {
      status: "placeholder",
      manifestPath: "release/INSTALLER-PLACEHOLDER.json",
      scriptPath: "scripts/install-placeholder.cjs"
    },
    reviewArtifacts: REVIEW_ARTIFACTS,
    formalReleaseArtifacts: FORMAL_RELEASE_ARTIFACTS,
    packageMatrix: ["windows", "macos", "linux"],
    pipelineStages: RELEASE_PIPELINE_STAGES
  };
}

function createBuildMetadata({ generatedAt, repoPackage, studioPackage, summary, artifactGroups, allDocs }) {
  return {
    schemaVersion: "openclaw-studio-build-metadata/v1",
    generatedAt,
    app: {
      name: APP_NAME,
      workspacePackage: studioPackage.name,
      version: studioPackage.version,
      channel: RELEASE_CHANNEL,
      phase: PHASE_ID
    },
    toolchain: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      packageManager: repoPackage.packageManager,
      electronOptionalVersion: studioPackage.optionalDependencies?.electron ?? null
    },
    release: {
      milestone: PHASE_MILESTONE,
      packageId: PACKAGE_ID,
      packageKind: PACKAGE_KIND,
      outputRoot: summary.paths.deliveryRoot,
      reviewArtifacts: REVIEW_ARTIFACTS,
      formalReleaseArtifacts: FORMAL_RELEASE_ARTIFACTS,
      packageMatrix: ["windows", "macos", "linux"]
    },
    preflight: {
      buildReady: summary.buildReady,
      electronAvailable: summary.electron.available,
      displayAvailable: summary.display.available,
      displaySource: summary.display.source,
      missingArtifacts: summary.missingArtifacts.map((artifact) => ({
        label: artifact.label,
        path: artifact.path
      }))
    },
    layout: PACKAGE_LAYOUT,
    docs: allDocs.map((doc) => ({
      id: doc.id,
      path: doc.outputPath,
      generated: Boolean(doc.generated)
    })),
    sourceArtifacts: artifactGroups.map((group) => ({
      id: group.id,
      label: group.label,
      sourceRoot: group.sourceRoot,
      outputRoot: group.outputRoot,
      fileCount: group.fileCount,
      totalBytes: group.totalBytes,
      entrypoints: group.entrypoints
    })),
    currentDeliverySurfaces: CURRENT_DELIVERY_SURFACES,
    formalInstallerGaps: FORMAL_INSTALLER_GAPS,
    commands: {
      required: REQUIRED_RELEASE_COMMANDS,
      optional: OPTIONAL_RELEASE_COMMANDS
    },
    pipeline: {
      stage: REVIEW_STAGE_ID,
      reviewArtifacts: REVIEW_ARTIFACTS,
      formalReleaseArtifacts: FORMAL_RELEASE_ARTIFACTS
    }
  };
}

function buildInstallerPlaceholder({ generatedAt, studioPackage }) {
  return {
    schemaVersion: "openclaw-studio-installer-placeholder/v1",
    generatedAt,
    appName: APP_NAME,
    version: studioPackage.version,
    phase: PHASE_ID,
    status: "placeholder",
    currentDelivery: PACKAGE_KIND,
    canInstall: false,
    currentDeliverySurfaces: CURRENT_DELIVERY_SURFACES,
    missingCapabilities: FORMAL_INSTALLER_GAPS,
    futurePipeline: FUTURE_INSTALLER_PIPELINE,
    blockedActions: DELIVERY_CONSTRAINTS,
    scriptPath: "scripts/install-placeholder.cjs",
    packagedAppDirectorySkeletonPath: "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
    packagedAppDirectoryMaterializationPath: "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
    packagedAppMaterializationSkeletonPath: "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
    packagedAppStagedOutputSkeletonPath: "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
    packagedAppBundleSealingSkeletonPath: "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
    sealedBundleIntegrityContractPath: "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    installerTargetsPath: "release/INSTALLER-TARGETS.json",
    installerBuilderExecutionSkeletonPath: "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    installerTargetBuilderSkeletonPath: "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
    installerBuilderOrchestrationPath: "release/INSTALLER-BUILDER-ORCHESTRATION.json",
    installerChannelRoutingPath: "release/INSTALLER-CHANNEL-ROUTING.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    signingPublishGatingHandshakePath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    signingPublishPipelinePath: "release/SIGNING-PUBLISH-PIPELINE.json",
    signingPublishApprovalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    signingPublishPromotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    approvalWorkflowPath: "release/RELEASE-APPROVAL-WORKFLOW.json"
  };
}

function createReleaseSkeleton(summary = getPreflightSummary()) {
  ensureBuildReady(summary);

  const paths = getPaths();
  const repoPackage = readJson(path.join(paths.repoRoot, "package.json"));
  const studioPackage = readJson(path.join(paths.appRoot, "package.json"));
  const generatedAt = new Date().toISOString();
  const sourceDocs = buildSourceDocs(paths);
  const generatedDocs = buildGeneratedDocs();
  const allDocs = [...sourceDocs, ...generatedDocs];
  const artifactGroups = [
    summarizeDirectory({
      id: "renderer",
      label: "Renderer bundle",
      sourceRoot: paths.rendererRoot,
      outputRoot: "artifacts/renderer",
      entrypoints: ["index.html"],
      repoRoot: paths.repoRoot
    }),
    summarizeDirectory({
      id: "electron",
      label: "Electron bundle",
      sourceRoot: paths.electronRoot,
      outputRoot: "artifacts/electron",
      entrypoints: ["electron/main.js", "electron/preload.js", "electron/runtime/studio-runtime.js"],
      repoRoot: paths.repoRoot
    })
  ];
  const buildMetadata = createBuildMetadata({
    generatedAt,
    repoPackage,
    studioPackage,
    summary,
    artifactGroups,
    allDocs
  });
  const installerPlaceholder = buildInstallerPlaceholder({
    generatedAt,
    studioPackage
  });
  const reviewManifest = buildReviewManifest({
    generatedAt,
    artifactGroups,
    allDocs
  });
  const bundleMatrix = buildBundleMatrix({
    generatedAt
  });
  const bundleAssembly = buildBundleAssembly({
    generatedAt
  });
  const packagedAppDirectorySkeleton = buildPackagedAppDirectorySkeleton({
    generatedAt
  });
  const packagedAppDirectoryMaterialization = buildPackagedAppDirectoryMaterialization({
    generatedAt
  });
  const packagedAppMaterializationSkeleton = buildPackagedAppMaterializationSkeleton({
    generatedAt
  });
  const packagedAppStagedOutputSkeleton = buildPackagedAppStagedOutputSkeleton({
    generatedAt
  });
  const packagedAppBundleSealingSkeleton = buildPackagedAppBundleSealingSkeleton({
    generatedAt
  });
  const sealedBundleIntegrityContract = buildSealedBundleIntegrityContract({
    generatedAt
  });
  const installerTargets = buildInstallerTargets({
    generatedAt
  });
  const installerBuilderExecutionSkeleton = buildInstallerBuilderExecutionSkeleton({
    generatedAt
  });
  const installerTargetBuilderSkeleton = buildInstallerTargetBuilderSkeleton({
    generatedAt
  });
  const installerBuilderOrchestration = buildInstallerBuilderOrchestration({
    generatedAt
  });
  const installerChannelRouting = buildInstallerChannelRouting({
    generatedAt
  });
  const channelPromotionEvidence = buildChannelPromotionEvidence({
    generatedAt
  });
  const signingMetadata = buildSigningMetadata({
    generatedAt
  });
  const notarizationPlan = buildNotarizationPlan({
    generatedAt
  });
  const signingPublishGatingHandshake = buildSigningPublishGatingHandshake({
    generatedAt
  });
  const signingPublishPipeline = buildSigningPublishPipeline({
    generatedAt
  });
  const signingPublishApprovalBridge = buildSigningPublishApprovalBridge({
    generatedAt
  });
  const signingPublishPromotionHandshake = buildSigningPublishPromotionHandshake({
    generatedAt
  });
  const publishRollbackHandshake = buildPublishRollbackHandshake({
    generatedAt
  });
  const releaseApprovalWorkflow = buildReleaseApprovalWorkflow({
    generatedAt
  });
  const publishGates = buildPublishGates({
    generatedAt
  });
  const promotionGates = buildPromotionGates({
    generatedAt
  });
  const releaseManifest = buildReleaseManifest({
    generatedAt,
    studioPackage,
    artifactGroups,
    allDocs
  });
  const packageReadme = renderPackageReadme({
    generatedAt,
    artifactGroups,
    allDocs
  });
  const releaseSummary = renderReleaseSummary({
    generatedAt,
    artifactGroups,
    reviewManifest
  });
  const releaseNotes = renderReleaseNotes({
    generatedAt
  });
  const releaseChecklist = renderReleaseChecklist();

  return {
    generatedAt,
    paths,
    summary,
    sourceDocs,
    generatedDocs,
    allDocs,
    artifactGroups,
    buildMetadata,
    installerPlaceholder,
    reviewManifest,
    bundleMatrix,
    bundleAssembly,
    packagedAppDirectorySkeleton,
    packagedAppDirectoryMaterialization,
    packagedAppMaterializationSkeleton,
    packagedAppStagedOutputSkeleton,
    packagedAppBundleSealingSkeleton,
    sealedBundleIntegrityContract,
    installerTargets,
    installerBuilderExecutionSkeleton,
    installerTargetBuilderSkeleton,
    installerBuilderOrchestration,
    installerChannelRouting,
    channelPromotionEvidence,
    signingMetadata,
    notarizationPlan,
    signingPublishGatingHandshake,
    signingPublishPipeline,
    signingPublishApprovalBridge,
    signingPublishPromotionHandshake,
    publishRollbackHandshake,
    releaseApprovalWorkflow,
    publishGates,
    promotionGates,
    releaseManifest,
    packageReadme,
    releaseSummary,
    releaseNotes,
    releaseChecklist
  };
}

function writeTextFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true
  });
  fs.writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`);
}

function writeJsonFile(filePath, content) {
  writeTextFile(filePath, JSON.stringify(content, null, 2));
}

function copyIntoPackage(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), {
    recursive: true
  });
  fs.cpSync(sourcePath, destinationPath, {
    recursive: true
  });
}

function writeReleaseSkeleton(destinationRoot, skeleton) {
  for (const doc of skeleton.sourceDocs) {
    copyIntoPackage(doc.sourcePath, path.join(destinationRoot, doc.outputPath));
  }

  for (const artifactGroup of skeleton.artifactGroups) {
    copyIntoPackage(artifactGroup.sourceRoot, path.join(destinationRoot, artifactGroup.outputRoot));
  }

  writeTextFile(path.join(destinationRoot, "PACKAGE-README.md"), skeleton.packageReadme);
  writeJsonFile(path.join(destinationRoot, "release", "BUILD-METADATA.json"), skeleton.buildMetadata);
  writeJsonFile(path.join(destinationRoot, "release", "REVIEW-MANIFEST.json"), skeleton.reviewManifest);
  writeJsonFile(path.join(destinationRoot, "release", "BUNDLE-MATRIX.json"), skeleton.bundleMatrix);
  writeJsonFile(path.join(destinationRoot, "release", "BUNDLE-ASSEMBLY.json"), skeleton.bundleAssembly);
  writeJsonFile(
    path.join(destinationRoot, "release", "PACKAGED-APP-DIRECTORY-SKELETON.json"),
    skeleton.packagedAppDirectorySkeleton
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PACKAGED-APP-DIRECTORY-MATERIALIZATION.json"),
    skeleton.packagedAppDirectoryMaterialization
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PACKAGED-APP-MATERIALIZATION-SKELETON.json"),
    skeleton.packagedAppMaterializationSkeleton
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PACKAGED-APP-STAGED-OUTPUT-SKELETON.json"),
    skeleton.packagedAppStagedOutputSkeleton
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PACKAGED-APP-BUNDLE-SEALING-SKELETON.json"),
    skeleton.packagedAppBundleSealingSkeleton
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "SEALED-BUNDLE-INTEGRITY-CONTRACT.json"),
    skeleton.sealedBundleIntegrityContract
  );
  writeJsonFile(path.join(destinationRoot, "release", "INSTALLER-TARGETS.json"), skeleton.installerTargets);
  writeJsonFile(
    path.join(destinationRoot, "release", "INSTALLER-BUILDER-EXECUTION-SKELETON.json"),
    skeleton.installerBuilderExecutionSkeleton
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "INSTALLER-TARGET-BUILDER-SKELETON.json"),
    skeleton.installerTargetBuilderSkeleton
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "INSTALLER-BUILDER-ORCHESTRATION.json"),
    skeleton.installerBuilderOrchestration
  );
  writeJsonFile(path.join(destinationRoot, "release", "INSTALLER-CHANNEL-ROUTING.json"), skeleton.installerChannelRouting);
  writeJsonFile(path.join(destinationRoot, "release", "CHANNEL-PROMOTION-EVIDENCE.json"), skeleton.channelPromotionEvidence);
  writeJsonFile(path.join(destinationRoot, "release", "SIGNING-METADATA.json"), skeleton.signingMetadata);
  writeJsonFile(path.join(destinationRoot, "release", "NOTARIZATION-PLAN.json"), skeleton.notarizationPlan);
  writeJsonFile(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-GATING-HANDSHAKE.json"),
    skeleton.signingPublishGatingHandshake
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-PIPELINE.json"),
    skeleton.signingPublishPipeline
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-APPROVAL-BRIDGE.json"),
    skeleton.signingPublishApprovalBridge
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"),
    skeleton.signingPublishPromotionHandshake
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PUBLISH-ROLLBACK-HANDSHAKE.json"),
    skeleton.publishRollbackHandshake
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "RELEASE-APPROVAL-WORKFLOW.json"),
    skeleton.releaseApprovalWorkflow
  );
  writeTextFile(path.join(destinationRoot, "release", "RELEASE-NOTES.md"), skeleton.releaseNotes);
  writeJsonFile(path.join(destinationRoot, "release", "PUBLISH-GATES.json"), skeleton.publishGates);
  writeJsonFile(path.join(destinationRoot, "release", "PROMOTION-GATES.json"), skeleton.promotionGates);
  writeJsonFile(path.join(destinationRoot, "release", "RELEASE-MANIFEST.json"), skeleton.releaseManifest);
  writeJsonFile(path.join(destinationRoot, "release", "INSTALLER-PLACEHOLDER.json"), skeleton.installerPlaceholder);
  writeTextFile(path.join(destinationRoot, "release", "RELEASE-SUMMARY.md"), skeleton.releaseSummary);
  writeTextFile(path.join(destinationRoot, "release", "RELEASE-CHECKLIST.md"), skeleton.releaseChecklist);
  writeTextFile(path.join(destinationRoot, "scripts", "install-placeholder.cjs"), renderInstallerPlaceholderScript());
  fs.chmodSync(path.join(destinationRoot, "scripts", "install-placeholder.cjs"), 0o755);
}

function verifyReleaseSkeletonOutput(destinationRoot, skeleton) {
  const requiredFiles = [
    "README.md",
    "HANDOFF.md",
    "IMPLEMENTATION-PLAN.md",
    "PACKAGE-README.md",
    "release/BUILD-METADATA.json",
    "release/REVIEW-MANIFEST.json",
    "release/BUNDLE-MATRIX.json",
    "release/BUNDLE-ASSEMBLY.json",
    "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
    "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
    "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
    "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
    "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
    "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    "release/INSTALLER-TARGETS.json",
    "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
    "release/INSTALLER-BUILDER-ORCHESTRATION.json",
    "release/INSTALLER-CHANNEL-ROUTING.json",
    "release/CHANNEL-PROMOTION-EVIDENCE.json",
    "release/SIGNING-METADATA.json",
    "release/NOTARIZATION-PLAN.json",
    "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    "release/SIGNING-PUBLISH-PIPELINE.json",
    "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    "release/RELEASE-APPROVAL-WORKFLOW.json",
    "release/RELEASE-NOTES.md",
    "release/PUBLISH-GATES.json",
    "release/PROMOTION-GATES.json",
    "release/RELEASE-MANIFEST.json",
    "release/INSTALLER-PLACEHOLDER.json",
    "release/RELEASE-SUMMARY.md",
    "release/RELEASE-CHECKLIST.md",
    "scripts/install-placeholder.cjs",
    ...skeleton.artifactGroups.flatMap((group) => group.entrypoints)
  ];

  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(destinationRoot, relativePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Release skeleton output is missing required file ${relativePath}.`);
    }
  }

  for (const artifactGroup of skeleton.artifactGroups) {
    const copiedFiles = listFilesRecursive(path.join(destinationRoot, artifactGroup.outputRoot));

    if (copiedFiles.length !== artifactGroup.fileCount) {
      throw new Error(
        `Release skeleton output for ${artifactGroup.id} copied ${copiedFiles.length} files, expected ${artifactGroup.fileCount}.`
      );
    }
  }

  const writtenManifest = readJson(path.join(destinationRoot, "release", "RELEASE-MANIFEST.json"));
  const writtenMetadata = readJson(path.join(destinationRoot, "release", "BUILD-METADATA.json"));
  const writtenReviewManifest = readJson(path.join(destinationRoot, "release", "REVIEW-MANIFEST.json"));
  const writtenBundleMatrix = readJson(path.join(destinationRoot, "release", "BUNDLE-MATRIX.json"));
  const writtenBundleAssembly = readJson(path.join(destinationRoot, "release", "BUNDLE-ASSEMBLY.json"));
  const writtenPackagedAppDirectorySkeleton = readJson(
    path.join(destinationRoot, "release", "PACKAGED-APP-DIRECTORY-SKELETON.json")
  );
  const writtenPackagedAppDirectoryMaterialization = readJson(
    path.join(destinationRoot, "release", "PACKAGED-APP-DIRECTORY-MATERIALIZATION.json")
  );
  const writtenPackagedAppMaterializationSkeleton = readJson(
    path.join(destinationRoot, "release", "PACKAGED-APP-MATERIALIZATION-SKELETON.json")
  );
  const writtenPackagedAppStagedOutputSkeleton = readJson(
    path.join(destinationRoot, "release", "PACKAGED-APP-STAGED-OUTPUT-SKELETON.json")
  );
  const writtenPackagedAppBundleSealingSkeleton = readJson(
    path.join(destinationRoot, "release", "PACKAGED-APP-BUNDLE-SEALING-SKELETON.json")
  );
  const writtenSealedBundleIntegrityContract = readJson(
    path.join(destinationRoot, "release", "SEALED-BUNDLE-INTEGRITY-CONTRACT.json")
  );
  const writtenInstallerTargets = readJson(path.join(destinationRoot, "release", "INSTALLER-TARGETS.json"));
  const writtenInstallerBuilderExecutionSkeleton = readJson(
    path.join(destinationRoot, "release", "INSTALLER-BUILDER-EXECUTION-SKELETON.json")
  );
  const writtenInstallerTargetBuilderSkeleton = readJson(
    path.join(destinationRoot, "release", "INSTALLER-TARGET-BUILDER-SKELETON.json")
  );
  const writtenInstallerBuilderOrchestration = readJson(
    path.join(destinationRoot, "release", "INSTALLER-BUILDER-ORCHESTRATION.json")
  );
  const writtenInstallerChannelRouting = readJson(
    path.join(destinationRoot, "release", "INSTALLER-CHANNEL-ROUTING.json")
  );
  const writtenChannelPromotionEvidence = readJson(
    path.join(destinationRoot, "release", "CHANNEL-PROMOTION-EVIDENCE.json")
  );
  const writtenSigningMetadata = readJson(path.join(destinationRoot, "release", "SIGNING-METADATA.json"));
  const writtenNotarizationPlan = readJson(path.join(destinationRoot, "release", "NOTARIZATION-PLAN.json"));
  const writtenSigningPublishGatingHandshake = readJson(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-GATING-HANDSHAKE.json")
  );
  const writtenSigningPublishPipeline = readJson(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-PIPELINE.json")
  );
  const writtenSigningPublishApprovalBridge = readJson(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-APPROVAL-BRIDGE.json")
  );
  const writtenSigningPublishPromotionHandshake = readJson(
    path.join(destinationRoot, "release", "SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json")
  );
  const writtenPublishRollbackHandshake = readJson(
    path.join(destinationRoot, "release", "PUBLISH-ROLLBACK-HANDSHAKE.json")
  );
  const writtenReleaseApprovalWorkflow = readJson(
    path.join(destinationRoot, "release", "RELEASE-APPROVAL-WORKFLOW.json")
  );
  const writtenPublishGates = readJson(path.join(destinationRoot, "release", "PUBLISH-GATES.json"));
  const writtenPromotionGates = readJson(path.join(destinationRoot, "release", "PROMOTION-GATES.json"));
  const writtenInstaller = readJson(path.join(destinationRoot, "release", "INSTALLER-PLACEHOLDER.json"));
  const writtenReleaseSummary = fs.readFileSync(path.join(destinationRoot, "release", "RELEASE-SUMMARY.md"), "utf8");
  const writtenReleaseNotes = fs.readFileSync(path.join(destinationRoot, "release", "RELEASE-NOTES.md"), "utf8");
  const placeholderScript = fs.readFileSync(path.join(destinationRoot, "scripts", "install-placeholder.cjs"), "utf8");

  if (writtenManifest.packageId !== PACKAGE_ID || writtenManifest.phase !== PHASE_ID) {
    throw new Error(`Release manifest does not reflect the expected ${PHASE_ID} package identity.`);
  }

  if (writtenManifest.artifacts.length !== skeleton.releaseManifest.artifacts.length) {
    throw new Error("Release manifest artifact count does not match the generated release skeleton.");
  }

  if (writtenMetadata.release?.packageKind !== PACKAGE_KIND || writtenMetadata.app?.phase !== PHASE_ID) {
    throw new Error(`Build metadata does not reflect the expected ${PHASE_ID} package kind.`);
  }

  if (writtenInstaller.status !== "placeholder" || writtenInstaller.canInstall !== false) {
    throw new Error("Installer placeholder contract drifted from the expected non-installer posture.");
  }

  if (
    writtenInstaller.packagedAppDirectorySkeletonPath !== "release/PACKAGED-APP-DIRECTORY-SKELETON.json" ||
    writtenInstaller.packagedAppDirectoryMaterializationPath !== "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json" ||
    writtenInstaller.packagedAppMaterializationSkeletonPath !== "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json" ||
    writtenInstaller.packagedAppStagedOutputSkeletonPath !== "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json" ||
    writtenInstaller.packagedAppBundleSealingSkeletonPath !== "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json" ||
    writtenInstaller.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenInstaller.installerTargetsPath !== "release/INSTALLER-TARGETS.json" ||
    writtenInstaller.installerBuilderExecutionSkeletonPath !== "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json" ||
    writtenInstaller.installerTargetBuilderSkeletonPath !== "release/INSTALLER-TARGET-BUILDER-SKELETON.json" ||
    writtenInstaller.installerBuilderOrchestrationPath !== "release/INSTALLER-BUILDER-ORCHESTRATION.json" ||
    writtenInstaller.installerChannelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    writtenInstaller.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenInstaller.signingPublishGatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    writtenInstaller.signingPublishPipelinePath !== "release/SIGNING-PUBLISH-PIPELINE.json" ||
    writtenInstaller.signingPublishApprovalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    writtenInstaller.signingPublishPromotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    writtenInstaller.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    writtenInstaller.approvalWorkflowPath !== "release/RELEASE-APPROVAL-WORKFLOW.json"
  ) {
    throw new Error(`Installer placeholder is missing the expected ${PHASE_ID} bundle sealing / routing / handshake / approval paths.`);
  }

  if (
    writtenReviewManifest.phase !== PHASE_ID ||
    writtenReviewManifest.pipeline?.stage !== REVIEW_STAGE_ID ||
    !Array.isArray(writtenReviewManifest.pipeline?.stages) ||
    writtenReviewManifest.pipeline.stages.length < 15
  ) {
    throw new Error(`Review manifest does not reflect the expected ${PHASE_ID} review pipeline depth.`);
  }

  if (writtenBundleMatrix.phase !== PHASE_ID || !Array.isArray(writtenBundleMatrix.bundles) || writtenBundleMatrix.bundles.length < 3) {
    throw new Error(`Bundle matrix does not reflect the expected ${PHASE_ID} per-platform bundle skeleton.`);
  }

  if (writtenBundleAssembly.phase !== PHASE_ID || !Array.isArray(writtenBundleAssembly.assemblies) || writtenBundleAssembly.assemblies.length < 3) {
    throw new Error(`Bundle assembly does not reflect the expected ${PHASE_ID} assembly skeleton.`);
  }

  if (
    writtenPackagedAppDirectorySkeleton.phase !== PHASE_ID ||
    !Array.isArray(writtenPackagedAppDirectorySkeleton.directories) ||
    writtenPackagedAppDirectorySkeleton.directories.length < 3
  ) {
    throw new Error(`Packaged app directory skeleton does not reflect the expected ${PHASE_ID} directory metadata.`);
  }

  if (
    writtenPackagedAppDirectoryMaterialization.phase !== PHASE_ID ||
    writtenPackagedAppDirectoryMaterialization.mode !== "review-only" ||
    !Array.isArray(writtenPackagedAppDirectoryMaterialization.directories) ||
    writtenPackagedAppDirectoryMaterialization.directories.length < 3
  ) {
    throw new Error(`Packaged app directory materialization does not reflect the expected ${PHASE_ID} materialization metadata.`);
  }

  if (
    writtenPackagedAppMaterializationSkeleton.phase !== PHASE_ID ||
    !Array.isArray(writtenPackagedAppMaterializationSkeleton.materializations) ||
    writtenPackagedAppMaterializationSkeleton.materializations.length < 3
  ) {
    throw new Error(`Packaged app materialization skeleton does not reflect the expected ${PHASE_ID} materialization metadata.`);
  }

  if (writtenInstallerTargets.phase !== PHASE_ID || !Array.isArray(writtenInstallerTargets.targets) || writtenInstallerTargets.targets.length < 7) {
    throw new Error(`Installer targets do not reflect the expected ${PHASE_ID} installer-target metadata.`);
  }

  if (
    writtenPackagedAppStagedOutputSkeleton.phase !== PHASE_ID ||
    !Array.isArray(writtenPackagedAppStagedOutputSkeleton.outputs) ||
    writtenPackagedAppStagedOutputSkeleton.outputs.length < 3
  ) {
    throw new Error(`Packaged-app staged output skeleton does not reflect the expected ${PHASE_ID} staged-output metadata.`);
  }

  if (
    writtenPackagedAppBundleSealingSkeleton.phase !== PHASE_ID ||
    writtenPackagedAppBundleSealingSkeleton.mode !== "review-only" ||
    !Array.isArray(writtenPackagedAppBundleSealingSkeleton.bundles) ||
    writtenPackagedAppBundleSealingSkeleton.bundles.length < 3
  ) {
    throw new Error(`Packaged-app bundle sealing skeleton does not reflect the expected ${PHASE_ID} sealing metadata.`);
  }

  if (
    writtenSealedBundleIntegrityContract.phase !== PHASE_ID ||
    writtenSealedBundleIntegrityContract.mode !== "review-only" ||
    !Array.isArray(writtenSealedBundleIntegrityContract.contracts) ||
    writtenSealedBundleIntegrityContract.contracts.length < 3
  ) {
    throw new Error(`Sealed-bundle integrity contract does not reflect the expected ${PHASE_ID} integrity metadata.`);
  }

  if (
    writtenInstallerBuilderExecutionSkeleton.phase !== PHASE_ID ||
    !Array.isArray(writtenInstallerBuilderExecutionSkeleton.executions) ||
    writtenInstallerBuilderExecutionSkeleton.executions.length < 7
  ) {
    throw new Error(`Installer builder execution skeleton does not reflect the expected ${PHASE_ID} execution metadata.`);
  }

  if (
    writtenInstallerTargetBuilderSkeleton.phase !== PHASE_ID ||
    !Array.isArray(writtenInstallerTargetBuilderSkeleton.builders) ||
    writtenInstallerTargetBuilderSkeleton.builders.length < 7
  ) {
    throw new Error(`Installer-target builder skeleton does not reflect the expected ${PHASE_ID} builder metadata.`);
  }

  if (
    writtenInstallerBuilderOrchestration.phase !== PHASE_ID ||
    !Array.isArray(writtenInstallerBuilderOrchestration.flows) ||
    writtenInstallerBuilderOrchestration.flows.length < 3
  ) {
    throw new Error(`Installer builder orchestration does not reflect the expected ${PHASE_ID} orchestration metadata.`);
  }

  if (
    writtenInstallerChannelRouting.phase !== PHASE_ID ||
    writtenInstallerChannelRouting.mode !== "review-only" ||
    !Array.isArray(writtenInstallerChannelRouting.routes) ||
    writtenInstallerChannelRouting.routes.length < 3
  ) {
    throw new Error(`Installer channel routing does not reflect the expected ${PHASE_ID} routing metadata.`);
  }

  if (
    writtenChannelPromotionEvidence.phase !== PHASE_ID ||
    writtenChannelPromotionEvidence.mode !== "local-only-review" ||
    !Array.isArray(writtenChannelPromotionEvidence.promotions) ||
    writtenChannelPromotionEvidence.promotions.length < 2
  ) {
    throw new Error(`Channel promotion evidence does not reflect the expected ${PHASE_ID} promotion metadata.`);
  }

  if (writtenSigningMetadata.phase !== PHASE_ID || !Array.isArray(writtenSigningMetadata.readiness) || writtenSigningMetadata.readiness.length < 3) {
    throw new Error(`Signing metadata does not reflect the expected ${PHASE_ID} signing-ready skeleton.`);
  }

  if (writtenNotarizationPlan.phase !== PHASE_ID || !Array.isArray(writtenNotarizationPlan.platforms) || writtenNotarizationPlan.platforms.length < 3) {
    throw new Error(`Notarization plan does not reflect the expected ${PHASE_ID} signing/notarization skeleton.`);
  }

  if (
    writtenSigningPublishGatingHandshake.phase !== PHASE_ID ||
    writtenSigningPublishGatingHandshake.canHandshake !== false ||
    writtenSigningPublishGatingHandshake.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenSigningPublishGatingHandshake.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenSigningPublishGatingHandshake.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    !Array.isArray(writtenSigningPublishGatingHandshake.stages) ||
    writtenSigningPublishGatingHandshake.stages.length < 10 ||
    !Array.isArray(writtenSigningPublishGatingHandshake.acknowledgements) ||
    writtenSigningPublishGatingHandshake.acknowledgements.length < 9
  ) {
    throw new Error(`Signing-publish gating handshake does not reflect the expected ${PHASE_ID} handshake metadata.`);
  }

  if (
    writtenSigningPublishPipeline.phase !== PHASE_ID ||
    writtenSigningPublishPipeline.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenSigningPublishPipeline.gatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    writtenSigningPublishPipeline.approvalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    writtenSigningPublishPipeline.channelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    writtenSigningPublishPipeline.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenSigningPublishPipeline.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    writtenSigningPublishPipeline.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    !Array.isArray(writtenSigningPublishPipeline.stages) ||
    writtenSigningPublishPipeline.stages.length < 17
  ) {
    throw new Error(`Signing & publish pipeline does not reflect the expected ${PHASE_ID} pipeline metadata.`);
  }

  if (
    writtenSigningPublishApprovalBridge.phase !== PHASE_ID ||
    !Array.isArray(writtenSigningPublishApprovalBridge.bridge) ||
    writtenSigningPublishApprovalBridge.bridge.length < 7
  ) {
    throw new Error(`Signing-publish approval bridge does not reflect the expected ${PHASE_ID} bridge metadata.`);
  }

  if (
    writtenSigningPublishPromotionHandshake.phase !== PHASE_ID ||
    writtenSigningPublishPromotionHandshake.canPromote !== false ||
    writtenSigningPublishPromotionHandshake.channelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    writtenSigningPublishPromotionHandshake.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenSigningPublishPromotionHandshake.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenSigningPublishPromotionHandshake.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    !Array.isArray(writtenSigningPublishPromotionHandshake.stages) ||
    writtenSigningPublishPromotionHandshake.stages.length < 8 ||
    !Array.isArray(writtenSigningPublishPromotionHandshake.acknowledgements) ||
    writtenSigningPublishPromotionHandshake.acknowledgements.length < 8
  ) {
    throw new Error(`Signing-publish promotion handshake does not reflect the expected ${PHASE_ID} promotion metadata.`);
  }

  if (
    writtenPublishRollbackHandshake.phase !== PHASE_ID ||
    writtenPublishRollbackHandshake.canRollback !== false ||
    writtenPublishRollbackHandshake.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenPublishRollbackHandshake.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenPublishRollbackHandshake.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    !Array.isArray(writtenPublishRollbackHandshake.paths) ||
    writtenPublishRollbackHandshake.paths.length < 2 ||
    !Array.isArray(writtenPublishRollbackHandshake.stages) ||
    writtenPublishRollbackHandshake.stages.length < 6 ||
    !Array.isArray(writtenPublishRollbackHandshake.acknowledgements) ||
    writtenPublishRollbackHandshake.acknowledgements.length < 6
  ) {
    throw new Error(`Publish rollback handshake does not reflect the expected ${PHASE_ID} rollback metadata.`);
  }

  if (
    writtenReleaseApprovalWorkflow.phase !== PHASE_ID ||
    writtenReleaseApprovalWorkflow.mode !== "local-only-review" ||
    writtenReleaseApprovalWorkflow.gatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    writtenReleaseApprovalWorkflow.approvalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    writtenReleaseApprovalWorkflow.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    !Array.isArray(writtenReleaseApprovalWorkflow.stages) ||
    writtenReleaseApprovalWorkflow.stages.length < 6
  ) {
    throw new Error(`Release approval workflow does not reflect the expected ${PHASE_ID} approval metadata.`);
  }

  if (writtenPublishGates.phase !== PHASE_ID || !Array.isArray(writtenPublishGates.gates) || writtenPublishGates.gates.length < 18) {
    throw new Error(`Publish gates do not reflect the expected ${PHASE_ID} release gating skeleton.`);
  }

  if (writtenPromotionGates.phase !== PHASE_ID || !Array.isArray(writtenPromotionGates.promotions) || writtenPromotionGates.promotions.length < 2) {
    throw new Error(`Promotion gates do not reflect the expected ${PHASE_ID} promotion-gating skeleton.`);
  }

  if (!writtenReleaseSummary.includes("Phase41 Release Summary") && !writtenReleaseSummary.includes("Phase41")) {
    throw new Error(`Release summary does not reflect the expected ${PHASE_ID} review summary.`);
  }

  if (!writtenReleaseNotes.includes("Phase41 Release Notes") && !writtenReleaseNotes.includes("Phase41")) {
    throw new Error(`Release notes do not reflect the expected ${PHASE_ID} release-notes skeleton.`);
  }

  if (!placeholderScript.includes("This placeholder does not install anything.")) {
    throw new Error("Installer placeholder script lost its no-op safety contract.");
  }

  return {
    manifestArtifacts: writtenManifest.artifacts.length,
    artifactGroups: skeleton.artifactGroups.length
  };
}

function formatReleasePlanSummary(skeleton) {
  const artifactLines = skeleton.artifactGroups.map(
    (group) => `- ${group.id}: ${group.fileCount} files, ${formatBytes(group.totalBytes)} -> ${group.outputRoot}`
  );

  return [
    `Phase: ${PHASE_ID}`,
    `Milestone: ${PHASE_MILESTONE}`,
    `Package: ${PACKAGE_ID}`,
    `Delivery root: ${skeleton.paths.deliveryRoot}`,
    "Artifact groups:",
    ...artifactLines,
    `Installer status: ${skeleton.installerPlaceholder.status} (${skeleton.installerPlaceholder.missingCapabilities.length} gaps still open)`,
    `Review stage: ${skeleton.reviewManifest.pipeline.stage}`,
    `Bundle matrix: ${skeleton.bundleMatrix.bundles.map((entry) => entry.platform).join("/")}`,
    `Assembly entries: ${skeleton.bundleAssembly.assemblies.length}`,
    `Packaged app directories: ${skeleton.packagedAppDirectorySkeleton.directories.length}`,
    `Directory materialization entries: ${skeleton.packagedAppDirectoryMaterialization.directories.length}`,
    `Materialization entries: ${skeleton.packagedAppMaterializationSkeleton.materializations.length}`,
    `Staged output entries: ${skeleton.packagedAppStagedOutputSkeleton.outputs.length}`,
    `Bundle sealing entries: ${skeleton.packagedAppBundleSealingSkeleton.bundles.length}`,
    `Sealed-bundle integrity contracts: ${skeleton.sealedBundleIntegrityContract.contracts.length}`,
    `Installer targets: ${skeleton.installerTargets.targets.length}`,
    `Installer execution skeletons: ${skeleton.installerBuilderExecutionSkeleton.executions.length}`,
    `Installer builders: ${skeleton.installerTargetBuilderSkeleton.builders.length}`,
    `Installer orchestration flows: ${skeleton.installerBuilderOrchestration.flows.length}`,
    `Installer channel routes: ${skeleton.installerChannelRouting.routes.length}`,
    `Channel promotion evidence entries: ${skeleton.channelPromotionEvidence.promotions.length}`,
    `Signing/publish handshake stages: ${skeleton.signingPublishGatingHandshake.stages.length}`,
    `Signing/publish pipeline stages: ${skeleton.signingPublishPipeline.stages.length}`,
    `Signing/publish approval bridge entries: ${skeleton.signingPublishApprovalBridge.bridge.length}`,
    `Signing/publish promotion handshake stages: ${skeleton.signingPublishPromotionHandshake.stages.length}`,
    `Publish rollback handshake paths: ${skeleton.publishRollbackHandshake.paths.length}`,
    `Approval workflow stages: ${skeleton.releaseApprovalWorkflow.stages.length} (${skeleton.releaseApprovalWorkflow.mode})`,
    `Promotion gates: ${skeleton.promotionGates.promotions.length}`,
    `Docs: ${skeleton.allDocs.map((doc) => doc.outputPath).join(", ")}`
  ].join("\n");
}

module.exports = {
  APP_NAME,
  CURRENT_DELIVERY_SURFACES,
  DELIVERY_CONSTRAINTS,
  FORMAL_INSTALLER_GAPS,
  OPTIONAL_RELEASE_COMMANDS,
  PACKAGE_ID,
  PACKAGE_KIND,
  PACKAGE_LAYOUT,
  PHASE_ID,
  PHASE_MILESTONE,
  RELEASE_CHANNEL,
  REQUIRED_RELEASE_COMMANDS,
  createReleaseSkeleton,
  formatReleasePlanSummary,
  verifyReleaseSkeletonOutput,
  writeReleaseSkeleton
};
