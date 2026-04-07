# OpenClaw Studio Phase60 Release Checklist

## Required Commands

- `npm run typecheck`
- `npm run build`
- `npm run smoke`
- `npm run start:smoke`
- `npm run package:alpha`
- `npm run release:plan`

## Optional Dry-Run


## Artifact Contract

- `artifacts/renderer/index.html` 必须存在并指向打包后的 asset
- `artifacts/electron/electron/main.js` 与 `artifacts/electron/electron/preload.js` 必须存在
- `release/RELEASE-MANIFEST.json` 必须列出 docs、artifact groups、installer placeholder contract
- `release/BUILD-METADATA.json` 必须记录 build/preflight/toolchain 元数据
- `release/REVIEW-MANIFEST.json` 必须列出 review-only-release-approval-pipeline-skeleton pipeline stage、review docs、artifact groups、blocked 发布动作
- `release/BUNDLE-MATRIX.json` 必须列出 per-platform bundle skeleton
- `release/BUNDLE-ASSEMBLY.json` 必须列出 bundle assembly skeleton
- `release/PACKAGED-APP-DIRECTORY-SKELETON.json` 必须列出 per-platform packaged app directory skeleton
- `release/PACKAGED-APP-MATERIALIZATION-SKELETON.json` 必须列出 packaged-app materialization skeleton
- `release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json` 必须列出 packaged-app directory materialization metadata
- `release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json` 必须列出 packaged-app staged output skeleton
- `release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json` 必须列出 packaged-app bundle sealing skeleton
- `release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json` 必须列出 sealed-bundle integrity contract
- `release/INTEGRITY-ATTESTATION-EVIDENCE.json` 必须列出 integrity attestation evidence
- `release/ATTESTATION-VERIFICATION-PACKS.json` 必须列出 attestation verification packs
- `release/ATTESTATION-APPLY-AUDIT-PACKS.json` 必须列出 attestation apply audit packs metadata
- `release/ATTESTATION-APPLY-EXECUTION-PACKETS.json` 必须列出 attestation apply execution packets metadata
- `release/ATTESTATION-OPERATOR-WORKLISTS.json` 必须列出 attestation operator worklists metadata
- `release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json` 必须列出 attestation operator dispatch manifests metadata
- `release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json` 必须列出 attestation operator dispatch packets metadata
- `release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json` 必须列出 attestation operator dispatch receipts metadata
- `release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json` 必须列出 attestation operator reconciliation ledgers metadata
- `release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json` 必须列出 attestation operator settlement packs metadata
- `release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json` 必须列出 attestation operator approval routing contracts metadata
- `release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json` 必须列出 attestation operator approval orchestration metadata
- `release/REVIEW-ONLY-DELIVERY-CHAIN.json` 必须列出 delivery-chain workspace / stage explorer / review-surface navigator / multi-window review coverage / companion review-path orchestration metadata
- `release/OPERATOR-REVIEW-BOARD.json` 必须列出 operator review board metadata
- `release/RELEASE-DECISION-HANDOFF.json` 必须列出 release decision handoff metadata
- `release/REVIEW-EVIDENCE-CLOSEOUT.json` 必须列出 review evidence closeout metadata
- `release/INSTALLER-TARGETS.json` 必须列出 installer target metadata
- `release/INSTALLER-TARGET-BUILDER-SKELETON.json` 必须列出 installer-target builder skeleton
- `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json` 必须列出 installer builder execution skeleton
- `release/INSTALLER-BUILDER-ORCHESTRATION.json` 必须列出 installer builder orchestration metadata
- `release/INSTALLER-CHANNEL-ROUTING.json` 必须列出 installer channel routing metadata
- `release/CHANNEL-PROMOTION-EVIDENCE.json` 必须列出 channel promotion evidence metadata
- `release/PROMOTION-APPLY-READINESS.json` 必须列出 promotion apply readiness metadata
- `release/PROMOTION-APPLY-MANIFESTS.json` 必须列出 promotion apply manifests metadata
- `release/PROMOTION-EXECUTION-CHECKPOINTS.json` 必须列出 promotion execution checkpoints metadata
- `release/PROMOTION-OPERATOR-HANDOFF-RAILS.json` 必须列出 promotion operator handoff rails metadata
- `release/PROMOTION-STAGED-APPLY-LEDGERS.json` 必须列出 promotion staged-apply ledgers metadata
- `release/PROMOTION-STAGED-APPLY-RUNSHEETS.json` 必须列出 promotion staged-apply runsheets metadata
- `release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json` 必须列出 promotion staged-apply command sheets metadata
- `release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json` 必须列出 promotion staged-apply confirmation ledgers metadata
- `release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json` 必须列出 promotion staged-apply closeout journals metadata
- `release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json` 必须列出 promotion staged-apply signoff sheets metadata
- `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json` 必须列出 promotion staged-apply release decision enforcement contracts metadata
- `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json` 必须列出 promotion staged-apply release decision enforcement lifecycle metadata
- `release/SIGNING-METADATA.json` 必须列出 signing-ready metadata
- `release/NOTARIZATION-PLAN.json` 必须列出 signing / notarization skeleton
- `release/SIGNING-PUBLISH-PIPELINE.json` 必须列出 signing & publish pipeline skeleton
- `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json` 必须列出 signing-publish gating handshake metadata
- `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json` 必须列出 signing-publish approval bridge metadata
- `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json` 必须列出 signing-publish promotion handshake metadata
- `release/PUBLISH-ROLLBACK-HANDSHAKE.json` 必须列出 publish rollback handshake metadata
- `release/ROLLBACK-RECOVERY-LEDGER.json` 必须列出 rollback recovery ledger metadata
- `release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json` 必须列出 rollback execution rehearsal ledger metadata
- `release/ROLLBACK-OPERATOR-DRILLBOOKS.json` 必须列出 rollback operator drillbooks metadata
- `release/ROLLBACK-LIVE-READINESS-CONTRACTS.json` 必须列出 rollback live-readiness contracts metadata
- `release/ROLLBACK-CUTOVER-READINESS-MAPS.json` 必须列出 rollback cutover readiness maps metadata
- `release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json` 必须列出 rollback cutover handoff plans metadata
- `release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json` 必须列出 rollback cutover execution checklists metadata
- `release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json` 必须列出 rollback cutover execution records metadata
- `release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json` 必须列出 rollback cutover outcome reports metadata
- `release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json` 必须列出 rollback cutover publication bundles metadata
- `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json` 必须列出 rollback cutover publication receipt closeout contracts metadata
- `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json` 必须列出 rollback cutover publication receipt settlement closeout metadata
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
- review-only release approval pipeline linking attestation intake, approval orchestration, lifecycle enforcement, rollback settlement closeout, the final release-decision gate, and explicit phase60 operator review loop / reviewer queue / acknowledgement / escalation / closeout artifacts without executing anything
- delivery-chain workspace, stage explorer, review flow ladder, an acceptance reading queue, a reviewer signoff board, a signoff readiness queue, a final review closeout, a pack closeout board, delivery coverage matrix, review-deck coverage routing, review-surface coverage actions, command-surface multi-window review coverage, typed companion review-path orchestration, sequence-aware companion review navigation, delivery-gate companion sequence switching, companion route-history memory, a route replay board, replay scenario packs, a screenshot-driven acceptance review pack, acceptance pass progression, screenshot pass records, capture review flows, a proof-linked evidence bundle, acceptance evidence continuity, reviewer briefs, proof bundles, product-review console polish, an acceptance storyboard, an evidence dossier, an evidence trace lens, an acceptance scoreboard, and a replay acceptance checklist, and the review-deck orchestration action deck linking the operator review board, decision handoff, evidence closeout, promotion readiness, publish decision gates, rollback readiness, blockers, artifact coverage, observability mapping, command-surface review posture, and multi-window coverage into one staged local-only workflow without executing anything
- deeper per-slot trace drill-down with phase stage metadata, linked notes, and cross-linked approval / lifecycle / rollback / release-artifact references
- deeper inspector drilldowns, active flow state, route-aware next-step boards, release-pipeline surfacing, review-posture ownership, and inspector-command linkage
- persisted shell layout foundation backed by localStorage
- cross-window coordination board with explicit window roster, shared-state lanes, orchestration boards, review-posture ownership maps, sync health, ownership, last handoff, route/workspace intent links, focused-slot linkage, command-surface review coverage routing, and local-only blockers
- release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged app materialization skeleton / packaged app directory materialization / packaged app staged output skeleton / packaged app bundle sealing skeleton / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / attestation apply audit packs / attestation apply execution packets / attestation operator worklists / attestation operator dispatch manifests / attestation operator dispatch packets / attestation operator dispatch receipts / attestation operator reconciliation ledgers / attestation operator settlement packs / attestation operator approval routing contracts / attestation operator approval orchestration / operator review board / release decision handoff / review evidence closeout / installer targets / installer-target builder skeleton / installer builder execution skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / promotion execution checkpoints / promotion operator handoff rails / promotion staged-apply ledgers / promotion staged-apply runsheets / promotion staged-apply command sheets / promotion staged-apply confirmation ledgers / promotion staged-apply closeout journals / promotion staged-apply signoff sheets / promotion staged-apply release decision enforcement contracts / promotion staged-apply release decision enforcement lifecycle / signing-ready metadata / signing-publish pipeline / signing-publish gating handshake / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / rollback operator drillbooks / rollback live-readiness contracts / rollback cutover readiness maps / rollback cutover handoff plans / rollback cutover execution checklists / rollback cutover execution records / rollback cutover outcome reports / rollback cutover publication bundles / rollback cutover publication receipt closeout contracts / rollback cutover publication receipt settlement closeout / release approval workflow / release notes / publish gates / promotion gates under release/
- docs closeout: README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README / RELEASE-SUMMARY / REVIEW-MANIFEST / BUNDLE-MATRIX / BUNDLE-ASSEMBLY / PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-MATERIALIZATION-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION / PACKAGED-APP-STAGED-OUTPUT-SKELETON.json / PACKAGED-APP-BUNDLE-SEALING-SKELETON.json / SEALED-BUNDLE-INTEGRITY-CONTRACT.json / INTEGRITY-ATTESTATION-EVIDENCE.json / ATTESTATION-VERIFICATION-PACKS.json / ATTESTATION-APPLY-AUDIT-PACKS.json / ATTESTATION-APPLY-EXECUTION-PACKETS.json / ATTESTATION-OPERATOR-WORKLISTS.json / ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json / ATTESTATION-OPERATOR-DISPATCH-PACKETS.json / ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json / ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json / ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json / ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json / ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json / REVIEW-ONLY-DELIVERY-CHAIN.json / OPERATOR-REVIEW-BOARD.json / RELEASE-DECISION-HANDOFF.json / REVIEW-EVIDENCE-CLOSEOUT.json / INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON / INSTALLER-BUILDER-EXECUTION-SKELETON / INSTALLER-BUILDER-ORCHESTRATION.json / INSTALLER-CHANNEL-ROUTING.json / CHANNEL-PROMOTION-EVIDENCE.json / PROMOTION-APPLY-READINESS.json / PROMOTION-APPLY-MANIFESTS.json / PROMOTION-EXECUTION-CHECKPOINTS.json / PROMOTION-OPERATOR-HANDOFF-RAILS.json / PROMOTION-STAGED-APPLY-LEDGERS.json / PROMOTION-STAGED-APPLY-RUNSHEETS.json / PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json / PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json / PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json / PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json / SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE / SIGNING-PUBLISH-GATING-HANDSHAKE / SIGNING-PUBLISH-APPROVAL-BRIDGE.json / SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json / PUBLISH-ROLLBACK-HANDSHAKE.json / ROLLBACK-RECOVERY-LEDGER.json / ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json / ROLLBACK-OPERATOR-DRILLBOOKS.json / ROLLBACK-LIVE-READINESS-CONTRACTS.json / ROLLBACK-CUTOVER-READINESS-MAPS.json / ROLLBACK-CUTOVER-HANDOFF-PLANS.json / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json / ROLLBACK-CUTOVER-EXECUTION-RECORDS.json / ROLLBACK-CUTOVER-OUTCOME-REPORTS.json / ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json / RELEASE-APPROVAL-WORKFLOW / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES
- placeholder installer explainer script that never installs anything

## Still Blocked For Formal Installer

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

## Safety Boundaries

- real host-side execution remains disabled
- no ~/.openclaw writes
- no services / install / config mutation
- no external connector process control
