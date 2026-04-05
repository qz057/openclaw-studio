# OpenClaw Studio Phase41 Release Checklist

## Required Commands

- `npm run typecheck`
- `npm run build`
- `npm run smoke`
- `npm run start:smoke`
- `npm run package:alpha`

## Optional Dry-Run

- `npm run release:plan`

## Artifact Contract

- `artifacts/renderer/index.html` 必须存在并指向打包后的 asset
- `artifacts/electron/electron/main.js` 与 `artifacts/electron/electron/preload.js` 必须存在
- `release/RELEASE-MANIFEST.json` 必须列出 docs、artifact groups、installer placeholder contract
- `release/BUILD-METADATA.json` 必须记录 build/preflight/toolchain 元数据
- `release/REVIEW-MANIFEST.json` 必须列出 sealed-bundle-integrity-channel-promotion-evidence-publish-rollback-handshake-skeleton pipeline stage、review docs、artifact groups、blocked 发布动作
- `release/BUNDLE-MATRIX.json` 必须列出 per-platform bundle skeleton
- `release/BUNDLE-ASSEMBLY.json` 必须列出 bundle assembly skeleton
- `release/PACKAGED-APP-DIRECTORY-SKELETON.json` 必须列出 per-platform packaged app directory skeleton
- `release/PACKAGED-APP-MATERIALIZATION-SKELETON.json` 必须列出 packaged-app materialization skeleton
- `release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json` 必须列出 packaged-app directory materialization metadata
- `release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json` 必须列出 packaged-app staged output skeleton
- `release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json` 必须列出 packaged-app bundle sealing skeleton
- `release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json` 必须列出 sealed-bundle integrity contract
- `release/INSTALLER-TARGETS.json` 必须列出 installer target metadata
- `release/INSTALLER-TARGET-BUILDER-SKELETON.json` 必须列出 installer-target builder skeleton
- `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json` 必须列出 installer builder execution skeleton
- `release/INSTALLER-BUILDER-ORCHESTRATION.json` 必须列出 installer builder orchestration metadata
- `release/INSTALLER-CHANNEL-ROUTING.json` 必须列出 installer channel routing metadata
- `release/CHANNEL-PROMOTION-EVIDENCE.json` 必须列出 channel promotion evidence metadata
- `release/SIGNING-METADATA.json` 必须列出 signing-ready metadata
- `release/NOTARIZATION-PLAN.json` 必须列出 signing / notarization skeleton
- `release/SIGNING-PUBLISH-PIPELINE.json` 必须列出 signing & publish pipeline skeleton
- `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json` 必须列出 signing-publish gating handshake metadata
- `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json` 必须列出 signing-publish approval bridge metadata
- `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json` 必须列出 signing-publish promotion handshake metadata
- `release/PUBLISH-ROLLBACK-HANDSHAKE.json` 必须列出 publish rollback handshake metadata
- `release/RELEASE-APPROVAL-WORKFLOW.json` 必须列出 release approval workflow metadata
- `release/RELEASE-NOTES.md` 必须列出当前 release notes 草案
- `release/PUBLISH-GATES.json` 必须列出 publish gating 条目
- `release/PROMOTION-GATES.json` 必须列出 promotion gating 条目
- `release/RELEASE-SUMMARY.md` 必须给出当前 snapshot 的 release review 摘要
- `release/INSTALLER-PLACEHOLDER.json` 必须明确当前不是 installer，以及正式 installer 仍缺哪些步骤
- `scripts/install-placeholder.cjs` 只能输出说明，不得执行任何安装动作

## Current Delivery Surface

- structured alpha-shell snapshot under delivery/openclaw-studio-alpha-shell
- built renderer bundle copied into artifacts/renderer
- built Electron bundle copied into artifacts/electron
- deeper inspector drilldowns, active flow state, route-aware next-step boards, and inspector-command linkage
- persisted shell layout foundation backed by localStorage
- cross-view local orchestration boards linking route, workflow lane, workspace, detached candidate, intent focus, focused slot, and handoff posture
- release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged app materialization skeleton / packaged app directory materialization / packaged app staged output skeleton / packaged app bundle sealing skeleton / sealed-bundle integrity contract / installer targets / installer-target builder skeleton / installer builder execution skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / signing-ready metadata / signing-publish pipeline / signing-publish gating handshake / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / release approval workflow / release notes / publish gates / promotion gates under release/
- docs closeout: README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README / RELEASE-SUMMARY / REVIEW-MANIFEST / BUNDLE-MATRIX / BUNDLE-ASSEMBLY / PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-MATERIALIZATION-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION / PACKAGED-APP-STAGED-OUTPUT-SKELETON.json / PACKAGED-APP-BUNDLE-SEALING-SKELETON.json / SEALED-BUNDLE-INTEGRITY-CONTRACT.json / INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON / INSTALLER-BUILDER-EXECUTION-SKELETON / INSTALLER-BUILDER-ORCHESTRATION.json / INSTALLER-CHANNEL-ROUTING.json / CHANNEL-PROMOTION-EVIDENCE.json / SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE / SIGNING-PUBLISH-GATING-HANDSHAKE / SIGNING-PUBLISH-APPROVAL-BRIDGE.json / SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json / PUBLISH-ROLLBACK-HANDSHAKE.json / RELEASE-APPROVAL-WORKFLOW / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES
- placeholder installer explainer script that never installs anything

## Still Blocked For Formal Installer

- no packaged per-OS staged output materialization yet; staged outputs remain review-only metadata
- no packaged per-OS bundle sealing yet; sealing remains review-only metadata
- no per-platform sealed-bundle integrity attestation or digest publication yet; integrity contract remains review-only metadata
- no Windows / macOS / Linux installer builder orchestration and channel routing wiring yet; routing remains review-only skeleton
- no executable channel promotion evidence pack or promotion routing apply yet; evidence remains review-only metadata
- no signing / notarization / hash publication workflow yet; approval bridge remains metadata-only
- no executable signing-publish gating handshake yet; handshake remains metadata-only
- no executable release approval handshake yet; workflow remains metadata-only
- no release publishing / artifact upload / promotion handshake / rollback apply automation yet; publish rollback handshake remains metadata-only
- real host-side execution remains disabled until approval / lifecycle / rollback close the loop

## Safety Boundaries

- real host-side execution remains disabled
- no ~/.openclaw writes
- no services / install / config mutation
- no external connector process control
