# OpenClaw Studio Phase60 Package Snapshot

这是一个 **phase60 alpha-shell release skeleton**，在 phase26/27/28/29/30/31/32/33/34/35/36/37/38/39/40/42/43/44/45/46/47/48/49/50/51/52/53/54/55/56/57/58 packaging 与 shell foundations 的基础上，把 local-only multi-window orchestration、cross-window shared-state review surface、以及 review-only release approval pipeline 继续推进成更明确的 Delivery-chain Workspace / Stage Explorer / artifact coverage / blockers / handoff posture / observability mapping 审阅壳，但它依然 **不是 installer**。

当前已验证里程碑：phase60 delivery-chain workspace / stage explorer / review flow ladder / delivery coverage matrix / review-deck coverage routing / review-deck orchestration deck / command-surface action-deck coverage / review-surface coverage actions / review-surface navigator / review-surface multi-window coverage / typed companion review-path orchestration / sequence-aware companion review navigation / delivery-gate companion sequence switching / companion route-history memory / route replay board / replay acceptance checklist / command-surface observability linkage / linked review artifacts / blockers / handoff posture / observability mapping / review-only delivery chain / operator review loop / local-only multi-window shared-state review surface / docs / smoke / package / release-plan / UI / shared data closeout。

## 当前能交付什么

- structured alpha-shell snapshot under delivery/openclaw-studio-alpha-shell
- built renderer bundle copied into artifacts/renderer
- built Electron bundle copied into artifacts/electron
- review-only release approval pipeline linking attestation intake, approval orchestration, lifecycle enforcement, rollback settlement closeout, the final release-decision gate, and explicit phase60 operator review loop / reviewer queue / acknowledgement / escalation / closeout artifacts without executing anything
- delivery-chain workspace, stage explorer, review flow ladder, delivery coverage matrix, review-deck coverage routing, review-surface coverage actions, command-surface multi-window review coverage, typed companion review-path orchestration, sequence-aware companion review navigation, delivery-gate companion sequence switching, companion route-history memory, a route replay board, a replay acceptance checklist, and the review-deck orchestration action deck linking the operator review board, decision handoff, evidence closeout, promotion readiness, publish decision gates, rollback readiness, blockers, artifact coverage, observability mapping, command-surface review posture, and multi-window coverage into one staged local-only workflow without executing anything
- deeper per-slot trace drill-down with phase stage metadata, linked notes, and cross-linked approval / lifecycle / rollback / release-artifact references
- deeper inspector drilldowns, active flow state, route-aware next-step boards, release-pipeline surfacing, review-posture ownership, and inspector-command linkage
- persisted shell layout foundation backed by localStorage
- cross-window coordination board with explicit window roster, shared-state lanes, orchestration boards, review-posture ownership maps, sync health, ownership, last handoff, route/workspace intent links, focused-slot linkage, command-surface review coverage routing, and local-only blockers
- release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged app materialization skeleton / packaged app directory materialization / packaged app staged output skeleton / packaged app bundle sealing skeleton / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / attestation apply audit packs / attestation apply execution packets / attestation operator worklists / attestation operator dispatch manifests / attestation operator dispatch packets / attestation operator dispatch receipts / attestation operator reconciliation ledgers / attestation operator settlement packs / attestation operator approval routing contracts / attestation operator approval orchestration / operator review board / release decision handoff / review evidence closeout / installer targets / installer-target builder skeleton / installer builder execution skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / promotion execution checkpoints / promotion operator handoff rails / promotion staged-apply ledgers / promotion staged-apply runsheets / promotion staged-apply command sheets / promotion staged-apply confirmation ledgers / promotion staged-apply closeout journals / promotion staged-apply signoff sheets / promotion staged-apply release decision enforcement contracts / promotion staged-apply release decision enforcement lifecycle / signing-ready metadata / signing-publish pipeline / signing-publish gating handshake / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / rollback operator drillbooks / rollback live-readiness contracts / rollback cutover readiness maps / rollback cutover handoff plans / rollback cutover execution checklists / rollback cutover execution records / rollback cutover outcome reports / rollback cutover publication bundles / rollback cutover publication receipt closeout contracts / rollback cutover publication receipt settlement closeout / release approval workflow / release notes / publish gates / promotion gates under release/
- docs closeout: README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README / RELEASE-SUMMARY / REVIEW-MANIFEST / BUNDLE-MATRIX / BUNDLE-ASSEMBLY / PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-MATERIALIZATION-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION / PACKAGED-APP-STAGED-OUTPUT-SKELETON.json / PACKAGED-APP-BUNDLE-SEALING-SKELETON.json / SEALED-BUNDLE-INTEGRITY-CONTRACT.json / INTEGRITY-ATTESTATION-EVIDENCE.json / ATTESTATION-VERIFICATION-PACKS.json / ATTESTATION-APPLY-AUDIT-PACKS.json / ATTESTATION-APPLY-EXECUTION-PACKETS.json / ATTESTATION-OPERATOR-WORKLISTS.json / ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json / ATTESTATION-OPERATOR-DISPATCH-PACKETS.json / ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json / ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json / ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json / ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json / ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json / REVIEW-ONLY-DELIVERY-CHAIN.json / OPERATOR-REVIEW-BOARD.json / RELEASE-DECISION-HANDOFF.json / REVIEW-EVIDENCE-CLOSEOUT.json / INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON / INSTALLER-BUILDER-EXECUTION-SKELETON / INSTALLER-BUILDER-ORCHESTRATION.json / INSTALLER-CHANNEL-ROUTING.json / CHANNEL-PROMOTION-EVIDENCE.json / PROMOTION-APPLY-READINESS.json / PROMOTION-APPLY-MANIFESTS.json / PROMOTION-EXECUTION-CHECKPOINTS.json / PROMOTION-OPERATOR-HANDOFF-RAILS.json / PROMOTION-STAGED-APPLY-LEDGERS.json / PROMOTION-STAGED-APPLY-RUNSHEETS.json / PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json / PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json / PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json / PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json / SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE / SIGNING-PUBLISH-GATING-HANDSHAKE / SIGNING-PUBLISH-APPROVAL-BRIDGE.json / SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json / PUBLISH-ROLLBACK-HANDSHAKE.json / ROLLBACK-RECOVERY-LEDGER.json / ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json / ROLLBACK-OPERATOR-DRILLBOOKS.json / ROLLBACK-LIVE-READINESS-CONTRACTS.json / ROLLBACK-CUTOVER-READINESS-MAPS.json / ROLLBACK-CUTOVER-HANDOFF-PLANS.json / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json / ROLLBACK-CUTOVER-EXECUTION-RECORDS.json / ROLLBACK-CUTOVER-OUTCOME-REPORTS.json / ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json / RELEASE-APPROVAL-WORKFLOW / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES
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
- no attestation verification pack emission or verifier handoff yet; verification packs remain review-only metadata
- no executable attestation apply audit or apply-execution packet handoff yet; audit packs and execution packets remain review-only metadata
- no executable attestation operator dispatch or live dispatch-manifest apply yet; operator worklists and dispatch manifests remain review-only metadata
- no executable attestation operator dispatch packet emission, receipt capture, or acknowledgement reconciliation yet; dispatch packets remain review-only metadata
- no executable attestation operator dispatch receipt capture, acknowledgement reconciliation closeout, or escalation settlement yet; dispatch receipts remain review-only metadata
- no executable attestation operator reconciliation settlement, escalation clear, or approval-ready closeout yet; reconciliation ledgers remain review-only metadata
- no executable attestation operator settlement pack assembly, operator clearance routing, or approval attachment emission yet; settlement packs remain review-only metadata
- no executable attestation operator approval routing contract issuance, reviewer queue routing, or approval handoff declaration yet; approval routing contracts remain review-only metadata
- no executable attestation operator approval orchestration queueing, reviewer baton sequencing, or approval orchestration closeout yet; approval orchestration remains review-only metadata
- no Windows / macOS / Linux installer builder orchestration and channel routing wiring yet; routing remains review-only skeleton
- no executable channel promotion evidence pack or promotion routing apply yet; evidence remains review-only metadata
- no executable promotion apply manifests or channel apply execution yet; apply manifests remain review-only metadata
- no executable promotion execution checkpoints or operator handoff rails yet; checkpoints and handoff rails remain review-only metadata
- no executable promotion staged-apply journaling, operator runsheet entry, or staged cutover entry yet; staged-apply ledgers and runsheets remain review-only metadata
- no executable promotion staged-apply command issue, confirmation capture, or staged execution sheet routing yet; command sheets remain review-only metadata
- no executable promotion staged-apply confirmation capture, stage acceptance journaling, or cutover closeout reconciliation yet; confirmation ledgers remain review-only metadata
- no executable promotion staged-apply closeout sealing, recovery baton handoff, or publish-ready closeout yet; closeout journals remain review-only metadata
- no executable promotion staged-apply signoff capture, approver expiry enforcement, or release-ready signoff emission yet; signoff sheets remain review-only metadata
- no executable promotion staged release decision enforcement issuance, staged go/no-go guard locking, or publish-route enforcement yet; release decision enforcement contracts remain review-only metadata
- no executable promotion staged release decision enforcement lifecycle advancement, expiry closeout, or lifecycle baton transfer yet; release decision enforcement lifecycle remains review-only metadata
- no signing / notarization / hash publication workflow yet; approval bridge remains metadata-only
- no executable signing-publish gating handshake yet; handshake remains metadata-only
- no executable release approval pipeline approval handoff, reviewer quorum, or final release-decision gate yet; workflow remains metadata-only
- no rollback execution rehearsal or rollback apply automation yet; rehearsal ledger remains review-only metadata
- no rollback operator drillbooks or live-readiness contracts yet; drillbooks and live-readiness contracts remain review-only metadata
- no executable rollback cutover readiness evaluation, ownership baton transfer, or cutover topology handoff yet; cutover readiness maps and handoff plans remain review-only metadata
- no executable rollback cutover checklist issue, go/no-go capture, or cutover execution receipt yet; execution checklists remain review-only metadata
- no executable rollback cutover execution record emission, evidence closeout, or recovery-state publication yet; execution records remain review-only metadata
- no executable rollback cutover outcome publication, recovery digest seal, or rollback release report emission yet; outcome reports remain review-only metadata
- no executable rollback cutover publication bundle assembly, release-note attachment, or publication handoff yet; publication bundles remain review-only metadata
- no executable rollback cutover publication receipt closeout contract issuance, closeout acknowledgement sealing, or publication receipt closeout routing yet; publication receipt closeout contracts remain review-only metadata
- no executable rollback cutover publication receipt settlement closeout issuance, settlement ledger sealing, or receipt recovery closeout routing yet; receipt settlement closeout remains review-only metadata
- no release publishing / artifact upload / promotion handshake / rollback apply automation yet; publish rollback handshake remains metadata-only
- real host-side execution remains disabled until the review-only approval / lifecycle / rollback loop becomes executable end-to-end

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
    INTEGRITY-ATTESTATION-EVIDENCE.json
    ATTESTATION-VERIFICATION-PACKS.json
    ATTESTATION-APPLY-AUDIT-PACKS.json
    ATTESTATION-APPLY-EXECUTION-PACKETS.json
    ATTESTATION-OPERATOR-WORKLISTS.json
    ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json
    ATTESTATION-OPERATOR-DISPATCH-PACKETS.json
    ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json
    ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json
    ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json
    ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json
    ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json
    REVIEW-ONLY-DELIVERY-CHAIN.json
    OPERATOR-REVIEW-BOARD.json
    RELEASE-DECISION-HANDOFF.json
    REVIEW-EVIDENCE-CLOSEOUT.json
    INSTALLER-TARGETS.json
    INSTALLER-TARGET-BUILDER-SKELETON.json
    INSTALLER-BUILDER-EXECUTION-SKELETON.json
    INSTALLER-BUILDER-ORCHESTRATION.json
    INSTALLER-CHANNEL-ROUTING.json
    CHANNEL-PROMOTION-EVIDENCE.json
    PROMOTION-APPLY-READINESS.json
    PROMOTION-APPLY-MANIFESTS.json
    PROMOTION-EXECUTION-CHECKPOINTS.json
    PROMOTION-OPERATOR-HANDOFF-RAILS.json
    PROMOTION-STAGED-APPLY-LEDGERS.json
    PROMOTION-STAGED-APPLY-RUNSHEETS.json
    PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json
    PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json
    PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json
    PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json
    PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json
    PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json
    SIGNING-METADATA.json
    NOTARIZATION-PLAN.json
    SIGNING-PUBLISH-PIPELINE.json
    SIGNING-PUBLISH-GATING-HANDSHAKE.json
    SIGNING-PUBLISH-APPROVAL-BRIDGE.json
    SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json
    PUBLISH-ROLLBACK-HANDSHAKE.json
    ROLLBACK-RECOVERY-LEDGER.json
    ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json
    ROLLBACK-OPERATOR-DRILLBOOKS.json
    ROLLBACK-LIVE-READINESS-CONTRACTS.json
    ROLLBACK-CUTOVER-READINESS-MAPS.json
    ROLLBACK-CUTOVER-HANDOFF-PLANS.json
    ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json
    ROLLBACK-CUTOVER-EXECUTION-RECORDS.json
    ROLLBACK-CUTOVER-OUTCOME-REPORTS.json
    ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json
    ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json
    ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json
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

- Renderer bundle: 11 files, 719.2 KiB, output=artifacts/renderer
- Electron bundle: 15 files, 382.4 KiB, output=artifacts/electron

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
- release/INTEGRITY-ATTESTATION-EVIDENCE.json（generated）
- release/ATTESTATION-VERIFICATION-PACKS.json（generated）
- release/ATTESTATION-APPLY-AUDIT-PACKS.json（generated）
- release/ATTESTATION-APPLY-EXECUTION-PACKETS.json（generated）
- release/ATTESTATION-OPERATOR-WORKLISTS.json（generated）
- release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json（generated）
- release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json（generated）
- release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json（generated）
- release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json（generated）
- release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json（generated）
- release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json（generated）
- release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json（generated）
- release/REVIEW-ONLY-DELIVERY-CHAIN.json（generated）
- release/OPERATOR-REVIEW-BOARD.json（generated）
- release/RELEASE-DECISION-HANDOFF.json（generated）
- release/REVIEW-EVIDENCE-CLOSEOUT.json（generated）
- release/INSTALLER-TARGETS.json（generated）
- release/INSTALLER-TARGET-BUILDER-SKELETON.json（generated）
- release/INSTALLER-BUILDER-EXECUTION-SKELETON.json（generated）
- release/INSTALLER-BUILDER-ORCHESTRATION.json（generated）
- release/INSTALLER-CHANNEL-ROUTING.json（generated）
- release/CHANNEL-PROMOTION-EVIDENCE.json（generated）
- release/PROMOTION-APPLY-READINESS.json（generated）
- release/PROMOTION-APPLY-MANIFESTS.json（generated）
- release/PROMOTION-EXECUTION-CHECKPOINTS.json（generated）
- release/PROMOTION-OPERATOR-HANDOFF-RAILS.json（generated）
- release/PROMOTION-STAGED-APPLY-LEDGERS.json（generated）
- release/PROMOTION-STAGED-APPLY-RUNSHEETS.json（generated）
- release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json（generated）
- release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json（generated）
- release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json（generated）
- release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json（generated）
- release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json（generated）
- release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json（generated）
- release/SIGNING-METADATA.json（generated）
- release/NOTARIZATION-PLAN.json（generated）
- release/SIGNING-PUBLISH-PIPELINE.json（generated）
- release/SIGNING-PUBLISH-GATING-HANDSHAKE.json（generated）
- release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json（generated）
- release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json（generated）
- release/PUBLISH-ROLLBACK-HANDSHAKE.json（generated）
- release/ROLLBACK-RECOVERY-LEDGER.json（generated）
- release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json（generated）
- release/ROLLBACK-OPERATOR-DRILLBOOKS.json（generated）
- release/ROLLBACK-LIVE-READINESS-CONTRACTS.json（generated）
- release/ROLLBACK-CUTOVER-READINESS-MAPS.json（generated）
- release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json（generated）
- release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json（generated）
- release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json（generated）
- release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json（generated）
- release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json（generated）
- release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json（generated）
- release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json（generated）
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
- 再看 `release/INTEGRITY-ATTESTATION-EVIDENCE.json`
- 再看 `release/ATTESTATION-VERIFICATION-PACKS.json`
- 再看 `release/ATTESTATION-APPLY-AUDIT-PACKS.json`
- 再看 `release/ATTESTATION-APPLY-EXECUTION-PACKETS.json`
- 再看 `release/ATTESTATION-OPERATOR-WORKLISTS.json`
- 再看 `release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json`
- 再看 `release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json`
- 再看 `release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json`
- 再看 `release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json`
- 再看 `release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json`
- 再看 `release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json`
- 再看 `release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json`
- 再看 `release/REVIEW-ONLY-DELIVERY-CHAIN.json`
- 再看 `release/OPERATOR-REVIEW-BOARD.json`
- 再看 `release/RELEASE-DECISION-HANDOFF.json`
- 再看 `release/REVIEW-EVIDENCE-CLOSEOUT.json`
- 再看 `release/INSTALLER-TARGETS.json`
- 再看 `release/INSTALLER-TARGET-BUILDER-SKELETON.json`
- 再看 `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json`
- 再看 `release/INSTALLER-BUILDER-ORCHESTRATION.json`
- 再看 `release/INSTALLER-CHANNEL-ROUTING.json`
- 再看 `release/CHANNEL-PROMOTION-EVIDENCE.json`
- 再看 `release/PROMOTION-APPLY-READINESS.json`
- 再看 `release/PROMOTION-APPLY-MANIFESTS.json`
- 再看 `release/PROMOTION-EXECUTION-CHECKPOINTS.json`
- 再看 `release/PROMOTION-OPERATOR-HANDOFF-RAILS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-LEDGERS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-RUNSHEETS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json`
- 再看 `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json`
- 再看 `release/SIGNING-METADATA.json`
- 再看 `release/NOTARIZATION-PLAN.json`
- 再看 `release/SIGNING-PUBLISH-PIPELINE.json`
- 再看 `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json`
- 再看 `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json`
- 再看 `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json`
- 再看 `release/PUBLISH-ROLLBACK-HANDSHAKE.json`
- 再看 `release/ROLLBACK-RECOVERY-LEDGER.json`
- 再看 `release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json`
- 再看 `release/ROLLBACK-OPERATOR-DRILLBOOKS.json`
- 再看 `release/ROLLBACK-LIVE-READINESS-CONTRACTS.json`
- 再看 `release/ROLLBACK-CUTOVER-READINESS-MAPS.json`
- 再看 `release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json`
- 再看 `release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json`
- 再看 `release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json`
- 再看 `release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json`
- 再看 `release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json`
- 再看 `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json`
- 再看 `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json`
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

Generated: 2026-04-07T04:45:15.221Z
