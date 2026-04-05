# OpenClaw Studio Phase41 Package Snapshot

这是一个 **phase41 alpha-shell release skeleton**，在 phase26/27/28/29/30/31/32/33/34/35/36/37/38/39/40 packaging 与 shell foundations 的基础上继续补齐 sealed-bundle integrity contract、channel promotion evidence 与 publish rollback handshake，但它依然 **不是 installer**。

当前已验证里程碑：phase41 sealed-bundle integrity contract / channel promotion evidence / publish rollback handshake + docs / smoke / package / release-plan / UI / shared data closeout。

## 当前能交付什么

- structured alpha-shell snapshot under delivery/openclaw-studio-alpha-shell
- built renderer bundle copied into artifacts/renderer
- built Electron bundle copied into artifacts/electron
- deeper inspector drilldowns, active flow state, route-aware next-step boards, and inspector-command linkage
- persisted shell layout foundation backed by localStorage
- cross-view local orchestration boards linking route, workflow lane, workspace, detached candidate, intent focus, focused slot, and handoff posture
- release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged app materialization skeleton / packaged app directory materialization / packaged app staged output skeleton / packaged app bundle sealing skeleton / sealed-bundle integrity contract / installer targets / installer-target builder skeleton / installer builder execution skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / signing-ready metadata / signing-publish pipeline / signing-publish gating handshake / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / release approval workflow / release notes / publish gates / promotion gates under release/
- docs closeout: README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README / RELEASE-SUMMARY / REVIEW-MANIFEST / BUNDLE-MATRIX / BUNDLE-ASSEMBLY / PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-MATERIALIZATION-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION / PACKAGED-APP-STAGED-OUTPUT-SKELETON.json / PACKAGED-APP-BUNDLE-SEALING-SKELETON.json / SEALED-BUNDLE-INTEGRITY-CONTRACT.json / INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON / INSTALLER-BUILDER-EXECUTION-SKELETON / INSTALLER-BUILDER-ORCHESTRATION.json / INSTALLER-CHANNEL-ROUTING.json / CHANNEL-PROMOTION-EVIDENCE.json / SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE / SIGNING-PUBLISH-GATING-HANDSHAKE / SIGNING-PUBLISH-APPROVAL-BRIDGE.json / SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json / PUBLISH-ROLLBACK-HANDSHAKE.json / RELEASE-APPROVAL-WORKFLOW / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES
- placeholder installer explainer script that never installs anything

## 当前还没交付什么

- 不会安装到系统目录
- 不会修改 services/install/config
- 不会写入 `~/.openclaw`
- 不会启动真实 external connector processes
- 不会开放真实 host-side execution

## 正式 installer 仍缺什么

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

## 快照结构

```text
openclaw-studio-alpha-shell/
  README.md
  HANDOFF.md
  IMPLEMENTATION-PLAN.md
  PACKAGE-README.md
  artifacts/
    renderer/
    electron/
  release/
    RELEASE-MANIFEST.json
    BUILD-METADATA.json
    REVIEW-MANIFEST.json
    BUNDLE-MATRIX.json
    BUNDLE-ASSEMBLY.json
    PACKAGED-APP-DIRECTORY-SKELETON.json
    PACKAGED-APP-MATERIALIZATION-SKELETON.json
    PACKAGED-APP-DIRECTORY-MATERIALIZATION.json
    PACKAGED-APP-STAGED-OUTPUT-SKELETON.json
    PACKAGED-APP-BUNDLE-SEALING-SKELETON.json
    SEALED-BUNDLE-INTEGRITY-CONTRACT.json
    INSTALLER-TARGETS.json
    INSTALLER-TARGET-BUILDER-SKELETON.json
    INSTALLER-BUILDER-EXECUTION-SKELETON.json
    INSTALLER-BUILDER-ORCHESTRATION.json
    INSTALLER-CHANNEL-ROUTING.json
    CHANNEL-PROMOTION-EVIDENCE.json
    SIGNING-METADATA.json
    NOTARIZATION-PLAN.json
    SIGNING-PUBLISH-PIPELINE.json
    SIGNING-PUBLISH-GATING-HANDSHAKE.json
    SIGNING-PUBLISH-APPROVAL-BRIDGE.json
    SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json
    PUBLISH-ROLLBACK-HANDSHAKE.json
    RELEASE-APPROVAL-WORKFLOW.json
    RELEASE-NOTES.md
    PUBLISH-GATES.json
    PROMOTION-GATES.json
    RELEASE-SUMMARY.md
    INSTALLER-PLACEHOLDER.json
    RELEASE-CHECKLIST.md
  scripts/
    install-placeholder.cjs
```

## 已复制的 artifact 组

- Renderer bundle: 3 files, 352.8 KiB, output=artifacts/renderer
- Electron bundle: 10 files, 314.2 KiB, output=artifacts/electron

## 已包含的文档

- README.md
- HANDOFF.md
- IMPLEMENTATION-PLAN.md
- PACKAGE-README.md（generated）
- release/RELEASE-SUMMARY.md（generated）
- release/REVIEW-MANIFEST.json（generated）
- release/BUNDLE-MATRIX.json（generated）
- release/BUNDLE-ASSEMBLY.json（generated）
- release/PACKAGED-APP-DIRECTORY-SKELETON.json（generated）
- release/PACKAGED-APP-MATERIALIZATION-SKELETON.json（generated）
- release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json（generated）
- release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json（generated）
- release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json（generated）
- release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json（generated）
- release/INSTALLER-TARGETS.json（generated）
- release/INSTALLER-TARGET-BUILDER-SKELETON.json（generated）
- release/INSTALLER-BUILDER-EXECUTION-SKELETON.json（generated）
- release/INSTALLER-BUILDER-ORCHESTRATION.json（generated）
- release/INSTALLER-CHANNEL-ROUTING.json（generated）
- release/CHANNEL-PROMOTION-EVIDENCE.json（generated）
- release/SIGNING-METADATA.json（generated）
- release/NOTARIZATION-PLAN.json（generated）
- release/SIGNING-PUBLISH-PIPELINE.json（generated）
- release/SIGNING-PUBLISH-GATING-HANDSHAKE.json（generated）
- release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json（generated）
- release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json（generated）
- release/PUBLISH-ROLLBACK-HANDSHAKE.json（generated）
- release/RELEASE-APPROVAL-WORKFLOW.json（generated）
- release/RELEASE-NOTES.md（generated）
- release/PUBLISH-GATES.json（generated）
- release/PROMOTION-GATES.json（generated）
- release/RELEASE-CHECKLIST.md（generated）

## 查看顺序建议

- 先看 `release/RELEASE-MANIFEST.json`
- 再看 `release/BUILD-METADATA.json`
- 再看 `release/REVIEW-MANIFEST.json`
- 再看 `release/BUNDLE-MATRIX.json`
- 再看 `release/BUNDLE-ASSEMBLY.json`
- 再看 `release/PACKAGED-APP-DIRECTORY-SKELETON.json`
- 再看 `release/PACKAGED-APP-MATERIALIZATION-SKELETON.json`
- 再看 `release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json`
- 再看 `release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json`
- 再看 `release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json`
- 再看 `release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json`
- 再看 `release/INSTALLER-TARGETS.json`
- 再看 `release/INSTALLER-TARGET-BUILDER-SKELETON.json`
- 再看 `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json`
- 再看 `release/INSTALLER-BUILDER-ORCHESTRATION.json`
- 再看 `release/INSTALLER-CHANNEL-ROUTING.json`
- 再看 `release/CHANNEL-PROMOTION-EVIDENCE.json`
- 再看 `release/SIGNING-METADATA.json`
- 再看 `release/NOTARIZATION-PLAN.json`
- 再看 `release/SIGNING-PUBLISH-PIPELINE.json`
- 再看 `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json`
- 再看 `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json`
- 再看 `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json`
- 再看 `release/PUBLISH-ROLLBACK-HANDSHAKE.json`
- 再看 `release/RELEASE-APPROVAL-WORKFLOW.json`
- 再看 `release/RELEASE-NOTES.md`
- 再看 `release/PUBLISH-GATES.json`
- 再看 `release/PROMOTION-GATES.json`
- 再看 `release/RELEASE-SUMMARY.md`
- 再看 `release/INSTALLER-PLACEHOLDER.json`
- 再看 `release/RELEASE-CHECKLIST.md`
- 最后审阅 `artifacts/renderer` 与 `artifacts/electron`

## 说明

- `scripts/install-placeholder.cjs` 只解释当前 installer 仍缺什么，不执行安装
- 如需重新生成整个 snapshot，请回到 repo root 运行 `npm run package:alpha`

Generated: 2026-04-05T01:10:02.938Z
