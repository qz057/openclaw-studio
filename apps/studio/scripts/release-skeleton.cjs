const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { getPaths, getPreflightSummary } = require("./studio-preflight.cjs");

const APP_NAME = "OpenClaw Studio";
const PHASE_ID = "phase60";
const PHASE_TITLE = "Phase60";
const PHASE_MILESTONE =
  "phase60 delivery-chain workspace / stage explorer / review flow ladder / delivery coverage matrix / review-deck coverage routing / review-deck orchestration deck / command-surface action-deck coverage / review-surface coverage actions / review-surface navigator / review-surface multi-window coverage / typed companion review-path orchestration / sequence-aware companion review navigation / delivery-gate companion sequence switching / companion route-history memory / route replay board / replay scenario packs / acceptance pass surface / screenshot review metadata / replay acceptance checklist / command-surface observability linkage / linked review artifacts / blockers / handoff posture / observability mapping / review-only delivery chain / operator review loop / local-only multi-window shared-state review surface / docs / smoke / package / release-plan / UI / shared data closeout";
const RELEASE_CHANNEL = "alpha";
const PACKAGE_ID = "openclaw-studio-alpha-shell";
const PACKAGE_KIND = "alpha-shell-release-skeleton";
const REQUIRED_RELEASE_COMMANDS = [
  "npm run typecheck",
  "npm run build",
  "npm run smoke",
  "npm run start:smoke",
  "npm run package:alpha",
  "npm run release:plan"
];
const OPTIONAL_RELEASE_COMMANDS = [];
const CURRENT_DELIVERY_SURFACES = [
  "structured alpha-shell snapshot under delivery/openclaw-studio-alpha-shell",
  "built renderer bundle copied into artifacts/renderer",
  "built Electron bundle copied into artifacts/electron",
  "review-only release approval pipeline linking attestation intake, approval orchestration, lifecycle enforcement, rollback settlement closeout, the final release-decision gate, and explicit phase60 operator review loop / reviewer queue / acknowledgement / escalation / closeout artifacts without executing anything",
  "delivery-chain workspace, stage explorer, review flow ladder, delivery coverage matrix, review-deck coverage routing, review-surface coverage actions, command-surface multi-window review coverage, typed companion review-path orchestration, sequence-aware companion review navigation, delivery-gate companion sequence switching, companion route-history memory, a route replay board, replay scenario packs, an acceptance-pass surface, screenshot review metadata, a replay acceptance checklist, and the review-deck orchestration action deck linking the operator review board, decision handoff, evidence closeout, promotion readiness, publish decision gates, rollback readiness, blockers, artifact coverage, observability mapping, command-surface review posture, and multi-window coverage into one staged local-only workflow without executing anything",
  "deeper per-slot trace drill-down with phase stage metadata, linked notes, and cross-linked approval / lifecycle / rollback / release-artifact references",
  "deeper inspector drilldowns, active flow state, route-aware next-step boards, release-pipeline surfacing, review-posture ownership, and inspector-command linkage",
  "persisted shell layout foundation backed by localStorage",
  "cross-window coordination board with explicit window roster, shared-state lanes, orchestration boards, review-posture ownership maps, sync health, ownership, last handoff, route/workspace intent links, focused-slot linkage, command-surface review coverage routing, and local-only blockers",
  "release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged app materialization skeleton / packaged app directory materialization / packaged app staged output skeleton / packaged app bundle sealing skeleton / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / attestation apply audit packs / attestation apply execution packets / attestation operator worklists / attestation operator dispatch manifests / attestation operator dispatch packets / attestation operator dispatch receipts / attestation operator reconciliation ledgers / attestation operator settlement packs / attestation operator approval routing contracts / attestation operator approval orchestration / operator review board / release decision handoff / review evidence closeout / installer targets / installer-target builder skeleton / installer builder execution skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / promotion execution checkpoints / promotion operator handoff rails / promotion staged-apply ledgers / promotion staged-apply runsheets / promotion staged-apply command sheets / promotion staged-apply confirmation ledgers / promotion staged-apply closeout journals / promotion staged-apply signoff sheets / promotion staged-apply release decision enforcement contracts / promotion staged-apply release decision enforcement lifecycle / signing-ready metadata / signing-publish pipeline / signing-publish gating handshake / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / rollback operator drillbooks / rollback live-readiness contracts / rollback cutover readiness maps / rollback cutover handoff plans / rollback cutover execution checklists / rollback cutover execution records / rollback cutover outcome reports / rollback cutover publication bundles / rollback cutover publication receipt closeout contracts / rollback cutover publication receipt settlement closeout / release approval workflow / release notes / publish gates / promotion gates under release/",
  "docs closeout: README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README / RELEASE-SUMMARY / REVIEW-MANIFEST / BUNDLE-MATRIX / BUNDLE-ASSEMBLY / PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-MATERIALIZATION-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION / PACKAGED-APP-STAGED-OUTPUT-SKELETON.json / PACKAGED-APP-BUNDLE-SEALING-SKELETON.json / SEALED-BUNDLE-INTEGRITY-CONTRACT.json / INTEGRITY-ATTESTATION-EVIDENCE.json / ATTESTATION-VERIFICATION-PACKS.json / ATTESTATION-APPLY-AUDIT-PACKS.json / ATTESTATION-APPLY-EXECUTION-PACKETS.json / ATTESTATION-OPERATOR-WORKLISTS.json / ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json / ATTESTATION-OPERATOR-DISPATCH-PACKETS.json / ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json / ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json / ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json / ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json / ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json / REVIEW-ONLY-DELIVERY-CHAIN.json / OPERATOR-REVIEW-BOARD.json / RELEASE-DECISION-HANDOFF.json / REVIEW-EVIDENCE-CLOSEOUT.json / INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON / INSTALLER-BUILDER-EXECUTION-SKELETON / INSTALLER-BUILDER-ORCHESTRATION.json / INSTALLER-CHANNEL-ROUTING.json / CHANNEL-PROMOTION-EVIDENCE.json / PROMOTION-APPLY-READINESS.json / PROMOTION-APPLY-MANIFESTS.json / PROMOTION-EXECUTION-CHECKPOINTS.json / PROMOTION-OPERATOR-HANDOFF-RAILS.json / PROMOTION-STAGED-APPLY-LEDGERS.json / PROMOTION-STAGED-APPLY-RUNSHEETS.json / PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json / PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json / PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json / PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json / SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE / SIGNING-PUBLISH-GATING-HANDSHAKE / SIGNING-PUBLISH-APPROVAL-BRIDGE.json / SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json / PUBLISH-ROLLBACK-HANDSHAKE.json / ROLLBACK-RECOVERY-LEDGER.json / ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json / ROLLBACK-OPERATOR-DRILLBOOKS.json / ROLLBACK-LIVE-READINESS-CONTRACTS.json / ROLLBACK-CUTOVER-READINESS-MAPS.json / ROLLBACK-CUTOVER-HANDOFF-PLANS.json / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json / ROLLBACK-CUTOVER-EXECUTION-RECORDS.json / ROLLBACK-CUTOVER-OUTCOME-REPORTS.json / ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json / RELEASE-APPROVAL-WORKFLOW / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES",
  "placeholder installer explainer script that never installs anything"
];
const FORMAL_INSTALLER_GAPS = [
  "no packaged per-OS staged output materialization yet; staged outputs remain review-only metadata",
  "no packaged per-OS bundle sealing yet; sealing remains review-only metadata",
  "no per-platform sealed-bundle integrity attestation or digest publication yet; integrity contract remains review-only metadata",
  "no attestation verification pack emission or verifier handoff yet; verification packs remain review-only metadata",
  "no executable attestation apply audit or apply-execution packet handoff yet; audit packs and execution packets remain review-only metadata",
  "no executable attestation operator dispatch or live dispatch-manifest apply yet; operator worklists and dispatch manifests remain review-only metadata",
  "no executable attestation operator dispatch packet emission, receipt capture, or acknowledgement reconciliation yet; dispatch packets remain review-only metadata",
  "no executable attestation operator dispatch receipt capture, acknowledgement reconciliation closeout, or escalation settlement yet; dispatch receipts remain review-only metadata",
  "no executable attestation operator reconciliation settlement, escalation clear, or approval-ready closeout yet; reconciliation ledgers remain review-only metadata",
  "no executable attestation operator settlement pack assembly, operator clearance routing, or approval attachment emission yet; settlement packs remain review-only metadata",
  "no executable attestation operator approval routing contract issuance, reviewer queue routing, or approval handoff declaration yet; approval routing contracts remain review-only metadata",
  "no executable attestation operator approval orchestration queueing, reviewer baton sequencing, or approval orchestration closeout yet; approval orchestration remains review-only metadata",
  "no Windows / macOS / Linux installer builder orchestration and channel routing wiring yet; routing remains review-only skeleton",
  "no executable channel promotion evidence pack or promotion routing apply yet; evidence remains review-only metadata",
  "no executable promotion apply manifests or channel apply execution yet; apply manifests remain review-only metadata",
  "no executable promotion execution checkpoints or operator handoff rails yet; checkpoints and handoff rails remain review-only metadata",
  "no executable promotion staged-apply journaling, operator runsheet entry, or staged cutover entry yet; staged-apply ledgers and runsheets remain review-only metadata",
  "no executable promotion staged-apply command issue, confirmation capture, or staged execution sheet routing yet; command sheets remain review-only metadata",
  "no executable promotion staged-apply confirmation capture, stage acceptance journaling, or cutover closeout reconciliation yet; confirmation ledgers remain review-only metadata",
  "no executable promotion staged-apply closeout sealing, recovery baton handoff, or publish-ready closeout yet; closeout journals remain review-only metadata",
  "no executable promotion staged-apply signoff capture, approver expiry enforcement, or release-ready signoff emission yet; signoff sheets remain review-only metadata",
  "no executable promotion staged release decision enforcement issuance, staged go/no-go guard locking, or publish-route enforcement yet; release decision enforcement contracts remain review-only metadata",
  "no executable promotion staged release decision enforcement lifecycle advancement, expiry closeout, or lifecycle baton transfer yet; release decision enforcement lifecycle remains review-only metadata",
  "no signing / notarization / hash publication workflow yet; approval bridge remains metadata-only",
  "no executable signing-publish gating handshake yet; handshake remains metadata-only",
  "no executable release approval pipeline approval handoff, reviewer quorum, or final release-decision gate yet; workflow remains metadata-only",
  "no rollback execution rehearsal or rollback apply automation yet; rehearsal ledger remains review-only metadata",
  "no rollback operator drillbooks or live-readiness contracts yet; drillbooks and live-readiness contracts remain review-only metadata",
  "no executable rollback cutover readiness evaluation, ownership baton transfer, or cutover topology handoff yet; cutover readiness maps and handoff plans remain review-only metadata",
  "no executable rollback cutover checklist issue, go/no-go capture, or cutover execution receipt yet; execution checklists remain review-only metadata",
  "no executable rollback cutover execution record emission, evidence closeout, or recovery-state publication yet; execution records remain review-only metadata",
  "no executable rollback cutover outcome publication, recovery digest seal, or rollback release report emission yet; outcome reports remain review-only metadata",
  "no executable rollback cutover publication bundle assembly, release-note attachment, or publication handoff yet; publication bundles remain review-only metadata",
  "no executable rollback cutover publication receipt closeout contract issuance, closeout acknowledgement sealing, or publication receipt closeout routing yet; publication receipt closeout contracts remain review-only metadata",
  "no executable rollback cutover publication receipt settlement closeout issuance, settlement ledger sealing, or receipt recovery closeout routing yet; receipt settlement closeout remains review-only metadata",
  "no release publishing / artifact upload / promotion handshake / rollback apply automation yet; publish rollback handshake remains metadata-only",
  "real host-side execution remains disabled until the review-only approval / lifecycle / rollback loop becomes executable end-to-end"
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
  "turn integrity attestation evidence into per-platform attestation packets only after bundle integrity contracts and digest sources are reviewable end-to-end",
  "turn attestation verification packs into explicit verifier-ready bundles and audit handoff payloads without executing any live verifier yet",
  "turn attestation apply audit packs into explicit apply-audit bundles and review handoff payloads only after verification packs and promotion manifests are linked end-to-end",
  "turn attestation apply execution packets from metadata into operator-reviewed apply envelopes only after apply-audit packs and promotion execution checkpoints are linked end-to-end",
  "turn attestation operator worklists into explicit per-role review queues, packet ownership, and receipt slots only after execution packets and staged apply ledgers are reviewable end-to-end",
  "turn attestation operator dispatch manifests into guarded dispatch envelopes, acknowledgement deadlines, and escalation routes only after worklists, staged-apply runsheets, and rollback handoff plans are reviewable end-to-end",
  "turn attestation operator dispatch packets into role-targeted packet bundles, receipt slots, and acknowledgement payload stubs only after dispatch manifests, staged-apply command sheets, and rollback execution checklists are reviewable end-to-end",
  "turn attestation operator dispatch receipts into operator acknowledgement capture, reconciliation ledgers, and escalation closeout records only after dispatch packets, staged-apply confirmation ledgers, and rollback execution records are reviewable end-to-end",
  "turn attestation operator reconciliation ledgers into operator settlement packs, escalation disposition envelopes, and signoff-ready handoff evidence only after dispatch receipts, staged-apply closeout journals, and rollback outcome reports are reviewable end-to-end",
  "turn attestation operator settlement packs into explicit operator clearance packets, gating handoff bundles, and release approval attachments only after staged-apply signoff sheets and rollback publication bundles are reviewable end-to-end",
  "turn attestation operator approval routing contracts into reviewer-ready routing tables, approval windows, and approval handoff routes only after settlement packs, staged release decision enforcement contracts, and publication receipt closeout contracts are reviewable end-to-end",
  "turn attestation operator approval orchestration into reviewer baton sequencing, approval quorum timing, and orchestration closeout paths only after approval routing contracts, decision enforcement lifecycle, and receipt settlement closeout are reviewable end-to-end",
  "turn installer builder orchestration metadata into real per-platform builder wiring without leaving local-only review mode first",
  "turn installer channel routing metadata into explicit alpha/beta/stable routing manifests only after builder execution, approval, and rollback are reviewable end-to-end",
  "turn channel promotion evidence metadata into explicit promotion packets only after upload, approval, and rollback evidence exist together",
  "turn promotion apply readiness metadata into explicit channel apply preflight manifests only after promotion evidence and rollback planning are reviewable end-to-end",
  "turn promotion apply manifests from metadata into gated channel apply payloads only after upload, approval, and rollback evidence exist together",
  "turn promotion execution checkpoints from metadata into guarded checkpoint contracts only after upload, approval, rollback, and operator handoff rails are reviewable end-to-end",
  "turn promotion operator handoff rails into explicit operator routing rails only after execution packets, checkpoints, and rollback live-readiness contracts are reviewable end-to-end",
  "turn promotion staged-apply ledgers into guarded stage-by-stage apply journals only after operator worklists, handoff rails, and rollback cutover readiness maps are reviewable end-to-end",
  "turn promotion staged-apply runsheets into operator-ready stage sequencing, freeze holds, and cutover baton scripts only after dispatch manifests, staged-apply ledgers, and rollback handoff plans are reviewable end-to-end",
  "turn promotion staged-apply command sheets into gated stage commands, confirmation blocks, and receipt stubs only after dispatch packets, staged-apply runsheets, and rollback execution checklists are reviewable end-to-end",
  "turn promotion staged-apply confirmation ledgers into stage acceptance journals, cutover confirmation ledgers, and receipt reconciliation anchors only after dispatch receipts, command sheets, and rollback execution records are reviewable end-to-end",
  "turn promotion staged-apply closeout journals into staged-apply signoff sheets, approver expiry tracks, and release-ready handoff journals only after reconciliation ledgers, settlement packs, and rollback outcome reports are reviewable end-to-end",
  "turn promotion staged-apply signoff sheets into explicit release signoff packets, promotion go/no-go sheets, and publish gate attachments only after settlement packs, publication bundles, and approval workflows are reviewable end-to-end",
  "turn promotion staged-apply release decision enforcement contracts into staged release guardrails, enforcement windows, and publish-route contracts only after approval routing contracts, signoff sheets, and publication receipt closeout contracts are reviewable end-to-end",
  "turn promotion staged-apply release decision enforcement lifecycle into lifecycle checkpoints, reviewer baton transitions, and expiry closeout only after approval orchestration, release decision enforcement contracts, and receipt settlement closeout are reviewable end-to-end",
  "add signing-ready metadata / signing-publish pipeline / signing-publish approval bridge / notarization / checksum publishing",
  "turn the signing-publish gating handshake from metadata into an executable review gate only after approval / lifecycle / rollback are real",
  "turn the signing-publish promotion handshake from metadata into a gated promotion contract only after upload, approval, and rollback are real",
  "turn the publish rollback handshake from metadata into an executable rollback path only after publish lifecycle and recovery checkpoints are real",
  "turn rollback recovery ledgers into explicit operator recovery ledgers only after publish rollback checkpoints are reviewable end-to-end",
  "turn rollback execution rehearsal ledgers into reviewable rehearsal runs only after rollback checkpoints, apply manifests, and recovery channels are reviewable end-to-end",
  "turn rollback operator drillbooks into explicit operator response drillbooks only after rollback checkpoints, rehearsal ledgers, and live-readiness contracts are reviewable end-to-end",
  "turn rollback live-readiness contracts into executable live-entry checks only after rollback drillbooks, publish rollback paths, and approval are real",
  "turn rollback cutover readiness maps into executable cutover go/no-go topology only after live-readiness contracts, staged-apply ledgers, and publish rollback paths are reviewable end-to-end",
  "turn rollback cutover handoff plans into executable owner baton transfers, fallback paths, and recovery notifications only after cutover readiness maps, staged-apply runsheets, and publish rollback paths are reviewable end-to-end",
  "turn rollback cutover execution checklists into gated cutover go/no-go sheets, confirmation capture, and rollback receipt stubs only after handoff plans, publish rollback paths, and promotion command sheets are reviewable end-to-end",
  "turn rollback cutover execution records into evidence-backed cutover closeout records, recovery-state publications, and rollback receipt links only after execution checklists, staged-apply confirmation ledgers, and publish rollback paths are reviewable end-to-end",
  "turn rollback cutover outcome reports into rollback cutover publication bundles, recovery digests, and release-facing closeout bundles only after execution records, staged-apply closeout journals, and settlement packs are reviewable end-to-end",
  "turn rollback cutover publication bundles into explicit release-note attachments, publish handoff packets, and rollback publication evidence only after staged-apply signoff sheets, publish gates, and release notes are reviewable end-to-end",
  "turn rollback cutover publication receipt closeout contracts into closeout acknowledgements, publication-closeout contracts, and rollback recovery evidence only after publication bundles, approval routing contracts, and staged release decision enforcement contracts are reviewable end-to-end",
  "turn rollback cutover publication receipt settlement closeout into settlement ledgers, receipt closeout acknowledgements, and recovery-ready closeout evidence only after publication receipt closeout contracts, approval orchestration, and decision enforcement lifecycle are reviewable end-to-end",
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
  "release/INTEGRITY-ATTESTATION-EVIDENCE.json",
  "release/ATTESTATION-VERIFICATION-PACKS.json",
  "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
  "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
  "release/ATTESTATION-OPERATOR-WORKLISTS.json",
  "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
  "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
  "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
  "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
  "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
  "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
  "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
  "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
  "release/OPERATOR-REVIEW-BOARD.json",
  "release/RELEASE-DECISION-HANDOFF.json",
  "release/REVIEW-EVIDENCE-CLOSEOUT.json",
  "release/INSTALLER-TARGETS.json",
  "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
  "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
  "release/INSTALLER-BUILDER-ORCHESTRATION.json",
  "release/INSTALLER-CHANNEL-ROUTING.json",
  "release/CHANNEL-PROMOTION-EVIDENCE.json",
  "release/PROMOTION-APPLY-READINESS.json",
  "release/PROMOTION-APPLY-MANIFESTS.json",
  "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
  "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
  "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
  "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
  "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
  "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
  "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
  "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
  "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
  "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
  "release/SIGNING-METADATA.json",
  "release/NOTARIZATION-PLAN.json",
  "release/SIGNING-PUBLISH-PIPELINE.json",
  "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
  "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
  "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
  "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
  "release/ROLLBACK-RECOVERY-LEDGER.json",
  "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
  "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
  "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
  "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
  "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
  "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
  "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
  "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
  "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
  "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
  "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
  "integrity-attestation-evidence",
  "attestation-verification-packs",
  "attestation-apply-audit-packs",
  "attestation-apply-execution-packets",
  "attestation-operator-worklists",
  "attestation-operator-dispatch-manifests",
  "attestation-operator-dispatch-packets",
  "attestation-operator-dispatch-receipts",
  "attestation-operator-reconciliation-ledgers",
  "attestation-operator-settlement-packs",
  "attestation-operator-approval-routing-contracts",
  "attestation-operator-approval-orchestration",
  "review-only-delivery-chain",
  "operator-review-board",
  "release-decision-handoff",
  "review-evidence-closeout",
  "installer-target-metadata",
  "installer-target-builder-skeleton",
  "installer-builder-execution-skeleton",
  "installer-builder-orchestration",
  "installer-channel-routing",
  "channel-promotion-evidence",
  "promotion-apply-readiness",
  "promotion-apply-manifests",
  "promotion-execution-checkpoints",
  "promotion-operator-handoff-rails",
  "promotion-staged-apply-ledgers",
  "promotion-staged-apply-runsheets",
  "promotion-staged-apply-command-sheets",
  "promotion-staged-apply-confirmation-ledgers",
  "promotion-staged-apply-closeout-journals",
  "promotion-staged-apply-signoff-sheets",
  "promotion-staged-apply-release-decision-enforcement-contracts",
  "promotion-staged-apply-release-decision-enforcement-lifecycle",
  "signing-ready-metadata",
  "signing-publish-pipeline-skeleton",
  "signing-publish-gating-handshake",
  "signing-publish-approval-bridge",
  "signing-publish-promotion-handshake",
  "publish-rollback-handshake",
  "rollback-recovery-ledger",
  "rollback-execution-rehearsal-ledger",
  "rollback-operator-drillbooks",
  "rollback-live-readiness-contracts",
  "rollback-cutover-readiness-maps",
  "rollback-cutover-handoff-plans",
  "rollback-cutover-execution-checklists",
  "rollback-cutover-execution-records",
  "rollback-cutover-outcome-reports",
  "rollback-cutover-publication-bundles",
  "rollback-cutover-publication-receipt-closeout-contracts",
  "rollback-cutover-publication-receipt-settlement-closeout",
  "approval-workflow-skeleton",
  "notarization-blocked",
  "promotion-gated"
];
const REVIEW_STAGE_ID = "review-only-release-approval-pipeline-skeleton";
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
      "Manifest, build metadata, attestation verification packs, attestation apply audit packs, attestation apply execution packets, attestation operator worklists, attestation operator dispatch manifests, attestation operator dispatch packets, attestation operator dispatch receipts, attestation operator reconciliation ledgers, attestation operator settlement packs, attestation operator approval routing contracts, attestation operator approval orchestration, operator review board, release decision handoff, review evidence closeout, promotion apply manifests, promotion execution checkpoints, promotion operator handoff rails, promotion staged-apply ledgers, promotion staged-apply runsheets, promotion staged-apply command sheets, promotion staged-apply confirmation ledgers, promotion staged-apply closeout journals, promotion staged-apply signoff sheets, promotion staged-apply release decision enforcement contracts, promotion staged-apply release decision enforcement lifecycle, rollback rehearsal ledgers, rollback operator drillbooks, rollback live-readiness contracts, rollback cutover readiness maps, rollback cutover handoff plans, rollback cutover execution checklists, rollback cutover execution records, rollback cutover outcome reports, rollback cutover publication bundles, rollback cutover publication receipt closeout contracts, rollback cutover publication receipt settlement closeout, packaged app directory skeletons, signing/publish handshake metadata, installer targets, approval workflow, installer placeholder contract, and release checklist."
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
      id: "integrity-attestation-evidence",
      label: "Integrity attestation evidence",
      outputPath: "release/INTEGRITY-ATTESTATION-EVIDENCE.json",
      generated: true
    },
    {
      id: "attestation-verification-packs",
      label: "Attestation verification packs",
      outputPath: "release/ATTESTATION-VERIFICATION-PACKS.json",
      generated: true
    },
    {
      id: "attestation-apply-audit-packs",
      label: "Attestation apply audit packs",
      outputPath: "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
      generated: true
    },
    {
      id: "attestation-apply-execution-packets",
      label: "Attestation apply execution packets",
      outputPath: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
      generated: true
    },
    {
      id: "attestation-operator-worklists",
      label: "Attestation operator worklists",
      outputPath: "release/ATTESTATION-OPERATOR-WORKLISTS.json",
      generated: true
    },
    {
      id: "attestation-operator-dispatch-manifests",
      label: "Attestation operator dispatch manifests",
      outputPath: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
      generated: true
    },
    {
      id: "attestation-operator-dispatch-packets",
      label: "Attestation operator dispatch packets",
      outputPath: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
      generated: true
    },
    {
      id: "attestation-operator-dispatch-receipts",
      label: "Attestation operator dispatch receipts",
      outputPath: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
      generated: true
    },
    {
      id: "attestation-operator-reconciliation-ledgers",
      label: "Attestation operator reconciliation ledgers",
      outputPath: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
      generated: true
    },
    {
      id: "attestation-operator-settlement-packs",
      label: "Attestation operator settlement packs",
      outputPath: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
      generated: true
    },
    {
      id: "attestation-operator-approval-routing-contracts",
      label: "Attestation operator approval routing contracts",
      outputPath: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
      generated: true
    },
    {
      id: "attestation-operator-approval-orchestration",
      label: "Attestation operator approval orchestration",
      outputPath: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
      generated: true
    },
    {
      id: "review-only-delivery-chain",
      label: "Delivery-chain workspace",
      outputPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
      generated: true
    },
    {
      id: "operator-review-board",
      label: "Operator review board",
      outputPath: "release/OPERATOR-REVIEW-BOARD.json",
      generated: true
    },
    {
      id: "release-decision-handoff",
      label: "Release decision handoff",
      outputPath: "release/RELEASE-DECISION-HANDOFF.json",
      generated: true
    },
    {
      id: "review-evidence-closeout",
      label: "Review evidence closeout",
      outputPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json",
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
      id: "promotion-apply-readiness",
      label: "Promotion apply readiness",
      outputPath: "release/PROMOTION-APPLY-READINESS.json",
      generated: true
    },
    {
      id: "promotion-apply-manifests",
      label: "Promotion apply manifests",
      outputPath: "release/PROMOTION-APPLY-MANIFESTS.json",
      generated: true
    },
    {
      id: "promotion-execution-checkpoints",
      label: "Promotion execution checkpoints",
      outputPath: "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
      generated: true
    },
    {
      id: "promotion-operator-handoff-rails",
      label: "Promotion operator handoff rails",
      outputPath: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-ledgers",
      label: "Promotion staged-apply ledgers",
      outputPath: "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-runsheets",
      label: "Promotion staged-apply runsheets",
      outputPath: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-command-sheets",
      label: "Promotion staged-apply command sheets",
      outputPath: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-confirmation-ledgers",
      label: "Promotion staged-apply confirmation ledgers",
      outputPath: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-closeout-journals",
      label: "Promotion staged-apply closeout journals",
      outputPath: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-signoff-sheets",
      label: "Promotion staged-apply signoff sheets",
      outputPath: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-release-decision-enforcement-contracts",
      label: "Promotion staged-apply release decision enforcement contracts",
      outputPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
      generated: true
    },
    {
      id: "promotion-staged-apply-release-decision-enforcement-lifecycle",
      label: "Promotion staged-apply release decision enforcement lifecycle",
      outputPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
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
      id: "rollback-recovery-ledger",
      label: "Rollback recovery ledger",
      outputPath: "release/ROLLBACK-RECOVERY-LEDGER.json",
      generated: true
    },
    {
      id: "rollback-execution-rehearsal-ledger",
      label: "Rollback execution rehearsal ledger",
      outputPath: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
      generated: true
    },
    {
      id: "rollback-operator-drillbooks",
      label: "Rollback operator drillbooks",
      outputPath: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
      generated: true
    },
    {
      id: "rollback-live-readiness-contracts",
      label: "Rollback live-readiness contracts",
      outputPath: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
      generated: true
    },
    {
      id: "rollback-cutover-readiness-maps",
      label: "Rollback cutover readiness maps",
      outputPath: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
      generated: true
    },
    {
      id: "rollback-cutover-handoff-plans",
      label: "Rollback cutover handoff plans",
      outputPath: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
      generated: true
    },
    {
      id: "rollback-cutover-execution-checklists",
      label: "Rollback cutover execution checklists",
      outputPath: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
      generated: true
    },
    {
      id: "rollback-cutover-execution-records",
      label: "Rollback cutover execution records",
      outputPath: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
      generated: true
    },
    {
      id: "rollback-cutover-outcome-reports",
      label: "Rollback cutover outcome reports",
      outputPath: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
      generated: true
    },
    {
      id: "rollback-cutover-publication-bundles",
      label: "Rollback cutover publication bundles",
      outputPath: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
      generated: true
    },
    {
      id: "rollback-cutover-publication-receipt-closeout-contracts",
      label: "Rollback cutover publication receipt closeout contracts",
      outputPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
      generated: true
    },
    {
      id: "rollback-cutover-publication-receipt-settlement-closeout",
      label: "Rollback cutover publication receipt settlement closeout",
      outputPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
    "    INTEGRITY-ATTESTATION-EVIDENCE.json",
    "    ATTESTATION-VERIFICATION-PACKS.json",
    "    ATTESTATION-APPLY-AUDIT-PACKS.json",
    "    ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    "    ATTESTATION-OPERATOR-WORKLISTS.json",
    "    ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    "    ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    "    ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    "    ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    "    ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    "    ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    "    ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    "    REVIEW-ONLY-DELIVERY-CHAIN.json",
    "    OPERATOR-REVIEW-BOARD.json",
    "    RELEASE-DECISION-HANDOFF.json",
    "    REVIEW-EVIDENCE-CLOSEOUT.json",
    "    INSTALLER-TARGETS.json",
    "    INSTALLER-TARGET-BUILDER-SKELETON.json",
    "    INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    "    INSTALLER-BUILDER-ORCHESTRATION.json",
    "    INSTALLER-CHANNEL-ROUTING.json",
    "    CHANNEL-PROMOTION-EVIDENCE.json",
    "    PROMOTION-APPLY-READINESS.json",
    "    PROMOTION-APPLY-MANIFESTS.json",
    "    PROMOTION-EXECUTION-CHECKPOINTS.json",
    "    PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    "    PROMOTION-STAGED-APPLY-LEDGERS.json",
    "    PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    "    PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    "    PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    "    PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    "    PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    "    PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    "    PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    "    SIGNING-METADATA.json",
    "    NOTARIZATION-PLAN.json",
    "    SIGNING-PUBLISH-PIPELINE.json",
    "    SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    "    SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    "    SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    "    PUBLISH-ROLLBACK-HANDSHAKE.json",
    "    ROLLBACK-RECOVERY-LEDGER.json",
    "    ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
    "    ROLLBACK-OPERATOR-DRILLBOOKS.json",
    "    ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    "    ROLLBACK-CUTOVER-READINESS-MAPS.json",
    "    ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    "    ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    "    ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    "    ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    "    ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    "    ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    "    ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
    `# OpenClaw Studio ${PHASE_TITLE} Package Snapshot`,
    "",
    `这是一个 **${PHASE_ID} alpha-shell release skeleton**，在 phase26/27/28/29/30/31/32/33/34/35/36/37/38/39/40/42/43/44/45/46/47/48/49/50/51/52/53/54/55/56/57/58 packaging 与 shell foundations 的基础上，把 local-only multi-window orchestration、cross-window shared-state review surface、以及 review-only release approval pipeline 继续推进成更明确的 Delivery-chain Workspace / Stage Explorer / artifact coverage / blockers / handoff posture / observability mapping 审阅壳，但它依然 **不是 installer**。`,
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
    "- 再看 `release/INTEGRITY-ATTESTATION-EVIDENCE.json`",
    "- 再看 `release/ATTESTATION-VERIFICATION-PACKS.json`",
    "- 再看 `release/ATTESTATION-APPLY-AUDIT-PACKS.json`",
    "- 再看 `release/ATTESTATION-APPLY-EXECUTION-PACKETS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-WORKLISTS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json`",
    "- 再看 `release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json`",
    "- 再看 `release/REVIEW-ONLY-DELIVERY-CHAIN.json`",
    "- 再看 `release/OPERATOR-REVIEW-BOARD.json`",
    "- 再看 `release/RELEASE-DECISION-HANDOFF.json`",
    "- 再看 `release/REVIEW-EVIDENCE-CLOSEOUT.json`",
    "- 再看 `release/INSTALLER-TARGETS.json`",
    "- 再看 `release/INSTALLER-TARGET-BUILDER-SKELETON.json`",
    "- 再看 `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json`",
    "- 再看 `release/INSTALLER-BUILDER-ORCHESTRATION.json`",
    "- 再看 `release/INSTALLER-CHANNEL-ROUTING.json`",
    "- 再看 `release/CHANNEL-PROMOTION-EVIDENCE.json`",
    "- 再看 `release/PROMOTION-APPLY-READINESS.json`",
    "- 再看 `release/PROMOTION-APPLY-MANIFESTS.json`",
    "- 再看 `release/PROMOTION-EXECUTION-CHECKPOINTS.json`",
    "- 再看 `release/PROMOTION-OPERATOR-HANDOFF-RAILS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-LEDGERS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-RUNSHEETS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json`",
    "- 再看 `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json`",
    "- 再看 `release/SIGNING-METADATA.json`",
    "- 再看 `release/NOTARIZATION-PLAN.json`",
    "- 再看 `release/SIGNING-PUBLISH-PIPELINE.json`",
    "- 再看 `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json`",
    "- 再看 `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json`",
    "- 再看 `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json`",
    "- 再看 `release/PUBLISH-ROLLBACK-HANDSHAKE.json`",
    "- 再看 `release/ROLLBACK-RECOVERY-LEDGER.json`",
    "- 再看 `release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json`",
    "- 再看 `release/ROLLBACK-OPERATOR-DRILLBOOKS.json`",
    "- 再看 `release/ROLLBACK-LIVE-READINESS-CONTRACTS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-READINESS-MAPS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json`",
    "- 再看 `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json`",
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
    `# OpenClaw Studio ${PHASE_TITLE} Release Checklist`,
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
    "- `release/INTEGRITY-ATTESTATION-EVIDENCE.json` 必须列出 integrity attestation evidence",
    "- `release/ATTESTATION-VERIFICATION-PACKS.json` 必须列出 attestation verification packs",
    "- `release/ATTESTATION-APPLY-AUDIT-PACKS.json` 必须列出 attestation apply audit packs metadata",
    "- `release/ATTESTATION-APPLY-EXECUTION-PACKETS.json` 必须列出 attestation apply execution packets metadata",
    "- `release/ATTESTATION-OPERATOR-WORKLISTS.json` 必须列出 attestation operator worklists metadata",
    "- `release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json` 必须列出 attestation operator dispatch manifests metadata",
    "- `release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json` 必须列出 attestation operator dispatch packets metadata",
    "- `release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json` 必须列出 attestation operator dispatch receipts metadata",
    "- `release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json` 必须列出 attestation operator reconciliation ledgers metadata",
    "- `release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json` 必须列出 attestation operator settlement packs metadata",
    "- `release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json` 必须列出 attestation operator approval routing contracts metadata",
    "- `release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json` 必须列出 attestation operator approval orchestration metadata",
    "- `release/REVIEW-ONLY-DELIVERY-CHAIN.json` 必须列出 delivery-chain workspace / stage explorer / review-surface navigator / multi-window review coverage / companion review-path orchestration metadata",
    "- `release/OPERATOR-REVIEW-BOARD.json` 必须列出 operator review board metadata",
    "- `release/RELEASE-DECISION-HANDOFF.json` 必须列出 release decision handoff metadata",
    "- `release/REVIEW-EVIDENCE-CLOSEOUT.json` 必须列出 review evidence closeout metadata",
    "- `release/INSTALLER-TARGETS.json` 必须列出 installer target metadata",
    "- `release/INSTALLER-TARGET-BUILDER-SKELETON.json` 必须列出 installer-target builder skeleton",
    "- `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json` 必须列出 installer builder execution skeleton",
    "- `release/INSTALLER-BUILDER-ORCHESTRATION.json` 必须列出 installer builder orchestration metadata",
    "- `release/INSTALLER-CHANNEL-ROUTING.json` 必须列出 installer channel routing metadata",
    "- `release/CHANNEL-PROMOTION-EVIDENCE.json` 必须列出 channel promotion evidence metadata",
    "- `release/PROMOTION-APPLY-READINESS.json` 必须列出 promotion apply readiness metadata",
    "- `release/PROMOTION-APPLY-MANIFESTS.json` 必须列出 promotion apply manifests metadata",
    "- `release/PROMOTION-EXECUTION-CHECKPOINTS.json` 必须列出 promotion execution checkpoints metadata",
    "- `release/PROMOTION-OPERATOR-HANDOFF-RAILS.json` 必须列出 promotion operator handoff rails metadata",
    "- `release/PROMOTION-STAGED-APPLY-LEDGERS.json` 必须列出 promotion staged-apply ledgers metadata",
    "- `release/PROMOTION-STAGED-APPLY-RUNSHEETS.json` 必须列出 promotion staged-apply runsheets metadata",
    "- `release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json` 必须列出 promotion staged-apply command sheets metadata",
    "- `release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json` 必须列出 promotion staged-apply confirmation ledgers metadata",
    "- `release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json` 必须列出 promotion staged-apply closeout journals metadata",
    "- `release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json` 必须列出 promotion staged-apply signoff sheets metadata",
    "- `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json` 必须列出 promotion staged-apply release decision enforcement contracts metadata",
    "- `release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json` 必须列出 promotion staged-apply release decision enforcement lifecycle metadata",
    "- `release/SIGNING-METADATA.json` 必须列出 signing-ready metadata",
    "- `release/NOTARIZATION-PLAN.json` 必须列出 signing / notarization skeleton",
    "- `release/SIGNING-PUBLISH-PIPELINE.json` 必须列出 signing & publish pipeline skeleton",
    "- `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json` 必须列出 signing-publish gating handshake metadata",
    "- `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json` 必须列出 signing-publish approval bridge metadata",
    "- `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json` 必须列出 signing-publish promotion handshake metadata",
    "- `release/PUBLISH-ROLLBACK-HANDSHAKE.json` 必须列出 publish rollback handshake metadata",
    "- `release/ROLLBACK-RECOVERY-LEDGER.json` 必须列出 rollback recovery ledger metadata",
    "- `release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json` 必须列出 rollback execution rehearsal ledger metadata",
    "- `release/ROLLBACK-OPERATOR-DRILLBOOKS.json` 必须列出 rollback operator drillbooks metadata",
    "- `release/ROLLBACK-LIVE-READINESS-CONTRACTS.json` 必须列出 rollback live-readiness contracts metadata",
    "- `release/ROLLBACK-CUTOVER-READINESS-MAPS.json` 必须列出 rollback cutover readiness maps metadata",
    "- `release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json` 必须列出 rollback cutover handoff plans metadata",
    "- `release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json` 必须列出 rollback cutover execution checklists metadata",
    "- `release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json` 必须列出 rollback cutover execution records metadata",
    "- `release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json` 必须列出 rollback cutover outcome reports metadata",
    "- `release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json` 必须列出 rollback cutover publication bundles metadata",
    "- `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json` 必须列出 rollback cutover publication receipt closeout contracts metadata",
    "- `release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json` 必须列出 rollback cutover publication receipt settlement closeout metadata",
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
    `# OpenClaw Studio ${PHASE_TITLE} Release Summary`,
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
    `# OpenClaw Studio ${PHASE_TITLE} Release Notes`,
    "",
    `Milestone: ${PHASE_MILESTONE}`,
    "",
    "## Highlights",
    "- Delivery-chain Workspace now turns the earlier review-only delivery chain into a Stage Explorer with stage-level artifacts, blockers, handoff posture, and observability mapping kept in one local-only workflow",
    "- companion route-history memory now feeds a route replay board plus replay scenario packs, acceptance-pass checks, screenshot review metadata, and a replay acceptance checklist, so returning to publish-gate, approval-queue, rollback-shadow, or handoff relay coverage can restore the last route, sequence, review surface, review evidence posture, and multi-window posture locally",
    "- operator review board now sits inside that workspace with explicit stage ownership, reviewer queues, acknowledgement state, and direct cross-links back into trace, window review, and artifact groups",
    "- release decision handoff now keeps the reviewer baton explicit between approval, lifecycle, rollback, and final decision stages while also holding the selected delivery stage and downstream posture in view without enabling any live signing, publish, or host-side execution",
    "- review evidence closeout now exposes sealing state, sealed evidence, pending evidence, closeout windows, reviewer notes, and linked stage artifacts as first-class local-only review metadata instead of burying closeout posture inside larger release files",
    "- attestation operator approval orchestration now turns phase53 approval routing contracts into reviewer baton sequencing, approval quorum timing, and orchestration closeout paths without dispatching any live approval or execution for real",
    "- promotion staged-apply release decision enforcement lifecycle now turns phase53 enforcement contracts into lifecycle checkpoints, reviewer baton transitions, and expiry closeout without applying any live promotion for real",
    "- rollback cutover publication receipt settlement closeout now turns phase53 receipt closeout contracts into settlement ledgers, receipt closeout acknowledgements, and recovery-ready closeout evidence without mutating any live publish state",
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
        { id: "pipeline-integrity-attestation", label: "Integrity attestation evidence", status: "ready", detail: "Sealed-bundle integrity contracts now feed explicit attestation packets, verifier inputs, and audit receipts without attesting any live release for real." },
        { id: "pipeline-attestation-verification-packs", label: "Attestation verification packs", status: "ready", detail: "Integrity attestation evidence now feeds verifier-ready packs, checklists, and audit handoff bundles without executing any live verification for real." },
        { id: "pipeline-attestation-apply-audit-packs", label: "Attestation apply audit packs", status: "ready", detail: "Verification packs now feed route-aware apply-audit bundles, reviewer checklists, and audit receipts without executing any live apply step for real." },
        { id: "pipeline-attestation-apply-execution-packets", label: "Attestation apply execution packets", status: "ready", detail: "Apply-audit bundles now feed operator-reviewed execution packets, packet receipts, and pre-apply envelopes without executing any live apply step for real." },
        { id: "pipeline-attestation-operator-worklists", label: "Attestation operator worklists", status: "ready", detail: "Execution packets now feed per-role operator intake queues, acknowledgement slots, and ownership handoff scaffolds without dispatching any live operator action for real." },
        { id: "pipeline-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests", status: "ready", detail: "Operator worklists now feed explicit dispatch envelopes, acknowledgement deadlines, and escalation routes without dispatching any live operator action for real." },
        { id: "pipeline-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets", status: "ready", detail: "Dispatch manifests now feed role-targeted packet bundles, acknowledgement payloads, and receipt slots without dispatching any live operator action for real." },
        { id: "pipeline-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts", status: "ready", detail: "Dispatch packets now feed acknowledgement capture slots, reconciliation inputs, and escalation closeout anchors without dispatching any live operator action for real." },
        { id: "pipeline-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers", status: "ready", detail: "Dispatch receipts now feed operator settlement ledgers, unresolved acknowledgement closeout, and approval-ready summaries without reconciling any live operator action for real." },
        { id: "pipeline-attestation-operator-settlement-packs", label: "Attestation operator settlement packs", status: "ready", detail: "Reconciliation ledgers now feed operator clearance packets, escalation disposition bundles, and approval attachments without routing any live operator settlement for real." },
        { id: "pipeline-attestation-operator-approval-routing-contracts", label: "Attestation operator approval routing contracts", status: "ready", detail: "Settlement packs now feed reviewer-ready routing tables, approval windows, and approval handoff routes without dispatching any live approval or execution for real." },
        { id: "pipeline-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration", status: "ready", detail: "Approval routing contracts now feed reviewer baton sequencing, quorum timing, and orchestration closeout paths without dispatching any live approval or execution for real." },
        { id: "pipeline-review-only-delivery-chain", label: "Delivery-chain workspace", status: "ready", detail: "Operator review board, decision handoff, evidence closeout, promotion readiness, publish gating, rollback readiness, stage-level artifacts, blockers, and observability mapping now read like one staged delivery workflow without executing anything." },
        { id: "pipeline-installer-builders", label: "Installer-target builder skeleton", status: "ready", detail: "Installer targets still map cleanly to per-platform builder identities without invoking a real builder." },
        { id: "pipeline-installer-builder-execution", label: "Installer builder execution skeleton", status: "ready", detail: "Future builder commands, environment, outputs, and review checks are now declared without executing any builder." },
        { id: "pipeline-installer-builder-orchestration", label: "Installer builder orchestration", status: "ready", detail: "Builder execution skeletons now sit inside per-platform orchestration flows without invoking any real builder." },
        { id: "pipeline-installer-channel-routing", label: "Installer channel routing", status: "ready", detail: "Review-only installer flows now map cleanly into alpha/beta/stable routing manifests without routing any build for real." },
        { id: "pipeline-channel-promotion-evidence", label: "Channel promotion evidence", status: "ready", detail: "Channel routing now feeds explicit promotion evidence packets and proof manifests without promoting any artifact for real." },
        { id: "pipeline-promotion-apply-readiness", label: "Promotion apply readiness", status: "ready", detail: "Promotion evidence now feeds explicit apply-readiness manifests, reviewer inputs, and channel preflight packets without applying any promotion for real." },
        { id: "pipeline-promotion-apply-manifests", label: "Promotion apply manifests", status: "ready", detail: "Promotion apply readiness now feeds explicit apply manifests, ordered rollout steps, and rollback anchors without applying any promotion for real." },
        { id: "pipeline-promotion-execution-checkpoints", label: "Promotion execution checkpoints", status: "ready", detail: "Promotion apply manifests now feed explicit execution hold points, checkpoint manifests, and rollback drillbook anchors without executing any promotion for real." },
        { id: "pipeline-promotion-operator-handoff-rails", label: "Promotion operator handoff rails", status: "ready", detail: "Promotion execution checkpoints now feed operator routing rails, role handoff segments, and rollback readiness anchors without executing any promotion for real." },
        { id: "pipeline-promotion-staged-apply-ledgers", label: "Promotion staged-apply ledgers", status: "ready", detail: "Operator handoff rails now feed ordered staged apply journals, freeze windows, and cutover evidence slots without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets", status: "ready", detail: "Staged-apply ledgers now feed operator-ready stage sequencing, hold points, and cutover baton scripts without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets", status: "ready", detail: "Runsheets now feed gated stage commands, confirmation blocks, and receipt stubs without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers", status: "ready", detail: "Command sheets now feed stage acceptance journals, cutover confirmation blocks, and closeout inputs without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals", status: "ready", detail: "Confirmation ledgers now feed stage closeout seals, recovery batons, and publish-ready cutover journals without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets", status: "ready", detail: "Closeout journals now feed staged approver sheets, release-ready packets, and go/no-go evidence without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts", status: "ready", detail: "Signoff sheets now feed staged release guardrails, enforcement windows, and publish-route contracts without applying any promotion for real." },
        { id: "pipeline-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle", status: "ready", detail: "Release decision enforcement contracts now feed lifecycle checkpoints, reviewer baton transitions, and expiry closeout without applying any promotion for real." },
        { id: "pipeline-signing-publish", label: "Signing & publish pipeline", status: "ready", detail: "Signing, notarization, checksums, upload, and promotion stages remain reviewable as a structured pipeline contract." },
        { id: "pipeline-signing-gating", label: "Signing-publish gating handshake", status: "ready", detail: "Signing, publish, approval, and promotion evidence now flow through a structured handshake contract without approving or publishing anything." },
        { id: "pipeline-signing-approval-bridge", label: "Signing-publish approval bridge", status: "ready", detail: "Gating handshake, approval workflow, and promotion evidence are now bridged as one reviewable approval flow." },
        { id: "pipeline-signing-promotion-handshake", label: "Signing-publish promotion handshake", status: "ready", detail: "Channel routing, publish gates, and promotion evidence now converge in a dedicated review-only promotion handshake." },
        { id: "pipeline-publish-rollback", label: "Publish rollback handshake", status: "ready", detail: "Publish and promotion review now carry explicit rollback checkpoints and recovery-channel handoff metadata without rolling anything back for real." },
        { id: "pipeline-rollback-recovery-ledger", label: "Rollback recovery ledger", status: "ready", detail: "Rollback checkpoints now feed explicit recovery ledgers, operator notes, and channel recovery manifests without recovering any live publish state." },
        { id: "pipeline-rollback-execution-rehearsal-ledger", label: "Rollback execution rehearsal ledger", status: "ready", detail: "Rollback recovery ledgers now feed rehearsal manifests, dry-run rollback traces, and operator rehearsal notes without executing any live rollback for real." },
        { id: "pipeline-rollback-operator-drillbooks", label: "Rollback operator drillbooks", status: "ready", detail: "Rollback rehearsal ledgers now feed operator drillbooks, handoff sections, and response checklists without operating on any live publish state for real." },
        { id: "pipeline-rollback-live-readiness-contracts", label: "Rollback live-readiness contracts", status: "ready", detail: "Rollback drillbooks now feed live-readiness gates, recovery proofs, and operator entry checks without enabling any live rollback or publish state mutation." },
        { id: "pipeline-rollback-cutover-readiness-maps", label: "Rollback cutover readiness maps", status: "ready", detail: "Rollback live-readiness contracts now feed channel/platform cutover topology, rollback checkpoint maps, and go/no-go review surfaces without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans", status: "ready", detail: "Rollback cutover readiness maps now feed owner baton transfers, recovery fallback entries, and cutover handoff sections without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists", status: "ready", detail: "Rollback cutover handoff plans now feed cutover go/no-go sheets, platform checkpoint sweeps, and recovery confirmations without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-execution-records", label: "Rollback cutover execution records", status: "ready", detail: "Rollback cutover execution checklists now feed evidence-backed cutover closeout records, recovery-state publications, and rollback outcome inputs without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports", status: "ready", detail: "Rollback cutover execution records now feed recovery digests, outcome publications, and rollback-facing closeout reports without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles", status: "ready", detail: "Outcome reports now feed release-note attachments, publication digests, and rollback publication bundles without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts", status: "ready", detail: "Publication bundles now feed closeout acknowledgements, publication-closeout contracts, and rollback recovery evidence without mutating any live publish state." },
        { id: "pipeline-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout", status: "ready", detail: "Publication receipt closeout contracts now feed settlement ledgers, receipt closeout acknowledgements, and recovery-ready closeout evidence without mutating any live publish state." },
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

function buildIntegrityAttestationEvidence({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-integrity-attestation-evidence/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    attestations: [
      { id: "attestation-windows", platform: "windows", integrityContractId: "integrity-contract-windows", promotionApplyReadinessId: "promotion-apply-alpha-to-beta", rollbackRecoveryLedgerId: "rollback-ledger-alpha-to-beta", status: "planned", attestationManifestPath: "future/attestations/windows/integrity-attestation.json", verifierInputPath: "future/attestations/windows/verifier-input.json", auditReceiptPath: "future/attestations/windows/audit-receipt.json", blockedBy: ["sealed bundle remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"], canAttest: false },
      { id: "attestation-macos", platform: "macos", integrityContractId: "integrity-contract-macos", promotionApplyReadinessId: "promotion-apply-alpha-to-beta", rollbackRecoveryLedgerId: "rollback-ledger-alpha-to-beta", status: "planned", attestationManifestPath: "future/attestations/macos/integrity-attestation.json", verifierInputPath: "future/attestations/macos/verifier-input.json", auditReceiptPath: "future/attestations/macos/audit-receipt.json", blockedBy: ["sealed bundle remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"], canAttest: false },
      { id: "attestation-linux", platform: "linux", integrityContractId: "integrity-contract-linux", promotionApplyReadinessId: "promotion-apply-alpha-to-beta", rollbackRecoveryLedgerId: "rollback-ledger-alpha-to-beta", status: "planned", attestationManifestPath: "future/attestations/linux/integrity-attestation.json", verifierInputPath: "future/attestations/linux/verifier-input.json", auditReceiptPath: "future/attestations/linux/audit-receipt.json", blockedBy: ["sealed bundle remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"], canAttest: false }
    ]
  };
}

function buildAttestationVerificationPacks({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-verification-packs/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    packs: [
      {
        id: "attestation-pack-windows",
        platform: "windows",
        integrityAttestationEvidenceId: "attestation-windows",
        sealedBundleIntegrityContractId: "integrity-contract-windows",
        promotionApplyManifestIds: ["promotion-manifest-alpha-to-beta", "promotion-manifest-beta-to-stable"],
        status: "planned",
        verificationPackPath: "future/attestations/windows/verification-pack.json",
        verifierChecklistPath: "future/attestations/windows/verification-checklist.json",
        auditTrailPath: "future/attestations/windows/verification-audit.json",
        contents: ["integrity attestation", "verifier input", "audit receipt", "bundle integrity contract link"],
        reviewChecks: ["attestation evidence linked", "verifier checklist declared", "promotion apply manifest anchors recorded"],
        blockedBy: ["attestation remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"],
        canVerify: false
      },
      {
        id: "attestation-pack-macos",
        platform: "macos",
        integrityAttestationEvidenceId: "attestation-macos",
        sealedBundleIntegrityContractId: "integrity-contract-macos",
        promotionApplyManifestIds: ["promotion-manifest-alpha-to-beta", "promotion-manifest-beta-to-stable"],
        status: "planned",
        verificationPackPath: "future/attestations/macos/verification-pack.json",
        verifierChecklistPath: "future/attestations/macos/verification-checklist.json",
        auditTrailPath: "future/attestations/macos/verification-audit.json",
        contents: ["integrity attestation", "verifier input", "audit receipt", "bundle integrity contract link"],
        reviewChecks: ["attestation evidence linked", "verifier checklist declared", "promotion apply manifest anchors recorded"],
        blockedBy: ["attestation remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"],
        canVerify: false
      },
      {
        id: "attestation-pack-linux",
        platform: "linux",
        integrityAttestationEvidenceId: "attestation-linux",
        sealedBundleIntegrityContractId: "integrity-contract-linux",
        promotionApplyManifestIds: ["promotion-manifest-alpha-to-beta", "promotion-manifest-beta-to-stable"],
        status: "planned",
        verificationPackPath: "future/attestations/linux/verification-pack.json",
        verifierChecklistPath: "future/attestations/linux/verification-checklist.json",
        auditTrailPath: "future/attestations/linux/verification-audit.json",
        contents: ["integrity attestation", "verifier input", "audit receipt", "bundle integrity contract link"],
        reviewChecks: ["attestation evidence linked", "verifier checklist declared", "promotion apply manifest anchors recorded"],
        blockedBy: ["attestation remains metadata-only", "digest publication remains blocked", "host-side execution remains disabled"],
        canVerify: false
      }
    ]
  };
}

function buildAttestationApplyAuditPacks({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-apply-audit-packs/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    packs: [
      {
        id: "attestation-apply-audit-alpha-to-beta",
        from: "alpha",
        to: "beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        attestationVerificationPackIds: ["attestation-pack-windows", "attestation-pack-macos", "attestation-pack-linux"],
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        attestationApplyExecutionPacketId: "attestation-execution-alpha-to-beta",
        status: "planned",
        auditPackPath: "future/channels/alpha-to-beta/attestation-apply-audit-pack.json",
        auditChecklistPath: "future/channels/alpha-to-beta/attestation-apply-audit-checklist.json",
        auditReceiptPath: "future/channels/alpha-to-beta/attestation-apply-audit-receipt.json",
        contents: [
          "attestation verification packs",
          "promotion apply manifest linkage",
          "reviewer acknowledgement scaffold",
          "execution checkpoint anchor"
        ],
        reviewChecks: [
          "promotion apply manifest linked",
          "attestation verification packs linked",
          "execution checkpoint anchor recorded"
        ],
        blockedBy: ["attestation apply audit remains metadata-only", "promotion apply remains non-executable", "host-side execution remains disabled"],
        canAuditApply: false
      },
      {
        id: "attestation-apply-audit-beta-to-stable",
        from: "beta",
        to: "stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        attestationVerificationPackIds: ["attestation-pack-windows", "attestation-pack-macos", "attestation-pack-linux"],
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        attestationApplyExecutionPacketId: "attestation-execution-beta-to-stable",
        status: "blocked",
        auditPackPath: "future/channels/beta-to-stable/attestation-apply-audit-pack.json",
        auditChecklistPath: "future/channels/beta-to-stable/attestation-apply-audit-checklist.json",
        auditReceiptPath: "future/channels/beta-to-stable/attestation-apply-audit-receipt.json",
        contents: [
          "attestation verification packs",
          "promotion apply manifest linkage",
          "reviewer acknowledgement scaffold",
          "execution checkpoint anchor"
        ],
        reviewChecks: [
          "promotion apply manifest linked",
          "attestation verification packs linked",
          "execution checkpoint anchor recorded"
        ],
        blockedBy: ["attestation apply audit remains metadata-only", "promotion apply remains non-executable", "host-side execution remains disabled"],
        canAuditApply: false
      }
    ]
  };
}

function buildAttestationApplyExecutionPackets({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-apply-execution-packets/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    packets: [
      {
        id: "attestation-execution-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationApplyAuditPackId: "attestation-apply-audit-alpha-to-beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionOperatorHandoffRailId: "promotion-handoff-alpha-to-beta",
        attestationOperatorWorklistId: "attestation-worklist-alpha-to-beta",
        status: "planned",
        executionPacketPath: "future/channels/alpha-to-beta/attestation-apply-execution-packet.json",
        operatorReceiptPath: "future/channels/alpha-to-beta/attestation-apply-execution-receipt.json",
        packetContents: [
          "attestation apply audit pack linkage",
          "promotion apply manifest linkage",
          "pre-apply packet envelope",
          "operator acknowledgement scaffold",
          "promotion handoff rail anchor",
          "operator worklist anchor"
        ],
        reviewChecks: [
          "attestation apply audit pack linked",
          "promotion execution checkpoint linked",
          "promotion handoff rail anchor declared",
          "attestation operator worklist anchor declared"
        ],
        blockedBy: [
          "attestation apply execution remains metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canExecuteApply: false
      },
      {
        id: "attestation-execution-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationApplyAuditPackId: "attestation-apply-audit-beta-to-stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionOperatorHandoffRailId: "promotion-handoff-beta-to-stable",
        attestationOperatorWorklistId: "attestation-worklist-beta-to-stable",
        status: "blocked",
        executionPacketPath: "future/channels/beta-to-stable/attestation-apply-execution-packet.json",
        operatorReceiptPath: "future/channels/beta-to-stable/attestation-apply-execution-receipt.json",
        packetContents: [
          "attestation apply audit pack linkage",
          "promotion apply manifest linkage",
          "pre-apply packet envelope",
          "operator acknowledgement scaffold",
          "promotion handoff rail anchor",
          "operator worklist anchor"
        ],
        reviewChecks: [
          "attestation apply audit pack linked",
          "promotion execution checkpoint linked",
          "promotion handoff rail anchor declared",
          "attestation operator worklist anchor declared"
        ],
        blockedBy: [
          "attestation apply execution remains metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canExecuteApply: false
      }
    ]
  };
}

function buildAttestationOperatorWorklists({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-worklists/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    worklists: [
      {
        id: "attestation-worklist-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationApplyExecutionPacketId: "attestation-execution-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        status: "planned",
        worklistPath: "future/channels/alpha-to-beta/attestation-operator-worklist.json",
        operatorRoles: ["security-reviewer", "release-manager", "release-engineering"],
        checklist: [
          "confirm execution packet receipt linkage",
          "verify attestation evidence chain",
          "assign staged-apply owners",
          "record gated apply window",
          "handoff staged-apply ledger anchor"
        ],
        reviewChecks: [
          "attestation apply execution packet linked",
          "promotion execution checkpoint linked",
          "promotion staged-apply ledger anchor declared",
          "operator dispatch manifest anchor declared",
          "operator dispatch packet anchor declared"
        ],
        blockedBy: [
          "attestation operator worklists remain metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canDispatch: false
      },
      {
        id: "attestation-worklist-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationApplyExecutionPacketId: "attestation-execution-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        status: "blocked",
        worklistPath: "future/channels/beta-to-stable/attestation-operator-worklist.json",
        operatorRoles: ["security-reviewer", "release-manager", "release-engineering"],
        checklist: [
          "confirm execution packet receipt linkage",
          "verify attestation evidence chain",
          "assign staged-apply owners",
          "record stable-channel apply window",
          "handoff staged-apply ledger anchor"
        ],
        reviewChecks: [
          "attestation apply execution packet linked",
          "promotion execution checkpoint linked",
          "promotion staged-apply ledger anchor declared",
          "operator dispatch manifest anchor declared",
          "operator dispatch packet anchor declared"
        ],
        blockedBy: [
          "attestation operator worklists remain metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canDispatch: false
      }
    ]
  };
}

function buildAttestationOperatorDispatchManifests({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-dispatch-manifests/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    manifests: [
      {
        id: "attestation-dispatch-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorWorklistId: "attestation-worklist-alpha-to-beta",
        attestationApplyExecutionPacketId: "attestation-execution-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        status: "blocked",
        dispatchManifestPath: "future/channels/alpha-to-beta/attestation-operator-dispatch-manifest.json",
        dispatchWindow: {
          id: "dispatch-window-alpha-to-beta",
          label: "Alpha -> Beta dispatch window",
          owner: "release-manager",
          status: "planned",
          receiptDeadlineMode: "review-only"
        },
        dispatchTracks: [
          {
            id: "dispatch-alpha-to-beta-security-review",
            role: "security-reviewer",
            packetSource: "attestation-execution-alpha-to-beta",
            receiptPath: "future/channels/alpha-to-beta/dispatch-receipts/security-reviewer.json",
            escalationOwner: "release-manager",
            runsheetStageId: "runsheet-alpha-to-beta-dispatch-intake",
            status: "planned"
          },
          {
            id: "dispatch-alpha-to-beta-release-manager",
            role: "release-manager",
            packetSource: "attestation-worklist-alpha-to-beta",
            receiptPath: "future/channels/alpha-to-beta/dispatch-receipts/release-manager.json",
            escalationOwner: "product-owner",
            runsheetStageId: "runsheet-alpha-to-beta-freeze",
            status: "blocked"
          },
          {
            id: "dispatch-alpha-to-beta-release-engineering",
            role: "release-engineering",
            packetSource: "promotion-checkpoint-alpha-to-beta",
            receiptPath: "future/channels/alpha-to-beta/dispatch-receipts/release-engineering.json",
            escalationOwner: "release-manager",
            runsheetStageId: "runsheet-alpha-to-beta-apply",
            status: "blocked"
          }
        ],
        reviewChecks: [
          "attestation operator worklist linked",
          "promotion staged-apply runsheet anchor declared",
          "rollback cutover handoff plan anchor declared",
          "dispatch packet anchor declared"
        ],
        blockedBy: [
          "attestation operator dispatch remains metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canDispatch: false
      },
      {
        id: "attestation-dispatch-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorWorklistId: "attestation-worklist-beta-to-stable",
        attestationApplyExecutionPacketId: "attestation-execution-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        status: "blocked",
        dispatchManifestPath: "future/channels/beta-to-stable/attestation-operator-dispatch-manifest.json",
        dispatchWindow: {
          id: "dispatch-window-beta-to-stable",
          label: "Beta -> Stable dispatch window",
          owner: "release-manager",
          status: "blocked",
          receiptDeadlineMode: "review-only"
        },
        dispatchTracks: [
          {
            id: "dispatch-beta-to-stable-security-review",
            role: "security-reviewer",
            packetSource: "attestation-execution-beta-to-stable",
            receiptPath: "future/channels/beta-to-stable/dispatch-receipts/security-reviewer.json",
            escalationOwner: "release-manager",
            runsheetStageId: "runsheet-beta-to-stable-dispatch-intake",
            status: "blocked"
          },
          {
            id: "dispatch-beta-to-stable-release-manager",
            role: "release-manager",
            packetSource: "attestation-worklist-beta-to-stable",
            receiptPath: "future/channels/beta-to-stable/dispatch-receipts/release-manager.json",
            escalationOwner: "product-owner",
            runsheetStageId: "runsheet-beta-to-stable-freeze",
            status: "blocked"
          },
          {
            id: "dispatch-beta-to-stable-release-engineering",
            role: "release-engineering",
            packetSource: "promotion-checkpoint-beta-to-stable",
            receiptPath: "future/channels/beta-to-stable/dispatch-receipts/release-engineering.json",
            escalationOwner: "release-manager",
            runsheetStageId: "runsheet-beta-to-stable-apply",
            status: "blocked"
          }
        ],
        reviewChecks: [
          "attestation operator worklist linked",
          "promotion staged-apply runsheet anchor declared",
          "rollback cutover handoff plan anchor declared",
          "dispatch packet anchor declared"
        ],
        blockedBy: [
          "attestation operator dispatch remains metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canDispatch: false
      }
    ]
  };
}

function buildAttestationOperatorDispatchPackets({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-dispatch-packets/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    packets: [
      {
        id: "attestation-dispatch-packet-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        attestationOperatorWorklistId: "attestation-worklist-alpha-to-beta",
        attestationApplyExecutionPacketId: "attestation-execution-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        dispatchPacketPath: "future/channels/alpha-to-beta/attestation-operator-dispatch-packet.json",
        dispatchEnvelopePath: "future/channels/alpha-to-beta/dispatch-envelope.json",
        dispatchReceiptLedgerPath: "future/channels/alpha-to-beta/dispatch-receipts/ledger.json",
        targetPackets: [
          {
            id: "dispatch-packet-alpha-to-beta-security-reviewer",
            role: "security-reviewer",
            sourceManifestTrackId: "dispatch-alpha-to-beta-security-review",
            packetPath: "future/channels/alpha-to-beta/dispatch-packets/security-reviewer.json",
            acknowledgementPath: "future/channels/alpha-to-beta/dispatch-receipts/security-reviewer.json",
            receiptEntryId: "dispatch-receipt-alpha-to-beta-security-reviewer",
            commandSheetStageId: "command-sheet-alpha-to-beta-dispatch-intake",
            status: "planned"
          },
          {
            id: "dispatch-packet-alpha-to-beta-release-manager",
            role: "release-manager",
            sourceManifestTrackId: "dispatch-alpha-to-beta-release-manager",
            packetPath: "future/channels/alpha-to-beta/dispatch-packets/release-manager.json",
            acknowledgementPath: "future/channels/alpha-to-beta/dispatch-receipts/release-manager.json",
            receiptEntryId: "dispatch-receipt-alpha-to-beta-release-manager",
            commandSheetStageId: "command-sheet-alpha-to-beta-freeze",
            status: "blocked"
          },
          {
            id: "dispatch-packet-alpha-to-beta-release-engineering",
            role: "release-engineering",
            sourceManifestTrackId: "dispatch-alpha-to-beta-release-engineering",
            packetPath: "future/channels/alpha-to-beta/dispatch-packets/release-engineering.json",
            acknowledgementPath: "future/channels/alpha-to-beta/dispatch-receipts/release-engineering.json",
            receiptEntryId: "dispatch-receipt-alpha-to-beta-release-engineering",
            commandSheetStageId: "command-sheet-alpha-to-beta-apply",
            status: "blocked"
          }
        ],
        packetContents: [
          "dispatch manifest linkage",
          "role-targeted packet envelopes",
          "acknowledgement payload scaffolds",
          "command-sheet stage anchors",
          "rollback cutover escalation anchors"
        ],
        reviewChecks: [
          "dispatch manifest linked",
          "dispatch envelope path declared",
          "dispatch receipt ledger anchor declared",
          "promotion command sheet anchor declared",
          "rollback execution checklist anchor declared"
        ],
        blockedBy: [
          "attestation operator dispatch packets remain metadata-only",
          "promotion staged apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canIssuePackets: false
      },
      {
        id: "attestation-dispatch-packet-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        attestationOperatorWorklistId: "attestation-worklist-beta-to-stable",
        attestationApplyExecutionPacketId: "attestation-execution-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        dispatchPacketPath: "future/channels/beta-to-stable/attestation-operator-dispatch-packet.json",
        dispatchEnvelopePath: "future/channels/beta-to-stable/dispatch-envelope.json",
        dispatchReceiptLedgerPath: "future/channels/beta-to-stable/dispatch-receipts/ledger.json",
        targetPackets: [
          {
            id: "dispatch-packet-beta-to-stable-security-reviewer",
            role: "security-reviewer",
            sourceManifestTrackId: "dispatch-beta-to-stable-security-review",
            packetPath: "future/channels/beta-to-stable/dispatch-packets/security-reviewer.json",
            acknowledgementPath: "future/channels/beta-to-stable/dispatch-receipts/security-reviewer.json",
            receiptEntryId: "dispatch-receipt-beta-to-stable-security-reviewer",
            commandSheetStageId: "command-sheet-beta-to-stable-dispatch-intake",
            status: "blocked"
          },
          {
            id: "dispatch-packet-beta-to-stable-release-manager",
            role: "release-manager",
            sourceManifestTrackId: "dispatch-beta-to-stable-release-manager",
            packetPath: "future/channels/beta-to-stable/dispatch-packets/release-manager.json",
            acknowledgementPath: "future/channels/beta-to-stable/dispatch-receipts/release-manager.json",
            receiptEntryId: "dispatch-receipt-beta-to-stable-release-manager",
            commandSheetStageId: "command-sheet-beta-to-stable-freeze",
            status: "blocked"
          },
          {
            id: "dispatch-packet-beta-to-stable-release-engineering",
            role: "release-engineering",
            sourceManifestTrackId: "dispatch-beta-to-stable-release-engineering",
            packetPath: "future/channels/beta-to-stable/dispatch-packets/release-engineering.json",
            acknowledgementPath: "future/channels/beta-to-stable/dispatch-receipts/release-engineering.json",
            receiptEntryId: "dispatch-receipt-beta-to-stable-release-engineering",
            commandSheetStageId: "command-sheet-beta-to-stable-apply",
            status: "blocked"
          }
        ],
        packetContents: [
          "dispatch manifest linkage",
          "role-targeted packet envelopes",
          "acknowledgement payload scaffolds",
          "command-sheet stage anchors",
          "rollback cutover escalation anchors"
        ],
        reviewChecks: [
          "dispatch manifest linked",
          "dispatch envelope path declared",
          "dispatch receipt ledger anchor declared",
          "promotion command sheet anchor declared",
          "rollback execution checklist anchor declared"
        ],
        blockedBy: [
          "attestation operator dispatch packets remain metadata-only",
          "promotion staged apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canIssuePackets: false
      }
    ]
  };
}

function buildAttestationOperatorDispatchReceipts({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-dispatch-receipts/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    receipts: [
      {
        id: "attestation-dispatch-receipt-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        status: "blocked",
        receiptLedgerPath: "future/channels/alpha-to-beta/attestation-operator-dispatch-receipts.json",
        reconciliationWindow: {
          id: "dispatch-receipt-window-alpha-to-beta",
          label: "Alpha -> Beta dispatch receipt sweep",
          owner: "release-manager",
          status: "blocked",
          closeoutMode: "review-only"
        },
        receiptEntries: [
          {
            id: "dispatch-receipt-alpha-to-beta-security-reviewer",
            role: "security-reviewer",
            sourcePacketId: "dispatch-packet-alpha-to-beta-security-reviewer",
            acknowledgementPath: "future/channels/alpha-to-beta/dispatch-receipts/security-reviewer.json",
            commandSheetStageId: "command-sheet-alpha-to-beta-dispatch-intake",
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-dispatch",
            executionRecordSectionId: "rollback-execution-record-alpha-to-beta-freeze",
            status: "planned"
          },
          {
            id: "dispatch-receipt-alpha-to-beta-release-manager",
            role: "release-manager",
            sourcePacketId: "dispatch-packet-alpha-to-beta-release-manager",
            acknowledgementPath: "future/channels/alpha-to-beta/dispatch-receipts/release-manager.json",
            commandSheetStageId: "command-sheet-alpha-to-beta-freeze",
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-freeze",
            executionRecordSectionId: "rollback-execution-record-alpha-to-beta-platforms",
            status: "blocked"
          },
          {
            id: "dispatch-receipt-alpha-to-beta-release-engineering",
            role: "release-engineering",
            sourcePacketId: "dispatch-packet-alpha-to-beta-release-engineering",
            acknowledgementPath: "future/channels/alpha-to-beta/dispatch-receipts/release-engineering.json",
            commandSheetStageId: "command-sheet-alpha-to-beta-apply",
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-apply",
            executionRecordSectionId: "rollback-execution-record-alpha-to-beta-cutover",
            status: "blocked"
          }
        ],
        reviewChecks: [
          "dispatch packet linked",
          "receipt reconciliation window declared",
          "promotion confirmation ledger anchor declared",
          "rollback execution record anchor declared"
        ],
        blockedBy: [
          "attestation operator dispatch receipts remain metadata-only",
          "promotion staged apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canReconcileReceipts: false
      },
      {
        id: "attestation-dispatch-receipt-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        status: "blocked",
        receiptLedgerPath: "future/channels/beta-to-stable/attestation-operator-dispatch-receipts.json",
        reconciliationWindow: {
          id: "dispatch-receipt-window-beta-to-stable",
          label: "Beta -> Stable dispatch receipt sweep",
          owner: "release-manager",
          status: "blocked",
          closeoutMode: "review-only"
        },
        receiptEntries: [
          {
            id: "dispatch-receipt-beta-to-stable-security-reviewer",
            role: "security-reviewer",
            sourcePacketId: "dispatch-packet-beta-to-stable-security-reviewer",
            acknowledgementPath: "future/channels/beta-to-stable/dispatch-receipts/security-reviewer.json",
            commandSheetStageId: "command-sheet-beta-to-stable-dispatch-intake",
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-dispatch",
            executionRecordSectionId: "rollback-execution-record-beta-to-stable-freeze",
            status: "blocked"
          },
          {
            id: "dispatch-receipt-beta-to-stable-release-manager",
            role: "release-manager",
            sourcePacketId: "dispatch-packet-beta-to-stable-release-manager",
            acknowledgementPath: "future/channels/beta-to-stable/dispatch-receipts/release-manager.json",
            commandSheetStageId: "command-sheet-beta-to-stable-freeze",
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-freeze",
            executionRecordSectionId: "rollback-execution-record-beta-to-stable-platforms",
            status: "blocked"
          },
          {
            id: "dispatch-receipt-beta-to-stable-release-engineering",
            role: "release-engineering",
            sourcePacketId: "dispatch-packet-beta-to-stable-release-engineering",
            acknowledgementPath: "future/channels/beta-to-stable/dispatch-receipts/release-engineering.json",
            commandSheetStageId: "command-sheet-beta-to-stable-apply",
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-apply",
            executionRecordSectionId: "rollback-execution-record-beta-to-stable-cutover",
            status: "blocked"
          }
        ],
        reviewChecks: [
          "dispatch packet linked",
          "receipt reconciliation window declared",
          "promotion confirmation ledger anchor declared",
          "rollback execution record anchor declared"
        ],
        blockedBy: [
          "attestation operator dispatch receipts remain metadata-only",
          "promotion staged apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canReconcileReceipts: false
      }
    ]
  };
}

function buildAttestationOperatorReconciliationLedgers({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-reconciliation-ledgers/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    ledgers: [
      {
        id: "attestation-reconciliation-ledger-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-alpha-to-beta",
        status: "blocked",
        reconciliationLedgerPath: "future/channels/alpha-to-beta/attestation-operator-reconciliation-ledger.json",
        approvalReadySummaryPath: "future/channels/alpha-to-beta/attestation-operator-reconciliation-summary.json",
        closeoutWindows: [
          { id: "reconciliation-window-alpha-to-beta-intake", label: "Dispatch receipt intake settlement", owner: "security-reviewer", status: "planned" },
          { id: "reconciliation-window-alpha-to-beta-freeze", label: "Freeze owner settlement", owner: "release-manager", status: "blocked" },
          { id: "reconciliation-window-alpha-to-beta-apply", label: "Apply owner settlement", owner: "release-engineering", status: "blocked" },
          { id: "reconciliation-window-alpha-to-beta-escalation", label: "Escalation closeout sweep", owner: "release-manager", status: "blocked" }
        ],
        settlements: [
          {
            id: "attestation-reconciliation-alpha-to-beta-security-reviewer",
            role: "security-reviewer",
            sourceReceiptId: "dispatch-receipt-alpha-to-beta-security-reviewer",
            promotionCloseoutEntryId: "promotion-closeout-alpha-to-beta-dispatch",
            rollbackOutcomeSectionId: "rollback-outcome-report-alpha-to-beta-freeze",
            status: "planned"
          },
          {
            id: "attestation-reconciliation-alpha-to-beta-release-manager",
            role: "release-manager",
            sourceReceiptId: "dispatch-receipt-alpha-to-beta-release-manager",
            promotionCloseoutEntryId: "promotion-closeout-alpha-to-beta-freeze",
            rollbackOutcomeSectionId: "rollback-outcome-report-alpha-to-beta-platforms",
            status: "blocked"
          },
          {
            id: "attestation-reconciliation-alpha-to-beta-release-engineering",
            role: "release-engineering",
            sourceReceiptId: "dispatch-receipt-alpha-to-beta-release-engineering",
            promotionCloseoutEntryId: "promotion-closeout-alpha-to-beta-apply",
            rollbackOutcomeSectionId: "rollback-outcome-report-alpha-to-beta-cutover",
            status: "blocked"
          }
        ],
        reviewChecks: [
          "dispatch receipt linked",
          "promotion closeout journal anchor declared",
          "rollback outcome report anchor declared",
          "approval-ready summary path declared"
        ],
        blockedBy: [
          "attestation operator reconciliation ledgers remain metadata-only",
          "promotion staged-apply closeout remains non-executable",
          "rollback cutover outcome reporting remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseReconciliation: false
      },
      {
        id: "attestation-reconciliation-ledger-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-beta-to-stable",
        status: "blocked",
        reconciliationLedgerPath: "future/channels/beta-to-stable/attestation-operator-reconciliation-ledger.json",
        approvalReadySummaryPath: "future/channels/beta-to-stable/attestation-operator-reconciliation-summary.json",
        closeoutWindows: [
          { id: "reconciliation-window-beta-to-stable-intake", label: "Dispatch receipt intake settlement", owner: "security-reviewer", status: "blocked" },
          { id: "reconciliation-window-beta-to-stable-freeze", label: "Freeze owner settlement", owner: "release-manager", status: "blocked" },
          { id: "reconciliation-window-beta-to-stable-apply", label: "Apply owner settlement", owner: "release-engineering", status: "blocked" },
          { id: "reconciliation-window-beta-to-stable-escalation", label: "Escalation closeout sweep", owner: "release-manager", status: "blocked" }
        ],
        settlements: [
          {
            id: "attestation-reconciliation-beta-to-stable-security-reviewer",
            role: "security-reviewer",
            sourceReceiptId: "dispatch-receipt-beta-to-stable-security-reviewer",
            promotionCloseoutEntryId: "promotion-closeout-beta-to-stable-dispatch",
            rollbackOutcomeSectionId: "rollback-outcome-report-beta-to-stable-freeze",
            status: "blocked"
          },
          {
            id: "attestation-reconciliation-beta-to-stable-release-manager",
            role: "release-manager",
            sourceReceiptId: "dispatch-receipt-beta-to-stable-release-manager",
            promotionCloseoutEntryId: "promotion-closeout-beta-to-stable-freeze",
            rollbackOutcomeSectionId: "rollback-outcome-report-beta-to-stable-platforms",
            status: "blocked"
          },
          {
            id: "attestation-reconciliation-beta-to-stable-release-engineering",
            role: "release-engineering",
            sourceReceiptId: "dispatch-receipt-beta-to-stable-release-engineering",
            promotionCloseoutEntryId: "promotion-closeout-beta-to-stable-apply",
            rollbackOutcomeSectionId: "rollback-outcome-report-beta-to-stable-cutover",
            status: "blocked"
          }
        ],
        reviewChecks: [
          "dispatch receipt linked",
          "promotion closeout journal anchor declared",
          "rollback outcome report anchor declared",
          "approval-ready summary path declared"
        ],
        blockedBy: [
          "attestation operator reconciliation ledgers remain metadata-only",
          "promotion staged-apply closeout remains non-executable",
          "rollback cutover outcome reporting remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseReconciliation: false
      }
    ]
  };
}

function buildAttestationOperatorSettlementPacks({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-settlement-packs/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    packs: [
      {
        id: "attestation-settlement-pack-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-alpha-to-beta",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-alpha-to-beta",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-alpha-to-beta",
        releaseApprovalStageId: "approval-attestation-verification",
        publishGateId: "gate-attestation-operator-settlement-packs",
        status: "blocked",
        settlementPackPath: "future/channels/alpha-to-beta/attestation-operator-settlement-pack.json",
        escalationDispositionPath: "future/channels/alpha-to-beta/attestation-operator-escalation-disposition.json",
        approvalAttachmentPath: "future/channels/alpha-to-beta/attestation-operator-approval-attachment.json",
        handoffTargets: ["release-manager", "product-owner", "security"],
        settlements: [
          {
            id: "attestation-settlement-alpha-to-beta-security-reviewer",
            role: "security-reviewer",
            sourceSettlementId: "attestation-reconciliation-alpha-to-beta-security-reviewer",
            disposition: "dispatch-intake-cleared",
            status: "planned",
            evidence: ["attestation-reconciliation-ledger-alpha-to-beta", "promotion-closeout-journal-alpha-to-beta"]
          },
          {
            id: "attestation-settlement-alpha-to-beta-release-manager",
            role: "release-manager",
            sourceSettlementId: "attestation-reconciliation-alpha-to-beta-release-manager",
            disposition: "freeze-hold-cleared",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          },
          {
            id: "attestation-settlement-alpha-to-beta-release-engineering",
            role: "release-engineering",
            sourceSettlementId: "attestation-reconciliation-alpha-to-beta-release-engineering",
            disposition: "apply-window-cleared",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "reconciliation ledger linked",
          "promotion closeout journal linked",
          "rollback outcome report linked",
          "escalation disposition path declared",
          "approval attachment path declared"
        ],
        blockedBy: [
          "attestation operator settlement packs remain metadata-only",
          "promotion staged-apply signoff remains non-executable",
          "rollback cutover publication remains non-executable",
          "host-side execution remains disabled"
        ],
        canAssembleSettlementPack: false
      },
      {
        id: "attestation-settlement-pack-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-beta-to-stable",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-beta-to-stable",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-beta-to-stable",
        releaseApprovalStageId: "approval-attestation-verification",
        publishGateId: "gate-attestation-operator-settlement-packs",
        status: "blocked",
        settlementPackPath: "future/channels/beta-to-stable/attestation-operator-settlement-pack.json",
        escalationDispositionPath: "future/channels/beta-to-stable/attestation-operator-escalation-disposition.json",
        approvalAttachmentPath: "future/channels/beta-to-stable/attestation-operator-approval-attachment.json",
        handoffTargets: ["release-manager", "product-owner", "security"],
        settlements: [
          {
            id: "attestation-settlement-beta-to-stable-security-reviewer",
            role: "security-reviewer",
            sourceSettlementId: "attestation-reconciliation-beta-to-stable-security-reviewer",
            disposition: "dispatch-intake-cleared",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-beta-to-stable", "promotion-closeout-journal-beta-to-stable"]
          },
          {
            id: "attestation-settlement-beta-to-stable-release-manager",
            role: "release-manager",
            sourceSettlementId: "attestation-reconciliation-beta-to-stable-release-manager",
            disposition: "freeze-hold-cleared",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          },
          {
            id: "attestation-settlement-beta-to-stable-release-engineering",
            role: "release-engineering",
            sourceSettlementId: "attestation-reconciliation-beta-to-stable-release-engineering",
            disposition: "apply-window-cleared",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "reconciliation ledger linked",
          "promotion closeout journal linked",
          "rollback outcome report linked",
          "escalation disposition path declared",
          "approval attachment path declared"
        ],
        blockedBy: [
          "attestation operator settlement packs remain metadata-only",
          "promotion staged-apply signoff remains non-executable",
          "rollback cutover publication remains non-executable",
          "host-side execution remains disabled"
        ],
        canAssembleSettlementPack: false
      }
    ]
  };
}

function buildAttestationOperatorApprovalRoutingContracts({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-approval-routing-contracts/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    contracts: [
      {
        id: "attestation-approval-routing-contract-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-alpha-to-beta",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-alpha-to-beta",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-alpha-to-beta",
        releaseApprovalStageId: "approval-decision-receipts",
        gatingStageId: "handshake-attestation-operator-approval-routing-contracts",
        publishGateId: "gate-attestation-operator-approval-routing-contracts",
        status: "blocked",
        approvalRoutingContractPath: "future/channels/alpha-to-beta/attestation-operator-approval-routing-contract.json",
        approvalWindowPath: "future/channels/alpha-to-beta/attestation-operator-approval-window.json",
        approvalRoutingMapPath: "future/channels/alpha-to-beta/attestation-operator-approval-routing-map.json",
        handoffTargets: ["release-engineering", "release-manager", "security"],
        routes: [
          {
            id: "attestation-approval-routing-contract-alpha-to-beta-security",
            label: "Security routing contract",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-settlement-pack-alpha-to-beta", "promotion-signoff-sheet-alpha-to-beta"]
          },
          {
            id: "attestation-approval-routing-contract-alpha-to-beta-release-manager",
            label: "Release routing contract",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-settlement-pack-alpha-to-beta", "rollback-publication-bundle-alpha-to-beta"]
          },
          {
            id: "attestation-approval-routing-contract-alpha-to-beta-release-engineering",
            label: "Approval-window routing contract",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-alpha-to-beta", "rollback-publication-bundle-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "settlement pack linked",
          "promotion signoff sheet linked",
          "rollback publication bundle linked",
          "approval window path declared",
          "approval routing map path declared"
        ],
        blockedBy: [
          "attestation operator approval routing contracts remain metadata-only",
          "release approval remains non-executable",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canRouteApproval: false
      },
      {
        id: "attestation-approval-routing-contract-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-beta-to-stable",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-beta-to-stable",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-beta-to-stable",
        releaseApprovalStageId: "approval-decision-receipts",
        gatingStageId: "handshake-attestation-operator-approval-routing-contracts",
        publishGateId: "gate-attestation-operator-approval-routing-contracts",
        status: "blocked",
        approvalRoutingContractPath: "future/channels/beta-to-stable/attestation-operator-approval-routing-contract.json",
        approvalWindowPath: "future/channels/beta-to-stable/attestation-operator-approval-window.json",
        approvalRoutingMapPath: "future/channels/beta-to-stable/attestation-operator-approval-routing-map.json",
        handoffTargets: ["release-engineering", "release-manager", "security"],
        routes: [
          {
            id: "attestation-approval-routing-contract-beta-to-stable-security",
            label: "Security routing contract",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-settlement-pack-beta-to-stable", "promotion-signoff-sheet-beta-to-stable"]
          },
          {
            id: "attestation-approval-routing-contract-beta-to-stable-release-manager",
            label: "Release routing contract",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-settlement-pack-beta-to-stable", "rollback-publication-bundle-beta-to-stable"]
          },
          {
            id: "attestation-approval-routing-contract-beta-to-stable-release-engineering",
            label: "Approval-window routing contract",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-beta-to-stable", "rollback-publication-bundle-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "settlement pack linked",
          "promotion signoff sheet linked",
          "rollback publication bundle linked",
          "approval window path declared",
          "approval routing map path declared"
        ],
        blockedBy: [
          "attestation operator approval routing contracts remain metadata-only",
          "release approval remains non-executable",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canRouteApproval: false
      }
    ]
  };
}

function buildAttestationOperatorApprovalOrchestration({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-attestation-operator-approval-orchestration/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    orchestrations: [
      {
        id: "attestation-approval-orchestration-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-alpha-to-beta",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-alpha-to-beta",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-alpha-to-beta",
        releaseApprovalStageId: "approval-decision-receipts",
        gatingStageId: "handshake-attestation-operator-approval-orchestration",
        publishGateId: "gate-attestation-operator-approval-orchestration",
        status: "blocked",
        orchestrationPlanPath: "future/channels/alpha-to-beta/attestation-operator-approval-orchestration.json",
        orchestrationBoardPath: "future/channels/alpha-to-beta/attestation-operator-approval-orchestration-board.json",
        orchestrationCloseoutPath: "future/channels/alpha-to-beta/attestation-operator-approval-orchestration-closeout.json",
        handoffTargets: ["release-engineering", "release-manager", "security", "product-owner"],
        orchestrationSteps: [
          {
            id: "attestation-approval-orchestration-alpha-to-beta-intake",
            label: "Routing intake orchestration",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-approval-routing-contract-alpha-to-beta", "promotion-release-decision-enforcement-contract-alpha-to-beta"]
          },
          {
            id: "attestation-approval-orchestration-alpha-to-beta-quorum",
            label: "Approval quorum window orchestration",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-alpha-to-beta", "rollback-publication-receipt-closeout-contract-alpha-to-beta"]
          },
          {
            id: "attestation-approval-orchestration-alpha-to-beta-closeout",
            label: "Approval orchestration closeout",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-release-decision-enforcement-contract-alpha-to-beta", "rollback-publication-receipt-closeout-contract-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "approval routing contract linked",
          "release decision enforcement contract linked",
          "publication receipt closeout contract linked",
          "orchestration board path declared",
          "orchestration closeout path declared"
        ],
        blockedBy: [
          "attestation operator approval orchestration remains metadata-only",
          "release approval remains non-executable",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canOrchestrateApproval: false
      },
      {
        id: "attestation-approval-orchestration-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-beta-to-stable",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-beta-to-stable",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-beta-to-stable",
        releaseApprovalStageId: "approval-decision-receipts",
        gatingStageId: "handshake-attestation-operator-approval-orchestration",
        publishGateId: "gate-attestation-operator-approval-orchestration",
        status: "blocked",
        orchestrationPlanPath: "future/channels/beta-to-stable/attestation-operator-approval-orchestration.json",
        orchestrationBoardPath: "future/channels/beta-to-stable/attestation-operator-approval-orchestration-board.json",
        orchestrationCloseoutPath: "future/channels/beta-to-stable/attestation-operator-approval-orchestration-closeout.json",
        handoffTargets: ["release-engineering", "release-manager", "security", "product-owner"],
        orchestrationSteps: [
          {
            id: "attestation-approval-orchestration-beta-to-stable-intake",
            label: "Routing intake orchestration",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-beta-to-stable", "promotion-release-decision-enforcement-contract-beta-to-stable"]
          },
          {
            id: "attestation-approval-orchestration-beta-to-stable-quorum",
            label: "Approval quorum window orchestration",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-beta-to-stable", "rollback-publication-receipt-closeout-contract-beta-to-stable"]
          },
          {
            id: "attestation-approval-orchestration-beta-to-stable-closeout",
            label: "Approval orchestration closeout",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-release-decision-enforcement-contract-beta-to-stable", "rollback-publication-receipt-closeout-contract-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "approval routing contract linked",
          "release decision enforcement contract linked",
          "publication receipt closeout contract linked",
          "orchestration board path declared",
          "orchestration closeout path declared"
        ],
        blockedBy: [
          "attestation operator approval orchestration remains metadata-only",
          "release approval remains non-executable",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canOrchestrateApproval: false
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

function buildPromotionApplyReadiness({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-apply-readiness/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    readiness: [
      { id: "promotion-apply-alpha-to-beta", from: "alpha", to: "beta", channelPromotionEvidenceId: "promotion-evidence-alpha-to-beta", rollbackRecoveryLedgerId: "rollback-ledger-alpha-to-beta", status: "planned", readinessManifestPath: "future/channels/alpha-to-beta/promotion-apply-readiness.json", reviewChecks: ["promotion evidence linked", "route mapping linked", "rollback recovery ledger linked"], blockedBy: ["promotion remains non-executable", "artifact upload remains blocked", "host-side execution remains disabled"], canApply: false },
      { id: "promotion-apply-beta-to-stable", from: "beta", to: "stable", channelPromotionEvidenceId: "promotion-evidence-beta-to-stable", rollbackRecoveryLedgerId: "rollback-ledger-beta-to-stable", status: "blocked", readinessManifestPath: "future/channels/beta-to-stable/promotion-apply-readiness.json", reviewChecks: ["promotion evidence linked", "route mapping linked", "rollback recovery ledger linked"], blockedBy: ["promotion remains non-executable", "artifact upload remains blocked", "host-side execution remains disabled"], canApply: false }
    ]
  };
}

function buildPromotionApplyManifests({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-apply-manifests/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    manifests: [
      {
        id: "promotion-manifest-alpha-to-beta",
        from: "alpha",
        to: "beta",
        promotionApplyReadinessId: "promotion-apply-alpha-to-beta",
        channelPromotionEvidenceId: "promotion-evidence-alpha-to-beta",
        attestationApplyAuditPackId: "attestation-apply-audit-alpha-to-beta",
        attestationVerificationPackIds: ["attestation-pack-windows", "attestation-pack-macos", "attestation-pack-linux"],
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-alpha-to-beta",
        status: "planned",
        manifestPath: "future/channels/alpha-to-beta/promotion-apply-manifest.json",
        applyOrder: [
          "verify attestation packs",
          "confirm channel route and publish gates",
          "stage promotion apply payload",
          "record rollback rehearsal anchor"
        ],
        reviewChecks: ["promotion readiness linked", "attestation verification packs linked", "rollback rehearsal anchor declared"],
        blockedBy: ["promotion apply remains non-executable", "artifact upload remains blocked", "host-side execution remains disabled"],
        canApply: false
      },
      {
        id: "promotion-manifest-beta-to-stable",
        from: "beta",
        to: "stable",
        promotionApplyReadinessId: "promotion-apply-beta-to-stable",
        channelPromotionEvidenceId: "promotion-evidence-beta-to-stable",
        attestationApplyAuditPackId: "attestation-apply-audit-beta-to-stable",
        attestationVerificationPackIds: ["attestation-pack-windows", "attestation-pack-macos", "attestation-pack-linux"],
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-beta-to-stable",
        status: "blocked",
        manifestPath: "future/channels/beta-to-stable/promotion-apply-manifest.json",
        applyOrder: [
          "verify attestation packs",
          "confirm stable route prerequisites",
          "stage promotion apply payload",
          "record rollback rehearsal anchor"
        ],
        reviewChecks: ["promotion readiness linked", "attestation verification packs linked", "rollback rehearsal anchor declared"],
        blockedBy: ["promotion apply remains non-executable", "artifact upload remains blocked", "host-side execution remains disabled"],
        canApply: false
      }
    ]
  };
}

function buildPromotionExecutionCheckpoints({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-execution-checkpoints/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    checkpoints: [
      {
        id: "promotion-checkpoint-alpha-to-beta",
        from: "alpha",
        to: "beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        attestationApplyAuditPackId: "attestation-apply-audit-alpha-to-beta",
        attestationApplyExecutionPacketId: "attestation-execution-alpha-to-beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        promotionOperatorHandoffRailId: "promotion-handoff-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        status: "planned",
        checkpointManifestPath: "future/channels/alpha-to-beta/promotion-execution-checkpoints.json",
        executionSteps: [
          "review attestation apply execution packet",
          "confirm channel route and publish gates",
          "hold execution at pre-apply checkpoint",
          "record rollback drillbook anchor",
          "record operator handoff rail anchor"
        ],
        reviewChecks: [
          "promotion apply manifest linked",
          "attestation apply execution packet linked",
          "rollback drillbook anchor declared",
          "promotion operator handoff rail anchor declared",
          "promotion staged-apply ledger anchor declared",
          "promotion staged-apply runsheet anchor declared"
        ],
        blockedBy: ["promotion execution remains non-executable", "artifact upload remains blocked", "host-side execution remains disabled"],
        canExecute: false
      },
      {
        id: "promotion-checkpoint-beta-to-stable",
        from: "beta",
        to: "stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        attestationApplyAuditPackId: "attestation-apply-audit-beta-to-stable",
        attestationApplyExecutionPacketId: "attestation-execution-beta-to-stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        promotionOperatorHandoffRailId: "promotion-handoff-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        status: "blocked",
        checkpointManifestPath: "future/channels/beta-to-stable/promotion-execution-checkpoints.json",
        executionSteps: [
          "review attestation apply execution packet",
          "confirm stable route prerequisites",
          "hold execution at pre-apply checkpoint",
          "record rollback drillbook anchor",
          "record operator handoff rail anchor"
        ],
        reviewChecks: [
          "promotion apply manifest linked",
          "attestation apply execution packet linked",
          "rollback drillbook anchor declared",
          "promotion operator handoff rail anchor declared",
          "promotion staged-apply ledger anchor declared",
          "promotion staged-apply runsheet anchor declared"
        ],
        blockedBy: ["promotion execution remains non-executable", "artifact upload remains blocked", "host-side execution remains disabled"],
        canExecute: false
      }
    ]
  };
}

function buildPromotionOperatorHandoffRails({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-operator-handoff-rails/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    rails: [
      {
        id: "promotion-handoff-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationApplyExecutionPacketId: "attestation-execution-alpha-to-beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        status: "planned",
        handoffRailPath: "future/channels/alpha-to-beta/promotion-operator-handoff-rail.json",
        operatorRoles: ["release-manager", "release-engineering", "support-operator"],
        railSegments: [
          "checkpoint intake",
          "apply packet acknowledgement",
          "channel freeze posture",
          "rollback readiness relay",
          "staged apply ledger handoff"
        ],
        reviewChecks: [
          "attestation apply execution packet linked",
          "promotion execution checkpoint linked",
          "rollback live-readiness anchor declared",
          "promotion staged-apply ledger anchor declared",
          "staged-apply runsheet anchor declared"
        ],
        blockedBy: [
          "promotion operator handoff remains metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canHandoff: false
      },
      {
        id: "promotion-handoff-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationApplyExecutionPacketId: "attestation-execution-beta-to-stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        status: "blocked",
        handoffRailPath: "future/channels/beta-to-stable/promotion-operator-handoff-rail.json",
        operatorRoles: ["release-manager", "release-engineering", "support-operator"],
        railSegments: [
          "checkpoint intake",
          "apply packet acknowledgement",
          "channel freeze posture",
          "rollback readiness relay",
          "staged apply ledger handoff"
        ],
        reviewChecks: [
          "attestation apply execution packet linked",
          "promotion execution checkpoint linked",
          "rollback live-readiness anchor declared",
          "promotion staged-apply ledger anchor declared",
          "staged-apply runsheet anchor declared"
        ],
        blockedBy: [
          "promotion operator handoff remains metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canHandoff: false
      }
    ]
  };
}

function buildPromotionStagedApplyLedgers({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-ledgers/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    ledgers: [
      {
        id: "promotion-staged-ledger-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorWorklistId: "attestation-worklist-alpha-to-beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionOperatorHandoffRailId: "promotion-handoff-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        status: "blocked",
        ledgerPath: "future/channels/alpha-to-beta/promotion-staged-apply-ledger.json",
        stages: [
          {
            id: "staged-ledger-alpha-to-beta-intake",
            label: "Attestation intake",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-worklist-alpha-to-beta", "promotion-checkpoint-alpha-to-beta"]
          },
          {
            id: "staged-ledger-alpha-to-beta-freeze",
            label: "Channel freeze",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-handoff-alpha-to-beta", "promotion-manifest-alpha-to-beta"]
          },
          {
            id: "staged-ledger-alpha-to-beta-apply",
            label: "Staged apply window",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-alpha-to-beta", "promotion-checkpoint-alpha-to-beta"]
          },
          {
            id: "staged-ledger-alpha-to-beta-cutover",
            label: "Cutover verification",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-cutover-map-alpha-to-beta", "rollback-readiness-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "attestation operator worklist linked",
          "promotion operator handoff rail linked",
          "rollback cutover readiness anchor declared",
          "staged-apply runsheet anchor declared",
          "staged-apply command sheet anchor declared"
        ],
        blockedBy: [
          "promotion staged apply remains metadata-only",
          "promotion cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canStageApply: false
      },
      {
        id: "promotion-staged-ledger-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorWorklistId: "attestation-worklist-beta-to-stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionOperatorHandoffRailId: "promotion-handoff-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        status: "blocked",
        ledgerPath: "future/channels/beta-to-stable/promotion-staged-apply-ledger.json",
        stages: [
          {
            id: "staged-ledger-beta-to-stable-intake",
            label: "Attestation intake",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-worklist-beta-to-stable", "promotion-checkpoint-beta-to-stable"]
          },
          {
            id: "staged-ledger-beta-to-stable-freeze",
            label: "Channel freeze",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-handoff-beta-to-stable", "promotion-manifest-beta-to-stable"]
          },
          {
            id: "staged-ledger-beta-to-stable-apply",
            label: "Staged apply window",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-beta-to-stable", "promotion-checkpoint-beta-to-stable"]
          },
          {
            id: "staged-ledger-beta-to-stable-cutover",
            label: "Cutover verification",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-cutover-map-beta-to-stable", "rollback-readiness-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "attestation operator worklist linked",
          "promotion operator handoff rail linked",
          "rollback cutover readiness anchor declared",
          "staged-apply runsheet anchor declared",
          "staged-apply command sheet anchor declared"
        ],
        blockedBy: [
          "promotion staged apply remains metadata-only",
          "promotion cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canStageApply: false
      }
    ]
  };
}

function buildPromotionStagedApplyRunsheets({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-runsheets/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    runsheets: [
      {
        id: "promotion-runsheet-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        status: "blocked",
        runsheetPath: "future/channels/alpha-to-beta/promotion-staged-apply-runsheet.json",
        executionWindows: [
          { id: "runsheet-alpha-to-beta-window-dispatch", label: "Dispatch intake", owner: "security-reviewer", status: "planned" },
          { id: "runsheet-alpha-to-beta-window-freeze", label: "Freeze hold", owner: "release-manager", status: "blocked" },
          { id: "runsheet-alpha-to-beta-window-apply", label: "Apply hold", owner: "release-engineering", status: "blocked" },
          { id: "runsheet-alpha-to-beta-window-cutover", label: "Cutover baton", owner: "support-operator", status: "blocked" }
        ],
        stages: [
          {
            id: "runsheet-alpha-to-beta-dispatch-intake",
            label: "Dispatch intake",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-dispatch-alpha-to-beta", "attestation-worklist-alpha-to-beta"]
          },
          {
            id: "runsheet-alpha-to-beta-freeze",
            label: "Freeze and receipt sweep",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-alpha-to-beta", "promotion-handoff-alpha-to-beta"]
          },
          {
            id: "runsheet-alpha-to-beta-apply",
            label: "Staged apply baton",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-alpha-to-beta", "promotion-checkpoint-alpha-to-beta"]
          },
          {
            id: "runsheet-alpha-to-beta-cutover",
            label: "Cutover handoff",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-cutover-map-alpha-to-beta", "rollback-handoff-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "staged-apply ledger linked",
          "dispatch manifest linked",
          "dispatch packet linked",
          "rollback cutover handoff plan anchor declared",
          "promotion command sheet anchor declared"
        ],
        blockedBy: [
          "promotion staged-apply runsheets remain metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canRun: false
      },
      {
        id: "promotion-runsheet-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        status: "blocked",
        runsheetPath: "future/channels/beta-to-stable/promotion-staged-apply-runsheet.json",
        executionWindows: [
          { id: "runsheet-beta-to-stable-window-dispatch", label: "Dispatch intake", owner: "security-reviewer", status: "blocked" },
          { id: "runsheet-beta-to-stable-window-freeze", label: "Freeze hold", owner: "release-manager", status: "blocked" },
          { id: "runsheet-beta-to-stable-window-apply", label: "Apply hold", owner: "release-engineering", status: "blocked" },
          { id: "runsheet-beta-to-stable-window-cutover", label: "Cutover baton", owner: "support-operator", status: "blocked" }
        ],
        stages: [
          {
            id: "runsheet-beta-to-stable-dispatch-intake",
            label: "Dispatch intake",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-dispatch-beta-to-stable", "attestation-worklist-beta-to-stable"]
          },
          {
            id: "runsheet-beta-to-stable-freeze",
            label: "Freeze and receipt sweep",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-beta-to-stable", "promotion-handoff-beta-to-stable"]
          },
          {
            id: "runsheet-beta-to-stable-apply",
            label: "Staged apply baton",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-beta-to-stable", "promotion-checkpoint-beta-to-stable"]
          },
          {
            id: "runsheet-beta-to-stable-cutover",
            label: "Cutover handoff",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-cutover-map-beta-to-stable", "rollback-handoff-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "staged-apply ledger linked",
          "dispatch manifest linked",
          "dispatch packet linked",
          "rollback cutover handoff plan anchor declared",
          "promotion command sheet anchor declared"
        ],
        blockedBy: [
          "promotion staged-apply runsheets remain metadata-only",
          "promotion apply remains non-executable",
          "host-side execution remains disabled"
        ],
        canRun: false
      }
    ]
  };
}

function buildPromotionStagedApplyCommandSheets({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-command-sheets/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    commandSheets: [
      {
        id: "promotion-command-sheet-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        commandSheetPath: "future/channels/alpha-to-beta/promotion-staged-apply-command-sheet.json",
        confirmationLedgerPath: "future/channels/alpha-to-beta/promotion-staged-apply-confirmation-ledger.json",
        commandWindows: [
          { id: "command-sheet-alpha-to-beta-window-dispatch", label: "Dispatch packet review", owner: "security-reviewer", status: "planned" },
          { id: "command-sheet-alpha-to-beta-window-freeze", label: "Freeze confirmation", owner: "release-manager", status: "blocked" },
          { id: "command-sheet-alpha-to-beta-window-apply", label: "Apply confirmation", owner: "release-engineering", status: "blocked" },
          { id: "command-sheet-alpha-to-beta-window-cutover", label: "Cutover rollback checkpoint", owner: "support-operator", status: "blocked" }
        ],
        stages: [
          {
            id: "command-sheet-alpha-to-beta-dispatch-intake",
            label: "Dispatch packet acknowledgement",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-dispatch-packet-alpha-to-beta", "promotion-runsheet-alpha-to-beta"],
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-dispatch"
          },
          {
            id: "command-sheet-alpha-to-beta-freeze",
            label: "Freeze hold confirmation",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-alpha-to-beta", "promotion-handoff-alpha-to-beta"],
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-freeze"
          },
          {
            id: "command-sheet-alpha-to-beta-apply",
            label: "Apply command confirmation",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-alpha-to-beta", "promotion-checkpoint-alpha-to-beta"],
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-apply"
          },
          {
            id: "command-sheet-alpha-to-beta-cutover",
            label: "Cutover rollback checklist sync",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-handoff-alpha-to-beta", "rollback-checklist-alpha-to-beta"],
            confirmationLedgerEntryId: "promotion-confirmation-alpha-to-beta-cutover"
          }
        ],
        reviewChecks: [
          "dispatch packet linked",
          "staged-apply runsheet linked",
          "promotion execution checkpoint linked",
          "confirmation ledger anchor declared",
          "rollback execution checklist anchor declared"
        ],
        blockedBy: [
          "promotion staged-apply command sheets remain metadata-only",
          "promotion apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canIssueCommands: false
      },
      {
        id: "promotion-command-sheet-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        commandSheetPath: "future/channels/beta-to-stable/promotion-staged-apply-command-sheet.json",
        confirmationLedgerPath: "future/channels/beta-to-stable/promotion-staged-apply-confirmation-ledger.json",
        commandWindows: [
          { id: "command-sheet-beta-to-stable-window-dispatch", label: "Dispatch packet review", owner: "security-reviewer", status: "blocked" },
          { id: "command-sheet-beta-to-stable-window-freeze", label: "Freeze confirmation", owner: "release-manager", status: "blocked" },
          { id: "command-sheet-beta-to-stable-window-apply", label: "Apply confirmation", owner: "release-engineering", status: "blocked" },
          { id: "command-sheet-beta-to-stable-window-cutover", label: "Cutover rollback checkpoint", owner: "support-operator", status: "blocked" }
        ],
        stages: [
          {
            id: "command-sheet-beta-to-stable-dispatch-intake",
            label: "Dispatch packet acknowledgement",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-dispatch-packet-beta-to-stable", "promotion-runsheet-beta-to-stable"],
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-dispatch"
          },
          {
            id: "command-sheet-beta-to-stable-freeze",
            label: "Freeze hold confirmation",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-beta-to-stable", "promotion-handoff-beta-to-stable"],
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-freeze"
          },
          {
            id: "command-sheet-beta-to-stable-apply",
            label: "Apply command confirmation",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-beta-to-stable", "promotion-checkpoint-beta-to-stable"],
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-apply"
          },
          {
            id: "command-sheet-beta-to-stable-cutover",
            label: "Cutover rollback checklist sync",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-handoff-beta-to-stable", "rollback-checklist-beta-to-stable"],
            confirmationLedgerEntryId: "promotion-confirmation-beta-to-stable-cutover"
          }
        ],
        reviewChecks: [
          "dispatch packet linked",
          "staged-apply runsheet linked",
          "promotion execution checkpoint linked",
          "confirmation ledger anchor declared",
          "rollback execution checklist anchor declared"
        ],
        blockedBy: [
          "promotion staged-apply command sheets remain metadata-only",
          "promotion apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canIssueCommands: false
      }
    ]
  };
}

function buildPromotionStagedApplyConfirmationLedgers({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-confirmation-ledgers/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    ledgers: [
      {
        id: "promotion-confirmation-ledger-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        status: "blocked",
        confirmationLedgerPath: "future/channels/alpha-to-beta/promotion-staged-apply-confirmation-ledger.json",
        confirmationWindows: [
          { id: "confirmation-window-alpha-to-beta-dispatch", label: "Dispatch acknowledgement closeout", owner: "security-reviewer", status: "planned" },
          { id: "confirmation-window-alpha-to-beta-freeze", label: "Freeze hold closeout", owner: "release-manager", status: "blocked" },
          { id: "confirmation-window-alpha-to-beta-apply", label: "Apply stage closeout", owner: "release-engineering", status: "blocked" },
          { id: "confirmation-window-alpha-to-beta-cutover", label: "Cutover checkpoint closeout", owner: "support-operator", status: "blocked" }
        ],
        confirmations: [
          {
            id: "promotion-confirmation-alpha-to-beta-dispatch",
            stageId: "command-sheet-alpha-to-beta-dispatch-intake",
            label: "Dispatch acknowledgement ledger close",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-dispatch-receipt-alpha-to-beta", "promotion-command-sheet-alpha-to-beta"]
          },
          {
            id: "promotion-confirmation-alpha-to-beta-freeze",
            stageId: "command-sheet-alpha-to-beta-freeze",
            label: "Freeze hold ledger close",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-alpha-to-beta", "promotion-runsheet-alpha-to-beta"]
          },
          {
            id: "promotion-confirmation-alpha-to-beta-apply",
            stageId: "command-sheet-alpha-to-beta-apply",
            label: "Apply confirmation ledger close",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-alpha-to-beta", "promotion-checkpoint-alpha-to-beta"]
          },
          {
            id: "promotion-confirmation-alpha-to-beta-cutover",
            stageId: "command-sheet-alpha-to-beta-cutover",
            label: "Cutover checkpoint ledger close",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-checklist-alpha-to-beta", "rollback-execution-record-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "dispatch receipt linked",
          "command sheet linked",
          "rollback execution checklist linked",
          "rollback execution record anchor declared"
        ],
        blockedBy: [
          "promotion staged-apply confirmation ledgers remain metadata-only",
          "promotion apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canConfirmStages: false
      },
      {
        id: "promotion-confirmation-ledger-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        status: "blocked",
        confirmationLedgerPath: "future/channels/beta-to-stable/promotion-staged-apply-confirmation-ledger.json",
        confirmationWindows: [
          { id: "confirmation-window-beta-to-stable-dispatch", label: "Dispatch acknowledgement closeout", owner: "security-reviewer", status: "blocked" },
          { id: "confirmation-window-beta-to-stable-freeze", label: "Freeze hold closeout", owner: "release-manager", status: "blocked" },
          { id: "confirmation-window-beta-to-stable-apply", label: "Apply stage closeout", owner: "release-engineering", status: "blocked" },
          { id: "confirmation-window-beta-to-stable-cutover", label: "Cutover checkpoint closeout", owner: "support-operator", status: "blocked" }
        ],
        confirmations: [
          {
            id: "promotion-confirmation-beta-to-stable-dispatch",
            stageId: "command-sheet-beta-to-stable-dispatch-intake",
            label: "Dispatch acknowledgement ledger close",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-dispatch-receipt-beta-to-stable", "promotion-command-sheet-beta-to-stable"]
          },
          {
            id: "promotion-confirmation-beta-to-stable-freeze",
            stageId: "command-sheet-beta-to-stable-freeze",
            label: "Freeze hold ledger close",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-beta-to-stable", "promotion-runsheet-beta-to-stable"]
          },
          {
            id: "promotion-confirmation-beta-to-stable-apply",
            stageId: "command-sheet-beta-to-stable-apply",
            label: "Apply confirmation ledger close",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-manifest-beta-to-stable", "promotion-checkpoint-beta-to-stable"]
          },
          {
            id: "promotion-confirmation-beta-to-stable-cutover",
            stageId: "command-sheet-beta-to-stable-cutover",
            label: "Cutover checkpoint ledger close",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-checklist-beta-to-stable", "rollback-execution-record-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "dispatch receipt linked",
          "command sheet linked",
          "rollback execution checklist linked",
          "rollback execution record anchor declared"
        ],
        blockedBy: [
          "promotion staged-apply confirmation ledgers remain metadata-only",
          "promotion apply remains non-executable",
          "rollback cutover remains non-executable",
          "host-side execution remains disabled"
        ],
        canConfirmStages: false
      }
    ]
  };
}

function buildPromotionStagedApplyCloseoutJournals({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-closeout-journals/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    journals: [
      {
        id: "promotion-closeout-journal-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-alpha-to-beta",
        status: "blocked",
        closeoutJournalPath: "future/channels/alpha-to-beta/promotion-staged-apply-closeout-journal.json",
        publishReadyPath: "future/channels/alpha-to-beta/promotion-staged-apply-closeout-summary.json",
        closeoutWindows: [
          { id: "closeout-window-alpha-to-beta-dispatch", label: "Dispatch stage closeout", owner: "security-reviewer", status: "planned" },
          { id: "closeout-window-alpha-to-beta-freeze", label: "Freeze stage closeout", owner: "release-manager", status: "blocked" },
          { id: "closeout-window-alpha-to-beta-apply", label: "Apply stage closeout", owner: "release-engineering", status: "blocked" },
          { id: "closeout-window-alpha-to-beta-cutover", label: "Cutover stage closeout", owner: "support-operator", status: "blocked" }
        ],
        journalEntries: [
          {
            id: "promotion-closeout-alpha-to-beta-dispatch",
            stageId: "command-sheet-alpha-to-beta-dispatch-intake",
            label: "Dispatch acknowledgement closeout seal",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["promotion-confirmation-ledger-alpha-to-beta", "attestation-reconciliation-ledger-alpha-to-beta"]
          },
          {
            id: "promotion-closeout-alpha-to-beta-freeze",
            stageId: "command-sheet-alpha-to-beta-freeze",
            label: "Freeze hold closeout seal",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-confirmation-ledger-alpha-to-beta", "attestation-reconciliation-ledger-alpha-to-beta"]
          },
          {
            id: "promotion-closeout-alpha-to-beta-apply",
            stageId: "command-sheet-alpha-to-beta-apply",
            label: "Apply stage closeout seal",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-confirmation-ledger-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          },
          {
            id: "promotion-closeout-alpha-to-beta-cutover",
            stageId: "command-sheet-alpha-to-beta-cutover",
            label: "Cutover baton closeout",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-execution-record-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "reconciliation ledger linked",
          "confirmation ledger linked",
          "rollback outcome report anchor declared",
          "publish-ready closeout path declared"
        ],
        blockedBy: [
          "promotion staged-apply closeout journals remain metadata-only",
          "promotion apply remains non-executable",
          "rollback cutover outcome reporting remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseStages: false
      },
      {
        id: "promotion-closeout-journal-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-beta-to-stable",
        status: "blocked",
        closeoutJournalPath: "future/channels/beta-to-stable/promotion-staged-apply-closeout-journal.json",
        publishReadyPath: "future/channels/beta-to-stable/promotion-staged-apply-closeout-summary.json",
        closeoutWindows: [
          { id: "closeout-window-beta-to-stable-dispatch", label: "Dispatch stage closeout", owner: "security-reviewer", status: "blocked" },
          { id: "closeout-window-beta-to-stable-freeze", label: "Freeze stage closeout", owner: "release-manager", status: "blocked" },
          { id: "closeout-window-beta-to-stable-apply", label: "Apply stage closeout", owner: "release-engineering", status: "blocked" },
          { id: "closeout-window-beta-to-stable-cutover", label: "Cutover baton closeout", owner: "support-operator", status: "blocked" }
        ],
        journalEntries: [
          {
            id: "promotion-closeout-beta-to-stable-dispatch",
            stageId: "command-sheet-beta-to-stable-dispatch-intake",
            label: "Dispatch acknowledgement closeout seal",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["promotion-confirmation-ledger-beta-to-stable", "attestation-reconciliation-ledger-beta-to-stable"]
          },
          {
            id: "promotion-closeout-beta-to-stable-freeze",
            stageId: "command-sheet-beta-to-stable-freeze",
            label: "Freeze hold closeout seal",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-confirmation-ledger-beta-to-stable", "attestation-reconciliation-ledger-beta-to-stable"]
          },
          {
            id: "promotion-closeout-beta-to-stable-apply",
            stageId: "command-sheet-beta-to-stable-apply",
            label: "Apply stage closeout seal",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["promotion-confirmation-ledger-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          },
          {
            id: "promotion-closeout-beta-to-stable-cutover",
            stageId: "command-sheet-beta-to-stable-cutover",
            label: "Cutover baton closeout",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-execution-record-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "reconciliation ledger linked",
          "confirmation ledger linked",
          "rollback outcome report anchor declared",
          "publish-ready closeout path declared"
        ],
        blockedBy: [
          "promotion staged-apply closeout journals remain metadata-only",
          "promotion apply remains non-executable",
          "rollback cutover outcome reporting remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseStages: false
      }
    ]
  };
}

function buildPromotionStagedApplySignoffSheets({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-signoff-sheets/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    signoffSheets: [
      {
        id: "promotion-signoff-sheet-alpha-to-beta",
        from: "alpha",
        to: "beta",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-alpha-to-beta",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-alpha-to-beta",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-alpha-to-beta",
        releaseApprovalStageId: "approval-promotion-apply",
        publishGateId: "gate-promotion-staged-apply-signoff-sheets",
        status: "blocked",
        signoffSheetPath: "future/channels/alpha-to-beta/promotion-staged-apply-signoff-sheet.json",
        decisionLedgerPath: "future/channels/alpha-to-beta/promotion-staged-apply-signoff-decisions.json",
        releaseReadyPacketPath: "future/channels/alpha-to-beta/promotion-staged-apply-release-ready-packet.json",
        signoffs: [
          {
            id: "promotion-signoff-alpha-to-beta-security",
            label: "Operator settlement acknowledgement",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["attestation-settlement-pack-alpha-to-beta", "promotion-closeout-journal-alpha-to-beta"]
          },
          {
            id: "promotion-signoff-alpha-to-beta-release-manager",
            label: "Freeze and rollout signoff",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-closeout-journal-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          },
          {
            id: "promotion-signoff-alpha-to-beta-release-engineering",
            label: "Apply window signoff",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["attestation-settlement-pack-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          },
          {
            id: "promotion-signoff-alpha-to-beta-product-owner",
            label: "Promotion go/no-go signoff",
            owner: "product-owner",
            status: "blocked",
            evidence: ["promotion-closeout-journal-alpha-to-beta", "rollback-outcome-report-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "attestation settlement pack linked",
          "promotion closeout journal linked",
          "rollback outcome report linked",
          "release-ready packet path declared"
        ],
        blockedBy: [
          "promotion staged-apply signoff sheets remain metadata-only",
          "attestation operator settlement packs remain metadata-only",
          "publish gating remains non-executable",
          "host-side execution remains disabled"
        ],
        canSignOff: false
      },
      {
        id: "promotion-signoff-sheet-beta-to-stable",
        from: "beta",
        to: "stable",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-beta-to-stable",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-beta-to-stable",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-beta-to-stable",
        releaseApprovalStageId: "approval-promotion-apply",
        publishGateId: "gate-promotion-staged-apply-signoff-sheets",
        status: "blocked",
        signoffSheetPath: "future/channels/beta-to-stable/promotion-staged-apply-signoff-sheet.json",
        decisionLedgerPath: "future/channels/beta-to-stable/promotion-staged-apply-signoff-decisions.json",
        releaseReadyPacketPath: "future/channels/beta-to-stable/promotion-staged-apply-release-ready-packet.json",
        signoffs: [
          {
            id: "promotion-signoff-beta-to-stable-security",
            label: "Operator settlement acknowledgement",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["attestation-settlement-pack-beta-to-stable", "promotion-closeout-journal-beta-to-stable"]
          },
          {
            id: "promotion-signoff-beta-to-stable-release-manager",
            label: "Freeze and rollout signoff",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-closeout-journal-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          },
          {
            id: "promotion-signoff-beta-to-stable-release-engineering",
            label: "Apply window signoff",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["attestation-settlement-pack-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          },
          {
            id: "promotion-signoff-beta-to-stable-product-owner",
            label: "Promotion go/no-go signoff",
            owner: "product-owner",
            status: "blocked",
            evidence: ["promotion-closeout-journal-beta-to-stable", "rollback-outcome-report-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "attestation settlement pack linked",
          "promotion closeout journal linked",
          "rollback outcome report linked",
          "release-ready packet path declared"
        ],
        blockedBy: [
          "promotion staged-apply signoff sheets remain metadata-only",
          "attestation operator settlement packs remain metadata-only",
          "publish gating remains non-executable",
          "host-side execution remains disabled"
        ],
        canSignOff: false
      }
    ]
  };
}

function buildPromotionStagedApplyReleaseDecisionEnforcementContracts({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-release-decision-enforcement-contracts/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    contracts: [
      {
        id: "promotion-release-decision-enforcement-contract-alpha-to-beta",
        from: "alpha",
        to: "beta",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-alpha-to-beta",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-alpha-to-beta",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-alpha-to-beta",
        releaseApprovalStageId: "approval-decision-receipts",
        promotionHandshakeStageId: "promotion-handshake-staged-release-decision-enforcement-contracts",
        publishGateId: "gate-promotion-staged-apply-release-decision-enforcement-contracts",
        status: "blocked",
        decisionEnforcementContractPath: "future/channels/alpha-to-beta/promotion-staged-release-decision-enforcement-contract.json",
        enforcementWindowPath: "future/channels/alpha-to-beta/promotion-staged-release-decision-enforcement-window.json",
        publishRouteContractPath: "future/channels/alpha-to-beta/promotion-staged-release-route-contract.json",
        decisions: [
          {
            id: "promotion-release-decision-alpha-to-beta-security",
            label: "Security enforcement contract",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["promotion-signoff-sheet-alpha-to-beta", "attestation-approval-routing-contract-alpha-to-beta"]
          },
          {
            id: "promotion-release-decision-alpha-to-beta-release-manager",
            label: "Staged release guard contract",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-alpha-to-beta", "rollback-publication-bundle-alpha-to-beta"]
          },
          {
            id: "promotion-release-decision-alpha-to-beta-release-engineering",
            label: "Publish-route enforcement contract",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-alpha-to-beta", "rollback-publication-bundle-alpha-to-beta"]
          },
          {
            id: "promotion-release-decision-alpha-to-beta-product-owner",
            label: "Promotion target enforcement contract",
            owner: "product-owner",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-alpha-to-beta", "attestation-approval-routing-contract-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "promotion signoff sheet linked",
          "approval routing contract linked",
          "rollback publication bundle linked",
          "enforcement window path declared",
          "publish route contract path declared"
        ],
        blockedBy: [
          "promotion staged-apply release decision enforcement contracts remain metadata-only",
          "release approval remains non-executable",
          "promotion gating remains non-executable",
          "host-side execution remains disabled"
        ],
        canEnforceDecision: false
      },
      {
        id: "promotion-release-decision-enforcement-contract-beta-to-stable",
        from: "beta",
        to: "stable",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-beta-to-stable",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-beta-to-stable",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-beta-to-stable",
        releaseApprovalStageId: "approval-decision-receipts",
        promotionHandshakeStageId: "promotion-handshake-staged-release-decision-enforcement-contracts",
        publishGateId: "gate-promotion-staged-apply-release-decision-enforcement-contracts",
        status: "blocked",
        decisionEnforcementContractPath: "future/channels/beta-to-stable/promotion-staged-release-decision-enforcement-contract.json",
        enforcementWindowPath: "future/channels/beta-to-stable/promotion-staged-release-decision-enforcement-window.json",
        publishRouteContractPath: "future/channels/beta-to-stable/promotion-staged-release-route-contract.json",
        decisions: [
          {
            id: "promotion-release-decision-beta-to-stable-security",
            label: "Security enforcement contract",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-beta-to-stable", "attestation-approval-routing-contract-beta-to-stable"]
          },
          {
            id: "promotion-release-decision-beta-to-stable-release-manager",
            label: "Staged release guard contract",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-beta-to-stable", "rollback-publication-bundle-beta-to-stable"]
          },
          {
            id: "promotion-release-decision-beta-to-stable-release-engineering",
            label: "Publish-route enforcement contract",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-beta-to-stable", "rollback-publication-bundle-beta-to-stable"]
          },
          {
            id: "promotion-release-decision-beta-to-stable-product-owner",
            label: "Promotion target enforcement contract",
            owner: "product-owner",
            status: "blocked",
            evidence: ["promotion-signoff-sheet-beta-to-stable", "attestation-approval-routing-contract-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "promotion signoff sheet linked",
          "approval routing contract linked",
          "rollback publication bundle linked",
          "enforcement window path declared",
          "publish route contract path declared"
        ],
        blockedBy: [
          "promotion staged-apply release decision enforcement contracts remain metadata-only",
          "release approval remains non-executable",
          "promotion gating remains non-executable",
          "host-side execution remains disabled"
        ],
        canEnforceDecision: false
      }
    ]
  };
}

function buildPromotionStagedApplyReleaseDecisionEnforcementLifecycle({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-promotion-staged-apply-release-decision-enforcement-lifecycle/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    lifecycles: [
      {
        id: "promotion-release-decision-enforcement-lifecycle-alpha-to-beta",
        from: "alpha",
        to: "beta",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-alpha-to-beta",
        attestationOperatorApprovalOrchestrationId: "attestation-approval-orchestration-alpha-to-beta",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-alpha-to-beta",
        releaseApprovalStageId: "approval-decision-receipts",
        promotionHandshakeStageId: "promotion-handshake-staged-release-decision-enforcement-lifecycle",
        publishGateId: "gate-promotion-staged-apply-release-decision-enforcement-lifecycle",
        status: "blocked",
        lifecyclePath: "future/channels/alpha-to-beta/promotion-staged-release-decision-enforcement-lifecycle.json",
        lifecycleLedgerPath: "future/channels/alpha-to-beta/promotion-staged-release-decision-enforcement-lifecycle-ledger.json",
        lifecycleCloseoutPath: "future/channels/alpha-to-beta/promotion-staged-release-decision-enforcement-lifecycle-closeout.json",
        lifecyclePhases: [
          {
            id: "promotion-release-decision-lifecycle-alpha-to-beta-intake",
            label: "Decision intake lifecycle",
            owner: "security-reviewer",
            status: "planned",
            evidence: ["promotion-release-decision-enforcement-contract-alpha-to-beta", "attestation-approval-orchestration-alpha-to-beta"]
          },
          {
            id: "promotion-release-decision-lifecycle-alpha-to-beta-window",
            label: "Enforcement window lifecycle",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-release-decision-enforcement-contract-alpha-to-beta", "rollback-publication-receipt-closeout-contract-alpha-to-beta"]
          },
          {
            id: "promotion-release-decision-lifecycle-alpha-to-beta-closeout",
            label: "Lifecycle expiry closeout",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["attestation-approval-orchestration-alpha-to-beta", "rollback-publication-receipt-closeout-contract-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "release decision enforcement contract linked",
          "approval orchestration linked",
          "publication receipt closeout contract linked",
          "lifecycle ledger path declared",
          "lifecycle closeout path declared"
        ],
        blockedBy: [
          "promotion staged-apply release decision enforcement lifecycle remains metadata-only",
          "release approval remains non-executable",
          "promotion gating remains non-executable",
          "host-side execution remains disabled"
        ],
        canAdvanceLifecycle: false
      },
      {
        id: "promotion-release-decision-enforcement-lifecycle-beta-to-stable",
        from: "beta",
        to: "stable",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-beta-to-stable",
        attestationOperatorApprovalOrchestrationId: "attestation-approval-orchestration-beta-to-stable",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-beta-to-stable",
        releaseApprovalStageId: "approval-decision-receipts",
        promotionHandshakeStageId: "promotion-handshake-staged-release-decision-enforcement-lifecycle",
        publishGateId: "gate-promotion-staged-apply-release-decision-enforcement-lifecycle",
        status: "blocked",
        lifecyclePath: "future/channels/beta-to-stable/promotion-staged-release-decision-enforcement-lifecycle.json",
        lifecycleLedgerPath: "future/channels/beta-to-stable/promotion-staged-release-decision-enforcement-lifecycle-ledger.json",
        lifecycleCloseoutPath: "future/channels/beta-to-stable/promotion-staged-release-decision-enforcement-lifecycle-closeout.json",
        lifecyclePhases: [
          {
            id: "promotion-release-decision-lifecycle-beta-to-stable-intake",
            label: "Decision intake lifecycle",
            owner: "security-reviewer",
            status: "blocked",
            evidence: ["promotion-release-decision-enforcement-contract-beta-to-stable", "attestation-approval-orchestration-beta-to-stable"]
          },
          {
            id: "promotion-release-decision-lifecycle-beta-to-stable-window",
            label: "Enforcement window lifecycle",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-release-decision-enforcement-contract-beta-to-stable", "rollback-publication-receipt-closeout-contract-beta-to-stable"]
          },
          {
            id: "promotion-release-decision-lifecycle-beta-to-stable-closeout",
            label: "Lifecycle expiry closeout",
            owner: "release-engineering",
            status: "blocked",
            evidence: ["attestation-approval-orchestration-beta-to-stable", "rollback-publication-receipt-closeout-contract-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "release decision enforcement contract linked",
          "approval orchestration linked",
          "publication receipt closeout contract linked",
          "lifecycle ledger path declared",
          "lifecycle closeout path declared"
        ],
        blockedBy: [
          "promotion staged-apply release decision enforcement lifecycle remains metadata-only",
          "release approval remains non-executable",
          "promotion gating remains non-executable",
          "host-side execution remains disabled"
        ],
        canAdvanceLifecycle: false
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
    attestationVerificationPacksPath: "release/ATTESTATION-VERIFICATION-PACKS.json",
    attestationApplyAuditPacksPath: "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    attestationApplyExecutionPacketsPath: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    attestationOperatorWorklistsPath: "release/ATTESTATION-OPERATOR-WORKLISTS.json",
    attestationOperatorDispatchManifestsPath: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    attestationOperatorDispatchPacketsPath: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    attestationOperatorDispatchReceiptsPath: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    attestationOperatorReconciliationLedgersPath: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    attestationOperatorSettlementPacksPath: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    attestationOperatorApprovalRoutingContractsPath: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    attestationOperatorApprovalOrchestrationPath: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    promotionStagedApplyRunsheetsPath: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    promotionStagedApplyCommandSheetsPath: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    promotionStagedApplyConfirmationLedgersPath: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    promotionStagedApplyCloseoutJournalsPath: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    promotionStagedApplySignoffSheetsPath: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    promotionStagedApplyReleaseDecisionEnforcementContractsPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    promotionStagedApplyReleaseDecisionEnforcementLifecyclePath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    rollbackCutoverHandoffPlansPath: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    rollbackCutoverExecutionChecklistsPath: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    rollbackCutoverExecutionRecordsPath: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    rollbackCutoverOutcomeReportsPath: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    rollbackCutoverPublicationBundlesPath: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    rollbackCutoverPublicationReceiptCloseoutContractsPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    rollbackCutoverPublicationReceiptSettlementCloseoutPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
    participants: ["release-engineering", "security", "release-manager", "product-owner"],
    request: {
      id: "signing-publish-handshake-request",
      status: "planned",
      fields: [
        { id: "request-phase", label: "Phase", required: true },
        { id: "request-package-id", label: "Package id", required: true },
        { id: "request-bundle-seal", label: "Bundle sealing evidence", required: true },
        { id: "request-bundle-integrity", label: "Sealed-bundle integrity contract", required: true },
        { id: "request-attestation-verification-packs", label: "Attestation verification packs", required: true },
        { id: "request-attestation-apply-audit-packs", label: "Attestation apply audit packs", required: true },
        { id: "request-attestation-apply-execution-packets", label: "Attestation apply execution packets", required: true },
        { id: "request-attestation-operator-worklists", label: "Attestation operator worklists", required: true },
        { id: "request-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests", required: true },
        { id: "request-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets", required: true },
        { id: "request-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts", required: true },
        { id: "request-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers", required: true },
        { id: "request-attestation-operator-settlement-packs", label: "Attestation operator settlement packs", required: true },
        { id: "request-attestation-operator-approval-routing-contracts", label: "Attestation operator approval routing contracts", required: true },
        { id: "request-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration", required: true },
        { id: "request-channel-route", label: "Channel route", required: true },
        { id: "request-channel-promotion-evidence", label: "Channel promotion evidence", required: true },
        { id: "request-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets", required: true },
        { id: "request-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets", required: true },
        { id: "request-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers", required: true },
        { id: "request-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals", required: true },
        { id: "request-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets", required: true },
        { id: "request-promotion-staged-apply-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts", required: true },
        { id: "request-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle", required: true },
        { id: "request-signing-evidence", label: "Signing evidence", required: true },
        { id: "request-publish-gates", label: "Publish gates", required: true },
        { id: "request-publish-rollback", label: "Publish rollback handshake", required: true },
        { id: "request-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans", required: true },
        { id: "request-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists", required: true },
        { id: "request-rollback-cutover-execution-records", label: "Rollback cutover execution records", required: true },
        { id: "request-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports", required: true },
        { id: "request-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles", required: true },
        { id: "request-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts", required: true },
        { id: "request-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout", required: true },
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
      { id: "ack-attestation-verification", label: "Attestation verification packs reviewed", status: "planned", artifact: "release/ATTESTATION-VERIFICATION-PACKS.json" },
      { id: "ack-attestation-apply-audit", label: "Attestation apply audit packs reviewed", status: "planned", artifact: "release/ATTESTATION-APPLY-AUDIT-PACKS.json" },
      { id: "ack-attestation-apply-execution", label: "Attestation apply execution packets reviewed", status: "planned", artifact: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" },
      { id: "ack-attestation-operator-worklists", label: "Attestation operator worklists reviewed", status: "planned", artifact: "release/ATTESTATION-OPERATOR-WORKLISTS.json" },
      { id: "ack-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" },
      { id: "ack-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" },
      { id: "ack-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" },
      { id: "ack-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" },
      { id: "ack-attestation-operator-settlement-packs", label: "Attestation operator settlement packs reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" },
      { id: "ack-attestation-operator-approval-routing-contracts", label: "Attestation operator approval routing contracts reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" },
      { id: "ack-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" },
      { id: "ack-builders", label: "Installer builder execution reviewed", status: "planned", artifact: "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json" },
      { id: "ack-channel-routing", label: "Installer channel routing reviewed", status: "planned", artifact: "release/INSTALLER-CHANNEL-ROUTING.json" },
      { id: "ack-channel-promotion-evidence", label: "Channel promotion evidence reviewed", status: "planned", artifact: "release/CHANNEL-PROMOTION-EVIDENCE.json" },
      { id: "ack-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" },
      { id: "ack-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" },
      { id: "ack-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" },
      { id: "ack-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" },
      { id: "ack-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" },
      { id: "ack-promotion-staged-apply-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" },
      { id: "ack-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" },
      { id: "ack-signing", label: "Signing evidence reviewed", status: "blocked", artifact: "release/SIGNING-METADATA.json" },
      { id: "ack-publish", label: "Publish and promotion gates reviewed", status: "blocked", artifact: "release/PUBLISH-GATES.json" },
      { id: "ack-publish-rollback", label: "Publish rollback handshake reviewed", status: "blocked", artifact: "release/PUBLISH-ROLLBACK-HANDSHAKE.json" },
      { id: "ack-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" },
      { id: "ack-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" },
      { id: "ack-rollback-cutover-execution-records", label: "Rollback cutover execution records reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" }
      ,
      { id: "ack-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" },
      { id: "ack-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" },
      { id: "ack-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" }
      ,
      { id: "ack-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" }
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
        id: "handshake-attestation-verification",
        label: "Attestation verification pack review",
        status: "planned",
        evidence: ["release/INTEGRITY-ATTESTATION-EVIDENCE.json", "release/ATTESTATION-VERIFICATION-PACKS.json"]
      },
      {
        id: "handshake-attestation-apply-audit",
        label: "Attestation apply audit pack review",
        status: "planned",
        evidence: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"]
      },
      {
        id: "handshake-attestation-apply-execution",
        label: "Attestation apply execution packet review",
        status: "planned",
        evidence: ["release/ATTESTATION-APPLY-AUDIT-PACKS.json", "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json"]
      },
      {
        id: "handshake-attestation-operator-worklists",
        label: "Attestation operator worklist review",
        status: "planned",
        evidence: ["release/ATTESTATION-APPLY-EXECUTION-PACKETS.json", "release/ATTESTATION-OPERATOR-WORKLISTS.json"]
      },
      {
        id: "handshake-attestation-operator-dispatch-manifests",
        label: "Attestation operator dispatch manifest review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-WORKLISTS.json", "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json"]
      },
      {
        id: "handshake-attestation-operator-dispatch-packets",
        label: "Attestation operator dispatch packet review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json", "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json"]
      },
      {
        id: "handshake-attestation-operator-dispatch-receipts",
        label: "Attestation operator dispatch receipt review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json", "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json"]
      },
      {
        id: "handshake-attestation-operator-reconciliation-ledgers",
        label: "Attestation operator reconciliation ledger review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json", "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json"]
      },
      {
        id: "handshake-attestation-operator-settlement-packs",
        label: "Attestation operator settlement pack review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json", "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json"]
      },
      {
        id: "handshake-attestation-operator-approval-routing-contracts",
        label: "Attestation operator approval routing contract review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json", "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"]
      },
      {
        id: "handshake-attestation-operator-approval-orchestration",
        label: "Attestation operator approval orchestration review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json", "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"]
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
        id: "handshake-promotion-staged-apply-runsheets",
        label: "Promotion staged-apply runsheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-LEDGERS.json", "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json"]
      },
      {
        id: "handshake-promotion-staged-apply-command-sheets",
        label: "Promotion staged-apply command sheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RUNSHEETS.json", "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json"]
      },
      {
        id: "handshake-promotion-staged-apply-confirmation-ledgers",
        label: "Promotion staged-apply confirmation ledger review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json", "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json"]
      },
      {
        id: "handshake-promotion-staged-apply-closeout-journals",
        label: "Promotion staged-apply closeout journal review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json", "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json"]
      },
      {
        id: "handshake-promotion-staged-apply-signoff-sheets",
        label: "Promotion staged-apply signoff sheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json", "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json"]
      },
      {
        id: "handshake-promotion-staged-apply-release-decision-enforcement-contracts",
        label: "Promotion staged-apply release decision enforcement contract review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json", "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json"]
      },
      {
        id: "handshake-promotion-staged-apply-release-decision-enforcement-lifecycle",
        label: "Promotion staged-apply release decision enforcement lifecycle review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json", "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"]
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
      },
      {
        id: "handshake-rollback-cutover-handoff-plans",
        label: "Rollback cutover handoff plan review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-READINESS-MAPS.json", "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json"]
      },
      {
        id: "handshake-rollback-cutover-execution-checklists",
        label: "Rollback cutover execution checklist review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json", "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json"]
      },
      {
        id: "handshake-rollback-cutover-execution-records",
        label: "Rollback cutover execution record review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json", "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json"]
      },
      {
        id: "handshake-rollback-cutover-outcome-reports",
        label: "Rollback cutover outcome report review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json", "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json"]
      },
      {
        id: "handshake-rollback-cutover-publication-bundles",
        label: "Rollback cutover publication bundle review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json", "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json"]
      },
      {
        id: "handshake-rollback-cutover-publication-receipt-closeout-contracts",
        label: "Rollback cutover publication receipt closeout contract review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json", "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"]
      },
      {
        id: "handshake-rollback-cutover-publication-receipt-settlement-closeout",
        label: "Rollback cutover publication receipt settlement closeout review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json", "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"]
      }
    ],
    linkedArtifacts: [
      "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
      "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
      "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
      "release/ATTESTATION-VERIFICATION-PACKS.json",
      "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
      "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
      "release/ATTESTATION-OPERATOR-WORKLISTS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
      "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
      "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
      "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
      "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
      "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
      "release/INSTALLER-CHANNEL-ROUTING.json",
      "release/CHANNEL-PROMOTION-EVIDENCE.json",
      "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
      "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
      "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
      "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
      "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
      "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
      "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
      "release/SIGNING-METADATA.json",
      "release/SIGNING-PUBLISH-PIPELINE.json",
      "release/PUBLISH-GATES.json",
      "release/PROMOTION-GATES.json",
      "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
      "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
      "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
      "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
      "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
      "release/RELEASE-APPROVAL-WORKFLOW.json"
    ],
    blockedBy: [
      "signing and notarization remain metadata-only",
      "artifact upload remains blocked",
      "attestation operator approval routing contracts remain metadata-only",
      "attestation operator approval orchestration remains metadata-only",
      "promotion staged-apply release decision enforcement contracts remain metadata-only",
      "promotion staged-apply release decision enforcement lifecycle remains metadata-only",
      "rollback cutover publication receipt closeout contracts remain metadata-only",
      "rollback cutover publication receipt settlement closeout remains metadata-only",
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
    attestationVerificationPacksPath: "release/ATTESTATION-VERIFICATION-PACKS.json",
    attestationApplyAuditPacksPath: "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    attestationApplyExecutionPacketsPath: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    attestationOperatorWorklistsPath: "release/ATTESTATION-OPERATOR-WORKLISTS.json",
    attestationOperatorDispatchManifestsPath: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    attestationOperatorDispatchPacketsPath: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    attestationOperatorDispatchReceiptsPath: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    attestationOperatorReconciliationLedgersPath: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    attestationOperatorSettlementPacksPath: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    attestationOperatorApprovalRoutingContractsPath: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    attestationOperatorApprovalOrchestrationPath: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    gatingHandshakePath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    approvalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    channelRoutingPath: "release/INSTALLER-CHANNEL-ROUTING.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    promotionApplyManifestsPath: "release/PROMOTION-APPLY-MANIFESTS.json",
    promotionExecutionCheckpointsPath: "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
    promotionOperatorHandoffRailsPath: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    promotionStagedApplyLedgersPath: "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
    promotionStagedApplyRunsheetsPath: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    promotionStagedApplyCommandSheetsPath: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    promotionStagedApplyConfirmationLedgersPath: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    promotionStagedApplyCloseoutJournalsPath: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    promotionStagedApplySignoffSheetsPath: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    promotionStagedApplyReleaseDecisionEnforcementContractsPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    promotionStagedApplyReleaseDecisionEnforcementLifecyclePath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    promotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    rollbackExecutionRehearsalLedgerPath: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
    rollbackOperatorDrillbooksPath: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
    rollbackLiveReadinessContractsPath: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    rollbackCutoverReadinessMapsPath: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
    rollbackCutoverHandoffPlansPath: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    rollbackCutoverExecutionChecklistsPath: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    rollbackCutoverExecutionRecordsPath: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    rollbackCutoverOutcomeReportsPath: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    rollbackCutoverPublicationBundlesPath: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    rollbackCutoverPublicationReceiptCloseoutContractsPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    rollbackCutoverPublicationReceiptSettlementCloseoutPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
    stages: [
      { id: "pipeline-packaged-app-directory-materialization", label: "Packaged-app directory materialization", status: "planned" },
      { id: "pipeline-packaged-app-staged-output", label: "Packaged-app staged output skeleton", status: "planned" },
      { id: "pipeline-packaged-app-bundle-sealing", label: "Packaged-app bundle sealing skeleton", status: "planned" },
      { id: "pipeline-sealed-bundle-integrity", label: "Sealed-bundle integrity contract", status: "planned" },
      { id: "pipeline-attestation-verification-packs", label: "Attestation verification packs", status: "planned" },
      { id: "pipeline-attestation-apply-audit-packs", label: "Attestation apply audit packs", status: "planned" },
      { id: "pipeline-attestation-apply-execution-packets", label: "Attestation apply execution packets", status: "planned" },
      { id: "pipeline-attestation-operator-worklists", label: "Attestation operator worklists", status: "planned" },
      { id: "pipeline-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests", status: "blocked" },
      { id: "pipeline-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets", status: "blocked" },
      { id: "pipeline-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts", status: "blocked" },
      { id: "pipeline-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers", status: "blocked" },
      { id: "pipeline-attestation-operator-settlement-packs", label: "Attestation operator settlement packs", status: "blocked" },
      { id: "pipeline-attestation-operator-approval-routing-contracts", label: "Attestation operator approval routing contracts", status: "blocked" },
      { id: "pipeline-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration", status: "blocked" },
      { id: "pipeline-installer-builder-execution", label: "Installer builder execution skeleton", status: "planned" },
      { id: "pipeline-installer-builder-orchestration", label: "Installer builder orchestration", status: "planned" },
      { id: "pipeline-installer-channel-routing", label: "Installer channel routing", status: "planned" },
      { id: "pipeline-channel-promotion-evidence", label: "Channel promotion evidence", status: "planned" },
      { id: "pipeline-promotion-apply-manifests", label: "Promotion apply manifests", status: "planned" },
      { id: "pipeline-promotion-execution-checkpoints", label: "Promotion execution checkpoints", status: "blocked" },
      { id: "pipeline-promotion-operator-handoff-rails", label: "Promotion operator handoff rails", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-ledgers", label: "Promotion staged-apply ledgers", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts", status: "blocked" },
      { id: "pipeline-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle", status: "blocked" },
      { id: "pipeline-signing-metadata", label: "Signing-ready metadata", status: "ready" },
      { id: "pipeline-notarization", label: "Notarization planning", status: "blocked" },
      { id: "pipeline-checksums", label: "Checksum publication", status: "blocked" },
      { id: "pipeline-release-notes", label: "Release notes", status: "planned" },
      { id: "pipeline-gating-handshake", label: "Signing-publish gating handshake", status: "planned" },
      { id: "pipeline-approval-bridge", label: "Signing-publish approval bridge", status: "planned" },
      { id: "pipeline-promotion-handshake", label: "Signing-publish promotion handshake", status: "planned" },
      { id: "pipeline-publish-rollback-handshake", label: "Publish rollback handshake", status: "blocked" },
      { id: "pipeline-rollback-execution-rehearsal-ledger", label: "Rollback execution rehearsal ledger", status: "blocked" },
      { id: "pipeline-rollback-operator-drillbooks", label: "Rollback operator drillbooks", status: "blocked" },
      { id: "pipeline-rollback-live-readiness-contracts", label: "Rollback live-readiness contracts", status: "blocked" },
      { id: "pipeline-rollback-cutover-readiness-maps", label: "Rollback cutover readiness maps", status: "blocked" },
      { id: "pipeline-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans", status: "blocked" },
      { id: "pipeline-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists", status: "blocked" },
      { id: "pipeline-rollback-cutover-execution-records", label: "Rollback cutover execution records", status: "blocked" },
      { id: "pipeline-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports", status: "blocked" },
      { id: "pipeline-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles", status: "blocked" },
      { id: "pipeline-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts", status: "blocked" },
      { id: "pipeline-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout", status: "blocked" },
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
      { id: "bridge-integrity-attestation-to-verification-packs", from: "release/INTEGRITY-ATTESTATION-EVIDENCE.json", to: "release/ATTESTATION-VERIFICATION-PACKS.json", status: "planned" },
      { id: "bridge-verification-packs-to-apply-audit-packs", from: "release/ATTESTATION-VERIFICATION-PACKS.json", to: "release/ATTESTATION-APPLY-AUDIT-PACKS.json", status: "planned" },
      { id: "bridge-apply-audit-packs-to-execution-packets", from: "release/ATTESTATION-APPLY-AUDIT-PACKS.json", to: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json", status: "planned" },
      { id: "bridge-apply-execution-packets-to-operator-worklists", from: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json", to: "release/ATTESTATION-OPERATOR-WORKLISTS.json", status: "planned" },
      { id: "bridge-operator-worklists-to-dispatch-manifests", from: "release/ATTESTATION-OPERATOR-WORKLISTS.json", to: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json", status: "blocked" },
      { id: "bridge-dispatch-manifests-to-dispatch-packets", from: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json", to: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json", status: "blocked" },
      { id: "bridge-dispatch-packets-to-dispatch-receipts", from: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json", to: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json", status: "blocked" },
      { id: "bridge-dispatch-receipts-to-reconciliation-ledgers", from: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json", to: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json", status: "blocked" },
      { id: "bridge-reconciliation-ledgers-to-settlement-packs", from: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json", to: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json", status: "blocked" },
      { id: "bridge-settlement-packs-to-approval-routing-contracts", from: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json", to: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json", status: "blocked" },
      { id: "bridge-approval-routing-contracts-to-approval-orchestration", from: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json", to: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json", status: "blocked" },
      { id: "bridge-approval-orchestration-to-gating", from: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json", to: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json", status: "blocked" },
      { id: "bridge-signing-to-approval", from: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json", to: "release/RELEASE-APPROVAL-WORKFLOW.json", status: "blocked" },
      { id: "bridge-approval-to-channel-routing", from: "release/RELEASE-APPROVAL-WORKFLOW.json", to: "release/INSTALLER-CHANNEL-ROUTING.json", status: "blocked" },
      { id: "bridge-channel-routing-to-promotion-evidence", from: "release/INSTALLER-CHANNEL-ROUTING.json", to: "release/CHANNEL-PROMOTION-EVIDENCE.json", status: "blocked" },
      { id: "bridge-promotion-evidence-to-apply-manifests", from: "release/CHANNEL-PROMOTION-EVIDENCE.json", to: "release/PROMOTION-APPLY-MANIFESTS.json", status: "blocked" },
      { id: "bridge-apply-manifests-to-execution-checkpoints", from: "release/PROMOTION-APPLY-MANIFESTS.json", to: "release/PROMOTION-EXECUTION-CHECKPOINTS.json", status: "blocked" },
      { id: "bridge-execution-checkpoints-to-operator-handoff-rails", from: "release/PROMOTION-EXECUTION-CHECKPOINTS.json", to: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json", status: "blocked" },
      { id: "bridge-operator-handoff-rails-to-staged-apply-ledgers", from: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json", to: "release/PROMOTION-STAGED-APPLY-LEDGERS.json", status: "blocked" },
      { id: "bridge-staged-apply-ledgers-to-runsheets", from: "release/PROMOTION-STAGED-APPLY-LEDGERS.json", to: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json", status: "blocked" },
      { id: "bridge-runsheets-to-command-sheets", from: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json", to: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json", status: "blocked" },
      { id: "bridge-command-sheets-to-confirmation-ledgers", from: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json", to: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json", status: "blocked" },
      { id: "bridge-confirmation-ledgers-to-closeout-journals", from: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json", to: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json", status: "blocked" },
      { id: "bridge-closeout-journals-to-signoff-sheets", from: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json", to: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json", status: "blocked" },
      { id: "bridge-signoff-sheets-to-release-decision-enforcement-contracts", from: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json", to: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json", status: "blocked" },
      { id: "bridge-release-decision-enforcement-contracts-to-lifecycle", from: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json", to: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json", status: "blocked" },
      { id: "bridge-release-decision-enforcement-lifecycle-to-promotion-handshake", from: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json", to: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json", status: "blocked" },
      { id: "bridge-promotion-handshake-to-publish-rollback", from: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json", to: "release/PUBLISH-ROLLBACK-HANDSHAKE.json", status: "blocked" },
      { id: "bridge-publish-rollback-to-rollback-rehearsal", from: "release/PUBLISH-ROLLBACK-HANDSHAKE.json", to: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json", status: "blocked" },
      { id: "bridge-rollback-rehearsal-to-operator-drillbooks", from: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json", to: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json", status: "blocked" },
      { id: "bridge-operator-drillbooks-to-live-readiness-contracts", from: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json", to: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json", status: "blocked" },
      { id: "bridge-live-readiness-contracts-to-cutover-readiness-maps", from: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json", to: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json", status: "blocked" },
      { id: "bridge-cutover-readiness-maps-to-handoff-plans", from: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json", to: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json", status: "blocked" },
      { id: "bridge-cutover-handoff-plans-to-execution-checklists", from: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json", to: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json", status: "blocked" },
      { id: "bridge-execution-checklists-to-execution-records", from: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json", to: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json", status: "blocked" },
      { id: "bridge-execution-records-to-outcome-reports", from: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json", to: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json", status: "blocked" },
      { id: "bridge-outcome-reports-to-publication-bundles", from: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json", to: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json", status: "blocked" },
      { id: "bridge-publication-bundles-to-publication-receipt-closeout-contracts", from: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json", to: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json", status: "blocked" },
      { id: "bridge-publication-receipt-closeout-contracts-to-settlement-closeout", from: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json", to: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json", status: "blocked" },
      { id: "bridge-publication-receipt-settlement-closeout-to-publish", from: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json", to: "release/PUBLISH-GATES.json", status: "blocked" },
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
    attestationApplyExecutionPacketsPath: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    attestationOperatorWorklistsPath: "release/ATTESTATION-OPERATOR-WORKLISTS.json",
    attestationOperatorDispatchManifestsPath: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    attestationOperatorDispatchPacketsPath: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    attestationOperatorDispatchReceiptsPath: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    attestationOperatorReconciliationLedgersPath: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    attestationOperatorSettlementPacksPath: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    attestationOperatorApprovalRoutingContractsPath: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    attestationOperatorApprovalOrchestrationPath: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    promotionApplyManifestsPath: "release/PROMOTION-APPLY-MANIFESTS.json",
    attestationApplyAuditPacksPath: "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    promotionExecutionCheckpointsPath: "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
    promotionOperatorHandoffRailsPath: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    promotionStagedApplyLedgersPath: "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
    promotionStagedApplyRunsheetsPath: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    promotionStagedApplyCommandSheetsPath: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    promotionStagedApplyConfirmationLedgersPath: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    promotionStagedApplyCloseoutJournalsPath: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    promotionStagedApplySignoffSheetsPath: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    promotionStagedApplyReleaseDecisionEnforcementContractsPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    promotionStagedApplyReleaseDecisionEnforcementLifecyclePath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    approvalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    publishGatesPath: "release/PUBLISH-GATES.json",
    promotionGatesPath: "release/PROMOTION-GATES.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    rollbackCutoverHandoffPlansPath: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    rollbackCutoverExecutionChecklistsPath: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    rollbackCutoverExecutionRecordsPath: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    rollbackCutoverOutcomeReportsPath: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    rollbackCutoverPublicationBundlesPath: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    rollbackCutoverPublicationReceiptCloseoutContractsPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    rollbackCutoverPublicationReceiptSettlementCloseoutPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
        { id: "request-attestation-apply-audit-packs", label: "Attestation apply audit packs", required: true },
        { id: "request-attestation-apply-execution-packets", label: "Attestation apply execution packets", required: true },
        { id: "request-attestation-operator-worklists", label: "Attestation operator worklists", required: true },
        { id: "request-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests", required: true },
        { id: "request-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets", required: true },
        { id: "request-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts", required: true },
        { id: "request-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers", required: true },
        { id: "request-attestation-operator-settlement-packs", label: "Attestation operator settlement packs", required: true },
        { id: "request-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration", required: true },
        { id: "request-promotion-apply-manifests", label: "Promotion apply manifests", required: true },
        { id: "request-promotion-execution-checkpoints", label: "Promotion execution checkpoints", required: true },
        { id: "request-promotion-operator-handoff-rails", label: "Promotion operator handoff rails", required: true },
        { id: "request-promotion-staged-apply-ledgers", label: "Promotion staged-apply ledgers", required: true },
        { id: "request-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets", required: true },
        { id: "request-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets", required: true },
        { id: "request-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers", required: true },
        { id: "request-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals", required: true },
        { id: "request-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets", required: true },
        { id: "request-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle", required: true },
        { id: "request-publish-evidence", label: "Publish evidence", required: true },
        { id: "request-publish-rollback", label: "Publish rollback handshake", required: true },
        { id: "request-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans", required: true },
        { id: "request-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists", required: true },
        { id: "request-rollback-cutover-execution-records", label: "Rollback cutover execution records", required: true },
        { id: "request-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports", required: true },
        { id: "request-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles", required: true },
        { id: "request-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts", required: true },
        { id: "request-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout", required: true },
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
      { id: "promotion-ack-attestation-apply-audit", label: "Attestation apply audit packs reviewed", status: "planned", artifact: "release/ATTESTATION-APPLY-AUDIT-PACKS.json" },
      { id: "promotion-ack-attestation-apply-execution", label: "Attestation apply execution packets reviewed", status: "planned", artifact: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" },
      { id: "promotion-ack-attestation-operator-worklists", label: "Attestation operator worklists reviewed", status: "planned", artifact: "release/ATTESTATION-OPERATOR-WORKLISTS.json" },
      { id: "promotion-ack-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" },
      { id: "promotion-ack-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" },
      { id: "promotion-ack-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" },
      { id: "promotion-ack-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" },
      { id: "promotion-ack-attestation-operator-settlement-packs", label: "Attestation operator settlement packs reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" },
      { id: "promotion-ack-attestation-operator-approval-routing-contracts", label: "Attestation operator approval routing contracts reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" },
      { id: "promotion-ack-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" },
      { id: "promotion-ack-apply-manifests", label: "Promotion apply manifests reviewed", status: "planned", artifact: "release/PROMOTION-APPLY-MANIFESTS.json" },
      { id: "promotion-ack-execution-checkpoints", label: "Promotion execution checkpoints reviewed", status: "blocked", artifact: "release/PROMOTION-EXECUTION-CHECKPOINTS.json" },
      { id: "promotion-ack-operator-handoff-rails", label: "Promotion operator handoff rails reviewed", status: "blocked", artifact: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" },
      { id: "promotion-ack-staged-apply-ledgers", label: "Promotion staged-apply ledgers reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-LEDGERS.json" },
      { id: "promotion-ack-staged-apply-runsheets", label: "Promotion staged-apply runsheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" },
      { id: "promotion-ack-staged-apply-command-sheets", label: "Promotion staged-apply command sheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" },
      { id: "promotion-ack-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" },
      { id: "promotion-ack-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" },
      { id: "promotion-ack-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" },
      { id: "promotion-ack-staged-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" },
      { id: "promotion-ack-staged-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" },
      { id: "promotion-ack-approval-bridge", label: "Approval bridge reviewed", status: "blocked", artifact: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" },
      { id: "promotion-ack-publish-gates", label: "Publish gates reviewed", status: "blocked", artifact: "release/PUBLISH-GATES.json" },
      { id: "promotion-ack-publish-rollback", label: "Publish rollback handshake reviewed", status: "blocked", artifact: "release/PUBLISH-ROLLBACK-HANDSHAKE.json" },
      { id: "promotion-ack-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" },
      { id: "promotion-ack-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" },
      { id: "promotion-ack-rollback-cutover-execution-records", label: "Rollback cutover execution records reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" },
      { id: "promotion-ack-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" },
      { id: "promotion-ack-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" },
      { id: "promotion-ack-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" },
      { id: "promotion-ack-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" },
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
        id: "promotion-handshake-attestation-audit",
        label: "Attestation apply audit review",
        status: "planned",
        evidence: ["release/ATTESTATION-APPLY-AUDIT-PACKS.json", "release/PROMOTION-APPLY-MANIFESTS.json"]
      },
      {
        id: "promotion-handshake-attestation-execution",
        label: "Attestation apply execution packet review",
        status: "planned",
        evidence: ["release/ATTESTATION-APPLY-AUDIT-PACKS.json", "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json"]
      },
      {
        id: "promotion-handshake-attestation-worklists",
        label: "Attestation operator worklist review",
        status: "planned",
        evidence: ["release/ATTESTATION-APPLY-EXECUTION-PACKETS.json", "release/ATTESTATION-OPERATOR-WORKLISTS.json"]
      },
      {
        id: "promotion-handshake-attestation-dispatch-manifests",
        label: "Attestation operator dispatch manifest review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-WORKLISTS.json", "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json"]
      },
      {
        id: "promotion-handshake-attestation-dispatch-packets",
        label: "Attestation operator dispatch packet review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json", "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json"]
      },
      {
        id: "promotion-handshake-attestation-dispatch-receipts",
        label: "Attestation operator dispatch receipt review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json", "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json"]
      },
      {
        id: "promotion-handshake-attestation-reconciliation-ledgers",
        label: "Attestation operator reconciliation ledger review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json", "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json"]
      },
      {
        id: "promotion-handshake-attestation-settlement-packs",
        label: "Attestation operator settlement pack review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json", "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json"]
      },
      {
        id: "promotion-handshake-attestation-approval-routing-contracts",
        label: "Attestation operator approval routing contract review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json", "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"]
      },
      {
        id: "promotion-handshake-attestation-approval-orchestration",
        label: "Attestation operator approval orchestration review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json", "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"]
      },
      {
        id: "promotion-handshake-apply-manifests",
        label: "Promotion apply manifest review",
        status: "planned",
        evidence: ["release/PROMOTION-APPLY-READINESS.json", "release/PROMOTION-APPLY-MANIFESTS.json"]
      },
      {
        id: "promotion-handshake-execution-checkpoints",
        label: "Promotion execution checkpoint review",
        status: "blocked",
        evidence: ["release/PROMOTION-APPLY-MANIFESTS.json", "release/PROMOTION-EXECUTION-CHECKPOINTS.json"]
      },
      {
        id: "promotion-handshake-operator-handoff-rails",
        label: "Promotion operator handoff rail review",
        status: "blocked",
        evidence: ["release/PROMOTION-EXECUTION-CHECKPOINTS.json", "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json"]
      },
      {
        id: "promotion-handshake-staged-apply-ledgers",
        label: "Promotion staged-apply ledger review",
        status: "blocked",
        evidence: ["release/PROMOTION-OPERATOR-HANDOFF-RAILS.json", "release/PROMOTION-STAGED-APPLY-LEDGERS.json"]
      },
      {
        id: "promotion-handshake-staged-apply-runsheets",
        label: "Promotion staged-apply runsheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-LEDGERS.json", "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json"]
      },
      {
        id: "promotion-handshake-staged-apply-command-sheets",
        label: "Promotion staged-apply command sheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RUNSHEETS.json", "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json"]
      },
      {
        id: "promotion-handshake-staged-apply-confirmation-ledgers",
        label: "Promotion staged-apply confirmation ledger review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json", "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json"]
      },
      {
        id: "promotion-handshake-staged-apply-closeout-journals",
        label: "Promotion staged-apply closeout journal review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json", "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json"]
      },
      {
        id: "promotion-handshake-staged-apply-signoff-sheets",
        label: "Promotion staged-apply signoff sheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json", "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json"]
      },
      {
        id: "promotion-handshake-staged-release-decision-enforcement-contracts",
        label: "Promotion staged-apply release decision enforcement contract review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json", "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json"]
      },
      {
        id: "promotion-handshake-staged-release-decision-enforcement-lifecycle",
        label: "Promotion staged-apply release decision enforcement lifecycle review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json", "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"]
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
        id: "promotion-handshake-rollback-cutover-handoff-plans",
        label: "Rollback cutover handoff plan review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-READINESS-MAPS.json", "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json"]
      },
      {
        id: "promotion-handshake-rollback-cutover-execution-checklists",
        label: "Rollback cutover execution checklist review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json", "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json"]
      },
      {
        id: "promotion-handshake-rollback-cutover-execution-records",
        label: "Rollback cutover execution record review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json", "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json"]
      },
      {
        id: "promotion-handshake-rollback-cutover-outcome-reports",
        label: "Rollback cutover outcome report review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json", "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json"]
      },
      {
        id: "promotion-handshake-rollback-cutover-publication-bundles",
        label: "Rollback cutover publication bundle review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json", "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json"]
      },
      {
        id: "promotion-handshake-rollback-cutover-publication-receipt-closeout-contracts",
        label: "Rollback cutover publication receipt closeout contract review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json", "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"]
      },
      {
        id: "promotion-handshake-rollback-cutover-publication-receipt-settlement-closeout",
        label: "Rollback cutover publication receipt settlement closeout review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json", "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"]
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
      "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
      "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
      "release/ATTESTATION-OPERATOR-WORKLISTS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
      "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
      "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
      "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
      "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
      "release/PROMOTION-APPLY-MANIFESTS.json",
      "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
      "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
      "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
      "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
      "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
      "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
      "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
      "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
      "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
      "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
      "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
      "release/PUBLISH-GATES.json",
      "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
      "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
      "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
      "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
      "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
      "release/PROMOTION-GATES.json",
      "release/RELEASE-APPROVAL-WORKFLOW.json"
    ],
    blockedBy: [
      "sealed bundles remain metadata-only",
      "artifact upload remains blocked",
      "attestation operator approval routing contracts remain metadata-only",
      "attestation operator approval orchestration remains metadata-only",
      "promotion staged-apply release decision enforcement contracts remain metadata-only",
      "promotion staged-apply release decision enforcement lifecycle remains metadata-only",
      "rollback cutover publication receipt closeout contracts remain metadata-only",
      "rollback cutover publication receipt settlement closeout remains metadata-only",
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
    attestationOperatorDispatchManifestsPath: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    attestationOperatorDispatchPacketsPath: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    attestationOperatorDispatchReceiptsPath: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    attestationOperatorReconciliationLedgersPath: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    attestationOperatorSettlementPacksPath: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    attestationOperatorApprovalRoutingContractsPath: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    attestationOperatorApprovalOrchestrationPath: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    promotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    publishGatesPath: "release/PUBLISH-GATES.json",
    promotionGatesPath: "release/PROMOTION-GATES.json",
    promotionExecutionCheckpointsPath: "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
    promotionOperatorHandoffRailsPath: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    promotionStagedApplyLedgersPath: "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
    promotionStagedApplyRunsheetsPath: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    promotionStagedApplyCommandSheetsPath: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    promotionStagedApplyConfirmationLedgersPath: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    promotionStagedApplyCloseoutJournalsPath: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    promotionStagedApplySignoffSheetsPath: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    promotionStagedApplyReleaseDecisionEnforcementContractsPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    promotionStagedApplyReleaseDecisionEnforcementLifecyclePath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    rollbackExecutionRehearsalLedgerPath: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
    rollbackOperatorDrillbooksPath: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
    rollbackLiveReadinessContractsPath: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    rollbackCutoverReadinessMapsPath: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
    rollbackCutoverHandoffPlansPath: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    rollbackCutoverExecutionChecklistsPath: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    rollbackCutoverExecutionRecordsPath: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    rollbackCutoverOutcomeReportsPath: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    rollbackCutoverPublicationBundlesPath: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    rollbackCutoverPublicationReceiptCloseoutContractsPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    rollbackCutoverPublicationReceiptSettlementCloseoutPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
        { id: "request-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests", required: true },
        { id: "request-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets", required: true },
        { id: "request-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts", required: true },
        { id: "request-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers", required: true },
        { id: "request-attestation-operator-settlement-packs", label: "Attestation operator settlement packs", required: true },
        { id: "request-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration", required: true },
        { id: "request-rollback-checkpoints", label: "Rollback checkpoints", required: true },
        { id: "request-promotion-execution-checkpoints", label: "Promotion execution checkpoints", required: true },
        { id: "request-promotion-operator-handoff-rails", label: "Promotion operator handoff rails", required: true },
        { id: "request-promotion-staged-apply-ledgers", label: "Promotion staged-apply ledgers", required: true },
        { id: "request-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets", required: true },
        { id: "request-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets", required: true },
        { id: "request-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers", required: true },
        { id: "request-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals", required: true },
        { id: "request-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets", required: true },
        { id: "request-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle", required: true },
        { id: "request-rollback-rehearsal-ledger", label: "Rollback execution rehearsal ledger", required: true },
        { id: "request-rollback-operator-drillbooks", label: "Rollback operator drillbooks", required: true },
        { id: "request-rollback-live-readiness-contracts", label: "Rollback live-readiness contracts", required: true },
        { id: "request-rollback-cutover-readiness-maps", label: "Rollback cutover readiness maps", required: true },
        { id: "request-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans", required: true },
        { id: "request-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists", required: true },
        { id: "request-rollback-cutover-execution-records", label: "Rollback cutover execution records", required: true },
        { id: "request-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports", required: true },
        { id: "request-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles", required: true },
        { id: "request-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts", required: true },
        { id: "request-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout", required: true },
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
      { id: "rollback-ack-attestation-dispatch-manifests", label: "Attestation operator dispatch manifests reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" },
      { id: "rollback-ack-attestation-dispatch-packets", label: "Attestation operator dispatch packets reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" },
      { id: "rollback-ack-attestation-dispatch-receipts", label: "Attestation operator dispatch receipts reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" },
      { id: "rollback-ack-attestation-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" },
      { id: "rollback-ack-attestation-settlement-packs", label: "Attestation operator settlement packs reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" },
      { id: "rollback-ack-attestation-approval-routing-contracts", label: "Attestation operator approval routing contracts reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" },
      { id: "rollback-ack-attestation-approval-orchestration", label: "Attestation operator approval orchestration reviewed", status: "blocked", artifact: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" },
      { id: "rollback-ack-publish-gates", label: "Publish gates reviewed", status: "blocked", artifact: "release/PUBLISH-GATES.json" },
      { id: "rollback-ack-promotion-gates", label: "Promotion gates reviewed", status: "blocked", artifact: "release/PROMOTION-GATES.json" },
      { id: "rollback-ack-promotion-handshake", label: "Promotion handshake reviewed", status: "blocked", artifact: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" },
      { id: "rollback-ack-execution-checkpoints", label: "Promotion execution checkpoints reviewed", status: "blocked", artifact: "release/PROMOTION-EXECUTION-CHECKPOINTS.json" },
      { id: "rollback-ack-operator-handoff-rails", label: "Promotion operator handoff rails reviewed", status: "blocked", artifact: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" },
      { id: "rollback-ack-staged-apply-ledgers", label: "Promotion staged-apply ledgers reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-LEDGERS.json" },
      { id: "rollback-ack-staged-apply-runsheets", label: "Promotion staged-apply runsheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" },
      { id: "rollback-ack-staged-apply-command-sheets", label: "Promotion staged-apply command sheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" },
      { id: "rollback-ack-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" },
      { id: "rollback-ack-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" },
      { id: "rollback-ack-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" },
      { id: "rollback-ack-staged-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" },
      { id: "rollback-ack-staged-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle reviewed", status: "blocked", artifact: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" },
      { id: "rollback-ack-rehearsal-ledger", label: "Rollback execution rehearsal ledger reviewed", status: "blocked", artifact: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" },
      { id: "rollback-ack-operator-drillbooks", label: "Rollback operator drillbooks reviewed", status: "blocked", artifact: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" },
      { id: "rollback-ack-live-readiness-contracts", label: "Rollback live-readiness contracts reviewed", status: "blocked", artifact: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" },
      { id: "rollback-ack-cutover-readiness-maps", label: "Rollback cutover readiness maps reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" },
      { id: "rollback-ack-cutover-handoff-plans", label: "Rollback cutover handoff plans reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" },
      { id: "rollback-ack-cutover-execution-checklists", label: "Rollback cutover execution checklists reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" },
      { id: "rollback-ack-cutover-execution-records", label: "Rollback cutover execution records reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" },
      { id: "rollback-ack-cutover-outcome-reports", label: "Rollback cutover outcome reports reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" },
      { id: "rollback-ack-cutover-publication-bundles", label: "Rollback cutover publication bundles reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" },
      { id: "rollback-ack-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" },
      { id: "rollback-ack-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout reviewed", status: "blocked", artifact: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" },
      { id: "rollback-ack-release-notes", label: "Release notes reviewed", status: "planned", artifact: "release/RELEASE-NOTES.md" }
    ],
    paths: [
      {
        id: "publish-rollback-alpha-to-beta",
        from: "alpha",
        to: "beta",
        status: "blocked",
        promotionEvidenceId: "promotion-evidence-alpha-to-beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-alpha-to-beta",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-alpha-to-beta",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-alpha-to-beta",
        attestationOperatorApprovalOrchestrationId: "attestation-approval-orchestration-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        promotionOperatorHandoffRailId: "promotion-handoff-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-alpha-to-beta",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-alpha-to-beta",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-alpha-to-beta",
        promotionStagedApplyReleaseDecisionEnforcementLifecycleId: "promotion-release-decision-enforcement-lifecycle-alpha-to-beta",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-alpha-to-beta",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-alpha-to-beta",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-alpha-to-beta",
        rollbackCutoverPublicationReceiptSettlementCloseoutId: "rollback-publication-receipt-settlement-closeout-alpha-to-beta",
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
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-beta-to-stable",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-beta-to-stable",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-beta-to-stable",
        attestationOperatorApprovalOrchestrationId: "attestation-approval-orchestration-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        promotionOperatorHandoffRailId: "promotion-handoff-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-beta-to-stable",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-beta-to-stable",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-beta-to-stable",
        promotionStagedApplyReleaseDecisionEnforcementLifecycleId: "promotion-release-decision-enforcement-lifecycle-beta-to-stable",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-beta-to-stable",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-beta-to-stable",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-beta-to-stable",
        rollbackCutoverPublicationReceiptSettlementCloseoutId: "rollback-publication-receipt-settlement-closeout-beta-to-stable",
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
        id: "rollback-handshake-dispatch-manifests",
        label: "Attestation operator dispatch manifest review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-dispatch-packets",
        label: "Attestation operator dispatch packet review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-dispatch-receipts",
        label: "Attestation operator dispatch receipt review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-reconciliation-ledgers",
        label: "Attestation operator reconciliation ledger review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-settlement-packs",
        label: "Attestation operator settlement pack review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-approval-routing-contracts",
        label: "Attestation operator approval routing contract review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-approval-orchestration",
        label: "Attestation operator approval orchestration review",
        status: "blocked",
        evidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
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
        id: "rollback-handshake-execution-checkpoints",
        label: "Promotion execution checkpoint review",
        status: "blocked",
        evidence: ["release/PROMOTION-EXECUTION-CHECKPOINTS.json", "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-operator-handoff-rails",
        label: "Promotion operator handoff rail review",
        status: "blocked",
        evidence: ["release/PROMOTION-OPERATOR-HANDOFF-RAILS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-apply-ledgers",
        label: "Promotion staged-apply ledger review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-LEDGERS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-apply-runsheets",
        label: "Promotion staged-apply runsheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RUNSHEETS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-apply-command-sheets",
        label: "Promotion staged-apply command sheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-apply-confirmation-ledgers",
        label: "Promotion staged-apply confirmation ledger review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-apply-closeout-journals",
        label: "Promotion staged-apply closeout journal review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-apply-signoff-sheets",
        label: "Promotion staged-apply signoff sheet review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-release-decision-enforcement-contracts",
        label: "Promotion staged-apply release decision enforcement contract review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-staged-release-decision-enforcement-lifecycle",
        label: "Promotion staged-apply release decision enforcement lifecycle review",
        status: "blocked",
        evidence: ["release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json", "release/PUBLISH-ROLLBACK-HANDSHAKE.json"]
      },
      {
        id: "rollback-handshake-rehearsal",
        label: "Rollback execution rehearsal review",
        status: "blocked",
        evidence: ["release/ROLLBACK-RECOVERY-LEDGER.json", "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json"]
      },
      {
        id: "rollback-handshake-operator-drillbooks",
        label: "Rollback operator drillbook review",
        status: "blocked",
        evidence: ["release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json", "release/ROLLBACK-OPERATOR-DRILLBOOKS.json"]
      },
      {
        id: "rollback-handshake-live-readiness",
        label: "Rollback live-readiness review",
        status: "blocked",
        evidence: ["release/ROLLBACK-OPERATOR-DRILLBOOKS.json", "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json"]
      },
      {
        id: "rollback-handshake-cutover-readiness",
        label: "Rollback cutover readiness review",
        status: "blocked",
        evidence: ["release/ROLLBACK-LIVE-READINESS-CONTRACTS.json", "release/ROLLBACK-CUTOVER-READINESS-MAPS.json"]
      },
      {
        id: "rollback-handshake-cutover-handoff",
        label: "Rollback cutover handoff review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-READINESS-MAPS.json", "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json"]
      },
      {
        id: "rollback-handshake-cutover-execution-checklists",
        label: "Rollback cutover execution checklist review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json", "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json"]
      },
      {
        id: "rollback-handshake-cutover-execution-records",
        label: "Rollback cutover execution record review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json", "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json"]
      },
      {
        id: "rollback-handshake-cutover-outcome-reports",
        label: "Rollback cutover outcome report review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json", "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json"]
      },
      {
        id: "rollback-handshake-cutover-publication-bundles",
        label: "Rollback cutover publication bundle review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json", "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json"]
      },
      {
        id: "rollback-handshake-cutover-publication-receipt-closeout-contracts",
        label: "Rollback cutover publication receipt closeout contract review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json", "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"]
      },
      {
        id: "rollback-handshake-cutover-publication-receipt-settlement-closeout",
        label: "Rollback cutover publication receipt settlement closeout review",
        status: "blocked",
        evidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json", "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"]
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
      "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
      "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
      "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
      "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
      "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
      "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
      "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
      "release/PUBLISH-GATES.json",
      "release/PROMOTION-GATES.json",
      "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
      "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
      "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
      "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
      "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
      "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
      "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
      "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
      "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
      "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
      "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
      "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
      "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
      "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
      "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
      "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
      "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
      "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
      "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
      "release/RELEASE-NOTES.md",
      "release/INSTALLER-PLACEHOLDER.json"
    ],
    blockedBy: [
      "artifact upload remains blocked",
      "attestation operator approval routing contracts remain metadata-only",
      "attestation operator approval orchestration remains metadata-only",
      "promotion staged-apply release decision enforcement contracts remain metadata-only",
      "promotion staged-apply release decision enforcement lifecycle remains metadata-only",
      "rollback cutover publication receipt closeout contracts remain metadata-only",
      "rollback cutover publication receipt settlement closeout remains metadata-only",
      "promotion remains non-executable",
      "rollback operator drillbooks remain metadata-only",
      "rollback live-readiness contracts remain metadata-only",
      "rollback cutover readiness maps remain metadata-only",
      "rollback cutover handoff plans remain metadata-only",
      "rollback cutover execution records remain metadata-only",
      "host-side execution remains disabled"
    ]
  };
}

function buildRollbackRecoveryLedger({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-recovery-ledger/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    ledgers: [
      {
        id: "rollback-ledger-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        executionRehearsalLedgerId: "rollback-rehearsal-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        status: "blocked",
        ledgerManifestPath: "future/publish/alpha-to-beta/rollback-recovery-ledger.json",
        recoveryEntries: [
          "sealed bundle checkpoints recorded",
          "promotion evidence anchor recorded",
          "staged-apply ledger anchor recorded",
          "staged-apply confirmation ledger anchor recorded",
          "staged-apply command sheet anchor recorded",
          "dispatch receipt anchor recorded",
          "staged-apply runsheet anchor recorded",
          "cutover readiness map recorded",
          "cutover handoff plan recorded",
          "cutover execution checklist recorded",
          "cutover execution record recorded",
          "recovery channel held at alpha"
        ],
        canRecover: false
      },
      {
        id: "rollback-ledger-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        executionRehearsalLedgerId: "rollback-rehearsal-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        status: "blocked",
        ledgerManifestPath: "future/publish/beta-to-stable/rollback-recovery-ledger.json",
        recoveryEntries: [
          "sealed bundle checkpoints recorded",
          "promotion evidence anchor recorded",
          "staged-apply ledger anchor recorded",
          "staged-apply confirmation ledger anchor recorded",
          "staged-apply command sheet anchor recorded",
          "dispatch receipt anchor recorded",
          "staged-apply runsheet anchor recorded",
          "cutover readiness map recorded",
          "cutover handoff plan recorded",
          "cutover execution checklist recorded",
          "cutover execution record recorded",
          "recovery channel held at beta"
        ],
        canRecover: false
      }
    ]
  };
}

function buildRollbackExecutionRehearsalLedger({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-execution-rehearsal-ledger/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    rehearsals: [
      {
        id: "rollback-rehearsal-alpha-to-beta",
        from: "alpha",
        to: "beta",
        rollbackRecoveryLedgerId: "rollback-ledger-alpha-to-beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        promotionApplyManifestId: "promotion-manifest-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        status: "blocked",
        rehearsalManifestPath: "future/publish/alpha-to-beta/rollback-execution-rehearsal-ledger.json",
        rehearsalSteps: [
          "load rollback checkpoints",
          "replay recovery channel selection",
          "verify staged-apply ledger anchors",
          "verify dispatch manifest anchors",
          "verify dispatch packet anchors",
          "verify dispatch receipt anchors",
          "verify attestation pack anchors",
          "verify command sheet anchors",
          "verify confirmation ledger anchors",
          "record dry-run rollback notes",
          "anchor operator drillbook handoff",
          "anchor cutover readiness map",
          "anchor cutover handoff plan",
          "anchor cutover execution checklist",
          "anchor cutover execution record"
        ],
        blockedBy: ["rollback rehearsal remains non-executable", "live publish remains blocked", "host-side execution remains disabled"],
        canRehearse: false
      },
      {
        id: "rollback-rehearsal-beta-to-stable",
        from: "beta",
        to: "stable",
        rollbackRecoveryLedgerId: "rollback-ledger-beta-to-stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        promotionApplyManifestId: "promotion-manifest-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        status: "blocked",
        rehearsalManifestPath: "future/publish/beta-to-stable/rollback-execution-rehearsal-ledger.json",
        rehearsalSteps: [
          "load rollback checkpoints",
          "replay recovery channel selection",
          "verify staged-apply ledger anchors",
          "verify dispatch manifest anchors",
          "verify dispatch packet anchors",
          "verify dispatch receipt anchors",
          "verify attestation pack anchors",
          "verify command sheet anchors",
          "verify confirmation ledger anchors",
          "record dry-run rollback notes",
          "anchor operator drillbook handoff",
          "anchor cutover readiness map",
          "anchor cutover handoff plan",
          "anchor cutover execution checklist",
          "anchor cutover execution record"
        ],
        blockedBy: ["rollback rehearsal remains non-executable", "live publish remains blocked", "host-side execution remains disabled"],
        canRehearse: false
      }
    ]
  };
}

function buildRollbackOperatorDrillbooks({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-operator-drillbooks/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    drillbooks: [
      {
        id: "rollback-drillbook-alpha-to-beta",
        from: "alpha",
        to: "beta",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-alpha-to-beta",
        promotionExecutionCheckpointId: "promotion-checkpoint-alpha-to-beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        drillbookPath: "future/publish/alpha-to-beta/rollback-operator-drillbook.json",
        operatorRoles: ["release-manager", "runtime-owner", "support-operator"],
        sections: [
          "checkpoint intake",
          "channel freeze and evidence capture",
          "staged apply rollback journal review",
          "rollback route selection",
          "cutover readiness verification",
          "post-rollback audit note",
          "live-readiness signoff"
        ],
        reviewChecks: [
          "rehearsal ledger linked",
          "promotion execution checkpoint linked",
          "publish rollback path linked",
          "rollback live-readiness anchor declared",
          "rollback cutover readiness map linked",
          "rollback cutover handoff plan linked",
          "rollback cutover execution checklist linked"
        ],
        blockedBy: ["rollback operator drillbook remains metadata-only", "live publish remains blocked", "host-side execution remains disabled"],
        canOperate: false
      },
      {
        id: "rollback-drillbook-beta-to-stable",
        from: "beta",
        to: "stable",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-beta-to-stable",
        promotionExecutionCheckpointId: "promotion-checkpoint-beta-to-stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        drillbookPath: "future/publish/beta-to-stable/rollback-operator-drillbook.json",
        operatorRoles: ["release-manager", "runtime-owner", "support-operator"],
        sections: [
          "checkpoint intake",
          "channel freeze and evidence capture",
          "staged apply rollback journal review",
          "rollback route selection",
          "cutover readiness verification",
          "post-rollback audit note",
          "live-readiness signoff"
        ],
        reviewChecks: [
          "rehearsal ledger linked",
          "promotion execution checkpoint linked",
          "publish rollback path linked",
          "rollback live-readiness anchor declared",
          "rollback cutover readiness map linked",
          "rollback cutover handoff plan linked",
          "rollback cutover execution checklist linked"
        ],
        blockedBy: ["rollback operator drillbook remains metadata-only", "live publish remains blocked", "host-side execution remains disabled"],
        canOperate: false
      }
    ]
  };
}

function buildRollbackLiveReadinessContracts({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-live-readiness-contracts/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    contracts: [
      {
        id: "rollback-readiness-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        promotionOperatorHandoffRailId: "promotion-handoff-alpha-to-beta",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        readinessContractPath: "future/publish/alpha-to-beta/rollback-live-readiness-contract.json",
        readinessChecks: [
          "rollback rehearsal ledger linked",
          "rollback operator drillbook linked",
          "promotion operator handoff rail linked",
          "promotion command sheet linked",
          "recovery channel remains review-only",
          "rollback cutover readiness map anchor declared",
          "rollback cutover handoff plan anchor declared",
          "rollback cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback live-readiness remains metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canEnterLiveRollback: false
      },
      {
        id: "rollback-readiness-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        promotionOperatorHandoffRailId: "promotion-handoff-beta-to-stable",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        readinessContractPath: "future/publish/beta-to-stable/rollback-live-readiness-contract.json",
        readinessChecks: [
          "rollback rehearsal ledger linked",
          "rollback operator drillbook linked",
          "promotion operator handoff rail linked",
          "promotion command sheet linked",
          "recovery channel remains review-only",
          "rollback cutover readiness map anchor declared",
          "rollback cutover handoff plan anchor declared",
          "rollback cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback live-readiness remains metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canEnterLiveRollback: false
      }
    ]
  };
}

function buildRollbackCutoverReadinessMaps({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-readiness-maps/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    maps: [
      {
        id: "rollback-cutover-map-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        readinessMapPath: "future/publish/alpha-to-beta/rollback-cutover-readiness-map.json",
        cutoverWindows: [
          {
            id: "cutover-alpha-to-beta-freeze",
            label: "Pre-cutover freeze",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-alpha-to-beta", "rollback-readiness-alpha-to-beta"]
          },
          {
            id: "cutover-alpha-to-beta-platforms",
            label: "Platform rollback topology",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["sealed-bundle-checkpoint-windows", "sealed-bundle-checkpoint-macos", "sealed-bundle-checkpoint-linux"]
          },
          {
            id: "cutover-alpha-to-beta-signoff",
            label: "Go/no-go signoff",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-drillbook-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          }
        ],
        platformMaps: [
          { platform: "windows", recoveryChannel: "alpha", rollbackCheckpoint: "sealed-bundle-checkpoint-windows", status: "blocked" },
          { platform: "macos", recoveryChannel: "alpha", rollbackCheckpoint: "sealed-bundle-checkpoint-macos", status: "blocked" },
          { platform: "linux", recoveryChannel: "alpha", rollbackCheckpoint: "sealed-bundle-checkpoint-linux", status: "blocked" }
        ],
        reviewChecks: [
          "promotion staged-apply ledger linked",
          "promotion staged-apply command sheet linked",
          "rollback live-readiness contract linked",
          "per-platform rollback checkpoints mapped",
          "cutover handoff plan anchor declared",
          "cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback cutover readiness maps remain metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canMapCutover: false
      },
      {
        id: "rollback-cutover-map-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        promotionStagedApplyLedgerId: "promotion-staged-ledger-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        readinessMapPath: "future/publish/beta-to-stable/rollback-cutover-readiness-map.json",
        cutoverWindows: [
          {
            id: "cutover-beta-to-stable-freeze",
            label: "Pre-cutover freeze",
            owner: "release-manager",
            status: "blocked",
            evidence: ["promotion-staged-ledger-beta-to-stable", "rollback-readiness-beta-to-stable"]
          },
          {
            id: "cutover-beta-to-stable-platforms",
            label: "Platform rollback topology",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["sealed-bundle-checkpoint-windows", "sealed-bundle-checkpoint-macos", "sealed-bundle-checkpoint-linux"]
          },
          {
            id: "cutover-beta-to-stable-signoff",
            label: "Go/no-go signoff",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-drillbook-beta-to-stable", "publish-rollback-beta-to-stable"]
          }
        ],
        platformMaps: [
          { platform: "windows", recoveryChannel: "beta", rollbackCheckpoint: "sealed-bundle-checkpoint-windows", status: "blocked" },
          { platform: "macos", recoveryChannel: "beta", rollbackCheckpoint: "sealed-bundle-checkpoint-macos", status: "blocked" },
          { platform: "linux", recoveryChannel: "beta", rollbackCheckpoint: "sealed-bundle-checkpoint-linux", status: "blocked" }
        ],
        reviewChecks: [
          "promotion staged-apply ledger linked",
          "promotion staged-apply command sheet linked",
          "rollback live-readiness contract linked",
          "per-platform rollback checkpoints mapped",
          "cutover handoff plan anchor declared",
          "cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback cutover readiness maps remain metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canMapCutover: false
      }
    ]
  };
}

function buildRollbackCutoverHandoffPlans({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-handoff-plans/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    plans: [
      {
        id: "rollback-handoff-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        attestationOperatorDispatchManifestId: "attestation-dispatch-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        handoffPlanPath: "future/publish/alpha-to-beta/rollback-cutover-handoff-plan.json",
        handoffBaton: [
          {
            id: "handoff-alpha-to-beta-freeze-desk",
            label: "Freeze desk handoff",
            fromRole: "release-manager",
            toRole: "support-operator",
            status: "blocked",
            evidence: ["promotion-runsheet-alpha-to-beta", "rollback-cutover-map-alpha-to-beta"]
          },
          {
            id: "handoff-alpha-to-beta-platform-baton",
            label: "Platform checkpoint baton",
            fromRole: "runtime-owner",
            toRole: "release-engineering",
            status: "blocked",
            evidence: ["rollback-readiness-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          },
          {
            id: "handoff-alpha-to-beta-recovery-baton",
            label: "Recovery fallback baton",
            fromRole: "support-operator",
            toRole: "runtime-owner",
            status: "blocked",
            evidence: ["attestation-dispatch-alpha-to-beta", "rollback-cutover-map-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "rollback cutover readiness map linked",
          "promotion staged-apply runsheet linked",
          "promotion staged-apply command sheet linked",
          "attestation dispatch manifest linked",
          "rollback cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback cutover handoff remains metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canHandOffCutover: false
      },
      {
        id: "rollback-handoff-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        attestationOperatorDispatchManifestId: "attestation-dispatch-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        handoffPlanPath: "future/publish/beta-to-stable/rollback-cutover-handoff-plan.json",
        handoffBaton: [
          {
            id: "handoff-beta-to-stable-freeze-desk",
            label: "Freeze desk handoff",
            fromRole: "release-manager",
            toRole: "support-operator",
            status: "blocked",
            evidence: ["promotion-runsheet-beta-to-stable", "rollback-cutover-map-beta-to-stable"]
          },
          {
            id: "handoff-beta-to-stable-platform-baton",
            label: "Platform checkpoint baton",
            fromRole: "runtime-owner",
            toRole: "release-engineering",
            status: "blocked",
            evidence: ["rollback-readiness-beta-to-stable", "publish-rollback-beta-to-stable"]
          },
          {
            id: "handoff-beta-to-stable-recovery-baton",
            label: "Recovery fallback baton",
            fromRole: "support-operator",
            toRole: "runtime-owner",
            status: "blocked",
            evidence: ["attestation-dispatch-beta-to-stable", "rollback-cutover-map-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "rollback cutover readiness map linked",
          "promotion staged-apply runsheet linked",
          "promotion staged-apply command sheet linked",
          "attestation dispatch manifest linked",
          "rollback cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback cutover handoff remains metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canHandOffCutover: false
      }
    ]
  };
}

function buildRollbackCutoverExecutionChecklists({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-execution-checklists/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    checklists: [
      {
        id: "rollback-checklist-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-alpha-to-beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        status: "blocked",
        checklistPath: "future/publish/alpha-to-beta/rollback-cutover-execution-checklist.json",
        executionRecordPath: "future/publish/alpha-to-beta/rollback-cutover-execution-record.json",
        executionSections: [
          {
            id: "rollback-checklist-alpha-to-beta-freeze",
            label: "Freeze and dispatch confirmation",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-dispatch-packet-alpha-to-beta", "promotion-command-sheet-alpha-to-beta"],
            executionRecordSectionId: "rollback-execution-record-alpha-to-beta-freeze"
          },
          {
            id: "rollback-checklist-alpha-to-beta-platforms",
            label: "Platform rollback checkpoint sweep",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-cutover-map-alpha-to-beta", "rollback-readiness-alpha-to-beta"],
            executionRecordSectionId: "rollback-execution-record-alpha-to-beta-platforms"
          },
          {
            id: "rollback-checklist-alpha-to-beta-cutover",
            label: "Cutover and recovery confirmation",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-handoff-alpha-to-beta", "publish-rollback-alpha-to-beta"],
            executionRecordSectionId: "rollback-execution-record-alpha-to-beta-cutover"
          }
        ],
        reviewChecks: [
          "rollback cutover readiness map linked",
          "rollback cutover handoff plan linked",
          "promotion command sheet linked",
          "dispatch packet linked",
          "execution record anchor declared"
        ],
        blockedBy: [
          "rollback cutover execution checklists remain metadata-only",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canExecuteChecklist: false
      },
      {
        id: "rollback-checklist-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        attestationOperatorDispatchPacketId: "attestation-dispatch-packet-beta-to-stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        status: "blocked",
        checklistPath: "future/publish/beta-to-stable/rollback-cutover-execution-checklist.json",
        executionRecordPath: "future/publish/beta-to-stable/rollback-cutover-execution-record.json",
        executionSections: [
          {
            id: "rollback-checklist-beta-to-stable-freeze",
            label: "Freeze and dispatch confirmation",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-dispatch-packet-beta-to-stable", "promotion-command-sheet-beta-to-stable"],
            executionRecordSectionId: "rollback-execution-record-beta-to-stable-freeze"
          },
          {
            id: "rollback-checklist-beta-to-stable-platforms",
            label: "Platform rollback checkpoint sweep",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-cutover-map-beta-to-stable", "rollback-readiness-beta-to-stable"],
            executionRecordSectionId: "rollback-execution-record-beta-to-stable-platforms"
          },
          {
            id: "rollback-checklist-beta-to-stable-cutover",
            label: "Cutover and recovery confirmation",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-handoff-beta-to-stable", "publish-rollback-beta-to-stable"],
            executionRecordSectionId: "rollback-execution-record-beta-to-stable-cutover"
          }
        ],
        reviewChecks: [
          "rollback cutover readiness map linked",
          "rollback cutover handoff plan linked",
          "promotion command sheet linked",
          "dispatch packet linked",
          "execution record anchor declared"
        ],
        blockedBy: [
          "rollback cutover execution checklists remain metadata-only",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canExecuteChecklist: false
      }
    ]
  };
}

function buildRollbackCutoverExecutionRecords({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-execution-records/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    records: [
      {
        id: "rollback-execution-record-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-alpha-to-beta",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-alpha-to-beta",
        status: "blocked",
        executionRecordPath: "future/publish/alpha-to-beta/rollback-cutover-execution-record.json",
        recoveryStatePath: "future/publish/alpha-to-beta/recovery-state.json",
        recordSections: [
          {
            id: "rollback-execution-record-alpha-to-beta-freeze",
            label: "Freeze and dispatch receipt closeout",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-dispatch-receipt-alpha-to-beta", "promotion-confirmation-ledger-alpha-to-beta"]
          },
          {
            id: "rollback-execution-record-alpha-to-beta-platforms",
            label: "Platform checkpoint evidence capture",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-cutover-map-alpha-to-beta", "rollback-readiness-alpha-to-beta"]
          },
          {
            id: "rollback-execution-record-alpha-to-beta-cutover",
            label: "Cutover recovery state publication",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-handoff-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "rollback execution checklist linked",
          "dispatch receipt linked",
          "promotion confirmation ledger linked",
          "recovery-state publication path declared"
        ],
        blockedBy: [
          "rollback cutover execution records remain metadata-only",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canRecordExecution: false
      },
      {
        id: "rollback-execution-record-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyConfirmationLedgerId: "promotion-confirmation-ledger-beta-to-stable",
        attestationOperatorDispatchReceiptId: "attestation-dispatch-receipt-beta-to-stable",
        status: "blocked",
        executionRecordPath: "future/publish/beta-to-stable/rollback-cutover-execution-record.json",
        recoveryStatePath: "future/publish/beta-to-stable/recovery-state.json",
        recordSections: [
          {
            id: "rollback-execution-record-beta-to-stable-freeze",
            label: "Freeze and dispatch receipt closeout",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-dispatch-receipt-beta-to-stable", "promotion-confirmation-ledger-beta-to-stable"]
          },
          {
            id: "rollback-execution-record-beta-to-stable-platforms",
            label: "Platform checkpoint evidence capture",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-cutover-map-beta-to-stable", "rollback-readiness-beta-to-stable"]
          },
          {
            id: "rollback-execution-record-beta-to-stable-cutover",
            label: "Cutover recovery state publication",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-handoff-beta-to-stable", "publish-rollback-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "rollback execution checklist linked",
          "dispatch receipt linked",
          "promotion confirmation ledger linked",
          "recovery-state publication path declared"
        ],
        blockedBy: [
          "rollback cutover execution records remain metadata-only",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canRecordExecution: false
      }
    ]
  };
}

function buildRollbackCutoverOutcomeReports({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-outcome-reports/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    reports: [
      {
        id: "rollback-outcome-report-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-alpha-to-beta",
        rollbackLiveReadinessContractId: "rollback-readiness-alpha-to-beta",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-alpha-to-beta",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-alpha-to-beta",
        status: "blocked",
        outcomeReportPath: "future/publish/alpha-to-beta/rollback-cutover-outcome-report.json",
        recoveryDigestPath: "future/publish/alpha-to-beta/recovery-digest.json",
        reportSections: [
          {
            id: "rollback-outcome-report-alpha-to-beta-freeze",
            label: "Operator reconciliation outcome",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-alpha-to-beta", "promotion-closeout-journal-alpha-to-beta"]
          },
          {
            id: "rollback-outcome-report-alpha-to-beta-platforms",
            label: "Platform recovery digest",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-execution-record-alpha-to-beta", "rollback-readiness-alpha-to-beta"]
          },
          {
            id: "rollback-outcome-report-alpha-to-beta-cutover",
            label: "Cutover outcome publication",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-execution-record-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "rollback execution record linked",
          "promotion closeout journal linked",
          "attestation reconciliation ledger linked",
          "recovery digest path declared"
        ],
        blockedBy: [
          "rollback cutover outcome reports remain metadata-only",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canPublishOutcome: false
      },
      {
        id: "rollback-outcome-report-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackCutoverExecutionRecordId: "rollback-execution-record-beta-to-stable",
        rollbackLiveReadinessContractId: "rollback-readiness-beta-to-stable",
        promotionStagedApplyCloseoutJournalId: "promotion-closeout-journal-beta-to-stable",
        attestationOperatorReconciliationLedgerId: "attestation-reconciliation-ledger-beta-to-stable",
        status: "blocked",
        outcomeReportPath: "future/publish/beta-to-stable/rollback-cutover-outcome-report.json",
        recoveryDigestPath: "future/publish/beta-to-stable/recovery-digest.json",
        reportSections: [
          {
            id: "rollback-outcome-report-beta-to-stable-freeze",
            label: "Operator reconciliation outcome",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-reconciliation-ledger-beta-to-stable", "promotion-closeout-journal-beta-to-stable"]
          },
          {
            id: "rollback-outcome-report-beta-to-stable-platforms",
            label: "Platform recovery digest",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-execution-record-beta-to-stable", "rollback-readiness-beta-to-stable"]
          },
          {
            id: "rollback-outcome-report-beta-to-stable-cutover",
            label: "Cutover outcome publication",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-execution-record-beta-to-stable", "publish-rollback-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "rollback execution record linked",
          "promotion closeout journal linked",
          "attestation reconciliation ledger linked",
          "recovery digest path declared"
        ],
        blockedBy: [
          "rollback cutover outcome reports remain metadata-only",
          "publish rollback remains non-executable",
          "host-side execution remains disabled"
        ],
        canPublishOutcome: false
      }
    ]
  };
}

function buildRollbackCutoverPublicationBundles({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-publication-bundles/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    bundles: [
      {
        id: "rollback-publication-bundle-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-alpha-to-beta",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-alpha-to-beta",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-alpha-to-beta",
        publishGateId: "gate-rollback-cutover-publication-bundles",
        status: "blocked",
        publicationBundlePath: "future/publish/alpha-to-beta/rollback-cutover-publication-bundle.json",
        releaseNotesAppendixPath: "future/publish/alpha-to-beta/rollback-cutover-release-notes.md",
        publicationDigestPath: "future/publish/alpha-to-beta/rollback-cutover-publication-digest.json",
        bundleSections: [
          {
            id: "rollback-publication-alpha-to-beta-operator",
            label: "Operator settlement appendix",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-settlement-pack-alpha-to-beta", "promotion-signoff-sheet-alpha-to-beta"]
          },
          {
            id: "rollback-publication-alpha-to-beta-platforms",
            label: "Platform recovery publication digest",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-outcome-report-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          },
          {
            id: "rollback-publication-alpha-to-beta-cutover",
            label: "Cutover publication handoff",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-outcome-report-alpha-to-beta", "promotion-signoff-sheet-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "rollback outcome report linked",
          "attestation settlement pack linked",
          "promotion signoff sheet linked",
          "release-notes appendix path declared",
          "publication digest path declared"
        ],
        blockedBy: [
          "rollback cutover publication bundles remain metadata-only",
          "publish rollback remains non-executable",
          "promotion staged-apply signoff remains non-executable",
          "host-side execution remains disabled"
        ],
        canPublishBundle: false
      },
      {
        id: "rollback-publication-bundle-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        rollbackCutoverOutcomeReportId: "rollback-outcome-report-beta-to-stable",
        attestationOperatorSettlementPackId: "attestation-settlement-pack-beta-to-stable",
        promotionStagedApplySignoffSheetId: "promotion-signoff-sheet-beta-to-stable",
        publishGateId: "gate-rollback-cutover-publication-bundles",
        status: "blocked",
        publicationBundlePath: "future/publish/beta-to-stable/rollback-cutover-publication-bundle.json",
        releaseNotesAppendixPath: "future/publish/beta-to-stable/rollback-cutover-release-notes.md",
        publicationDigestPath: "future/publish/beta-to-stable/rollback-cutover-publication-digest.json",
        bundleSections: [
          {
            id: "rollback-publication-beta-to-stable-operator",
            label: "Operator settlement appendix",
            owner: "release-manager",
            status: "blocked",
            evidence: ["attestation-settlement-pack-beta-to-stable", "promotion-signoff-sheet-beta-to-stable"]
          },
          {
            id: "rollback-publication-beta-to-stable-platforms",
            label: "Platform recovery publication digest",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-outcome-report-beta-to-stable", "publish-rollback-beta-to-stable"]
          },
          {
            id: "rollback-publication-beta-to-stable-cutover",
            label: "Cutover publication handoff",
            owner: "support-operator",
            status: "blocked",
            evidence: ["rollback-outcome-report-beta-to-stable", "promotion-signoff-sheet-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "rollback outcome report linked",
          "attestation settlement pack linked",
          "promotion signoff sheet linked",
          "release-notes appendix path declared",
          "publication digest path declared"
        ],
        blockedBy: [
          "rollback cutover publication bundles remain metadata-only",
          "publish rollback remains non-executable",
          "promotion staged-apply signoff remains non-executable",
          "host-side execution remains disabled"
        ],
        canPublishBundle: false
      }
    ]
  };
}

function buildRollbackCutoverPublicationReceiptCloseoutContracts({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-publication-receipt-closeout-contracts/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    contracts: [
      {
        id: "rollback-publication-receipt-closeout-contract-alpha-to-beta",
        from: "alpha",
        to: "beta",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-alpha-to-beta",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-alpha-to-beta",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-alpha-to-beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        releaseApprovalStageId: "approval-decision-receipts",
        publishGateId: "gate-rollback-cutover-publication-receipt-closeout-contracts",
        status: "blocked",
        publicationReceiptCloseoutContractPath: "future/publish/alpha-to-beta/rollback-cutover-publication-receipt-closeout-contract.json",
        closeoutAcknowledgementPath: "future/publish/alpha-to-beta/rollback-cutover-publication-closeout-ack.json",
        closeoutEvidencePath: "future/publish/alpha-to-beta/rollback-cutover-publication-closeout-evidence.json",
        closeoutSteps: [
          {
            id: "rollback-publication-closeout-alpha-to-beta-release-manager",
            label: "Publication closeout acknowledgement",
            owner: "release-manager",
            status: "planned",
            evidence: ["rollback-publication-bundle-alpha-to-beta", "promotion-release-decision-enforcement-contract-alpha-to-beta"]
          },
          {
            id: "rollback-publication-closeout-alpha-to-beta-runtime-owner",
            label: "Publication closeout evidence",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-publication-bundle-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          },
          {
            id: "rollback-publication-closeout-alpha-to-beta-support-operator",
            label: "Publication receipt closeout contract",
            owner: "support-operator",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-alpha-to-beta", "promotion-release-decision-enforcement-contract-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "rollback publication bundle linked",
          "approval routing contract linked",
          "staged release decision enforcement contract linked",
          "closeout acknowledgement path declared",
          "closeout evidence path declared"
        ],
        blockedBy: [
          "rollback cutover publication receipt closeout contracts remain metadata-only",
          "publish rollback remains non-executable",
          "release approval remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseReceiptContract: false
      },
      {
        id: "rollback-publication-receipt-closeout-contract-beta-to-stable",
        from: "beta",
        to: "stable",
        rollbackCutoverPublicationBundleId: "rollback-publication-bundle-beta-to-stable",
        attestationOperatorApprovalRoutingContractId: "attestation-approval-routing-contract-beta-to-stable",
        promotionStagedApplyReleaseDecisionEnforcementContractId: "promotion-release-decision-enforcement-contract-beta-to-stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        releaseApprovalStageId: "approval-decision-receipts",
        publishGateId: "gate-rollback-cutover-publication-receipt-closeout-contracts",
        status: "blocked",
        publicationReceiptCloseoutContractPath: "future/publish/beta-to-stable/rollback-cutover-publication-receipt-closeout-contract.json",
        closeoutAcknowledgementPath: "future/publish/beta-to-stable/rollback-cutover-publication-closeout-ack.json",
        closeoutEvidencePath: "future/publish/beta-to-stable/rollback-cutover-publication-closeout-evidence.json",
        closeoutSteps: [
          {
            id: "rollback-publication-closeout-beta-to-stable-release-manager",
            label: "Publication closeout acknowledgement",
            owner: "release-manager",
            status: "blocked",
            evidence: ["rollback-publication-bundle-beta-to-stable", "promotion-release-decision-enforcement-contract-beta-to-stable"]
          },
          {
            id: "rollback-publication-closeout-beta-to-stable-runtime-owner",
            label: "Publication closeout evidence",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-publication-bundle-beta-to-stable", "publish-rollback-beta-to-stable"]
          },
          {
            id: "rollback-publication-closeout-beta-to-stable-support-operator",
            label: "Publication receipt closeout contract",
            owner: "support-operator",
            status: "blocked",
            evidence: ["attestation-approval-routing-contract-beta-to-stable", "promotion-release-decision-enforcement-contract-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "rollback publication bundle linked",
          "approval routing contract linked",
          "staged release decision enforcement contract linked",
          "closeout acknowledgement path declared",
          "closeout evidence path declared"
        ],
        blockedBy: [
          "rollback cutover publication receipt closeout contracts remain metadata-only",
          "publish rollback remains non-executable",
          "release approval remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseReceiptContract: false
      }
    ]
  };
}

function buildRollbackCutoverPublicationReceiptSettlementCloseout({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-rollback-cutover-publication-receipt-settlement-closeout/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    closeouts: [
      {
        id: "rollback-publication-receipt-settlement-closeout-alpha-to-beta",
        from: "alpha",
        to: "beta",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-alpha-to-beta",
        attestationOperatorApprovalOrchestrationId: "attestation-approval-orchestration-alpha-to-beta",
        promotionStagedApplyReleaseDecisionEnforcementLifecycleId: "promotion-release-decision-enforcement-lifecycle-alpha-to-beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        releaseApprovalStageId: "approval-decision-receipts",
        publishGateId: "gate-rollback-cutover-publication-receipt-settlement-closeout",
        status: "blocked",
        settlementCloseoutPath: "future/publish/alpha-to-beta/rollback-cutover-publication-receipt-settlement-closeout.json",
        settlementLedgerPath: "future/publish/alpha-to-beta/rollback-cutover-publication-receipt-settlement-ledger.json",
        recoveryCloseoutPath: "future/publish/alpha-to-beta/rollback-cutover-publication-receipt-recovery-closeout.json",
        settlementSteps: [
          {
            id: "rollback-publication-settlement-alpha-to-beta-release-manager",
            label: "Receipt settlement acknowledgement",
            owner: "release-manager",
            status: "planned",
            evidence: ["rollback-publication-receipt-closeout-contract-alpha-to-beta", "promotion-release-decision-enforcement-lifecycle-alpha-to-beta"]
          },
          {
            id: "rollback-publication-settlement-alpha-to-beta-runtime-owner",
            label: "Settlement ledger evidence",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-publication-receipt-closeout-contract-alpha-to-beta", "publish-rollback-alpha-to-beta"]
          },
          {
            id: "rollback-publication-settlement-alpha-to-beta-support-operator",
            label: "Receipt recovery closeout",
            owner: "support-operator",
            status: "blocked",
            evidence: ["attestation-approval-orchestration-alpha-to-beta", "promotion-release-decision-enforcement-lifecycle-alpha-to-beta"]
          }
        ],
        reviewChecks: [
          "publication receipt closeout contract linked",
          "approval orchestration linked",
          "release decision enforcement lifecycle linked",
          "settlement ledger path declared",
          "recovery closeout path declared"
        ],
        blockedBy: [
          "rollback cutover publication receipt settlement closeout remains metadata-only",
          "publish rollback remains non-executable",
          "release approval remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseReceiptSettlement: false
      },
      {
        id: "rollback-publication-receipt-settlement-closeout-beta-to-stable",
        from: "beta",
        to: "stable",
        rollbackCutoverPublicationReceiptCloseoutContractId: "rollback-publication-receipt-closeout-contract-beta-to-stable",
        attestationOperatorApprovalOrchestrationId: "attestation-approval-orchestration-beta-to-stable",
        promotionStagedApplyReleaseDecisionEnforcementLifecycleId: "promotion-release-decision-enforcement-lifecycle-beta-to-stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        releaseApprovalStageId: "approval-decision-receipts",
        publishGateId: "gate-rollback-cutover-publication-receipt-settlement-closeout",
        status: "blocked",
        settlementCloseoutPath: "future/publish/beta-to-stable/rollback-cutover-publication-receipt-settlement-closeout.json",
        settlementLedgerPath: "future/publish/beta-to-stable/rollback-cutover-publication-receipt-settlement-ledger.json",
        recoveryCloseoutPath: "future/publish/beta-to-stable/rollback-cutover-publication-receipt-recovery-closeout.json",
        settlementSteps: [
          {
            id: "rollback-publication-settlement-beta-to-stable-release-manager",
            label: "Receipt settlement acknowledgement",
            owner: "release-manager",
            status: "blocked",
            evidence: ["rollback-publication-receipt-closeout-contract-beta-to-stable", "promotion-release-decision-enforcement-lifecycle-beta-to-stable"]
          },
          {
            id: "rollback-publication-settlement-beta-to-stable-runtime-owner",
            label: "Settlement ledger evidence",
            owner: "runtime-owner",
            status: "blocked",
            evidence: ["rollback-publication-receipt-closeout-contract-beta-to-stable", "publish-rollback-beta-to-stable"]
          },
          {
            id: "rollback-publication-settlement-beta-to-stable-support-operator",
            label: "Receipt recovery closeout",
            owner: "support-operator",
            status: "blocked",
            evidence: ["attestation-approval-orchestration-beta-to-stable", "promotion-release-decision-enforcement-lifecycle-beta-to-stable"]
          }
        ],
        reviewChecks: [
          "publication receipt closeout contract linked",
          "approval orchestration linked",
          "release decision enforcement lifecycle linked",
          "settlement ledger path declared",
          "recovery closeout path declared"
        ],
        blockedBy: [
          "rollback cutover publication receipt settlement closeout remains metadata-only",
          "publish rollback remains non-executable",
          "release approval remains non-executable",
          "host-side execution remains disabled"
        ],
        canCloseReceiptSettlement: false
      }
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
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    operatorReviewBoardPath: "release/OPERATOR-REVIEW-BOARD.json",
    releaseDecisionHandoffPath: "release/RELEASE-DECISION-HANDOFF.json",
    reviewEvidenceCloseoutPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json",
    blockedBy: [
      "approval handshake is not executable yet",
      "operator review board remains local-only metadata",
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
        id: "approval-attestation-verification",
        label: "Attestation verification, dispatch, reconciliation, approval-routing-contract, and approval-orchestration review",
        status: "planned",
        approverRoles: ["release-engineering", "security"],
        evidence: [
          "release/INTEGRITY-ATTESTATION-EVIDENCE.json",
          "release/ATTESTATION-VERIFICATION-PACKS.json",
          "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
          "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
          "release/ATTESTATION-OPERATOR-WORKLISTS.json",
          "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
          "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
          "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
          "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
          "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/OPERATOR-REVIEW-BOARD.json"
        ]
      },
      {
        id: "approval-operator-board",
        label: "Operator review board, reviewer queue, acknowledgement, escalation window, decision handoff, and evidence closeout review",
        status: "in-review",
        approverRoles: ["release-manager", "product-owner", "runtime-owner"],
        evidence: [
          "release/OPERATOR-REVIEW-BOARD.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json"
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
        id: "approval-promotion-apply",
        label: "Promotion apply, command-sheet, closeout-journal, enforcement-contract, enforcement-lifecycle, and execution checkpoint review",
        status: "planned",
        approverRoles: ["release-manager", "product-owner"],
        evidence: [
          "release/PROMOTION-APPLY-READINESS.json",
          "release/PROMOTION-APPLY-MANIFESTS.json",
          "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
          "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
          "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
          "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
          "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
          "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
          "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
          "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
        ]
      },
      {
        id: "approval-decision-receipts",
        label: "Approval orchestration, staged release decision enforcement lifecycle, and publication receipt settlement closeout review",
        status: "blocked",
        approverRoles: ["release-engineering", "release-manager", "product-owner"],
        evidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/OPERATOR-REVIEW-BOARD.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/PUBLISH-GATES.json"
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
        label: "Publish, rollback, outcome-report, closeout-contract, settlement-closeout, and promotion review",
        status: "blocked",
        approverRoles: ["release-manager", "product-owner"],
        evidence: [
          "release/RELEASE-NOTES.md",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/CHANNEL-PROMOTION-EVIDENCE.json",
          "release/PROMOTION-APPLY-MANIFESTS.json",
          "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
          "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
          "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
          "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
          "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
          "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
          "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
          "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
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

function buildReviewOnlyDeliveryChain({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-review-only-delivery-chain/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    title: "Delivery-chain Workspace",
    summary:
      "Stage Explorer keeps operator review board, promotion readiness, publish decision gates, rollback readiness, stage-level artifacts, blockers, handoff posture, and observability mapping grouped into one staged local-only delivery workflow.",
    activeStageId: "delivery-chain-operator-review",
    operatorReviewBoardPath: "release/OPERATOR-REVIEW-BOARD.json",
    releaseDecisionHandoffPath: "release/RELEASE-DECISION-HANDOFF.json",
    reviewEvidenceCloseoutPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json",
    paths: {
      promotionStageIds: ["delivery-chain-promotion-readiness"],
      publishStageIds: ["delivery-chain-publish-decision"],
      rollbackStageIds: ["delivery-chain-rollback-readiness"]
    },
    stages: [
      {
        id: "delivery-chain-attestation-intake",
        label: "Attestation intake",
        phase: "attestation",
        status: "ready",
        owner: "release-engineering",
        posture: "manifest spine sealed for operator pickup",
        summary: "Manifest, audit, and attestation evidence start the delivery chain from a typed intake packet instead of scattered files.",
        pipelineStageId: "stage-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        decisionHandoffId: "decision-handoff-attestation-intake",
        evidenceCloseoutId: "evidence-closeout-attestation-intake",
        escalationWindowId: "escalation-window-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        upstreamStageIds: [],
        downstreamStageIds: ["delivery-chain-operator-review"],
        artifactGroups: [
          {
            id: "delivery-chain-attestation-manifest",
            label: "Manifest spine",
            summary: "Manifest and review docs establish the intake boundary before reviewer routing starts.",
            artifacts: ["release/RELEASE-MANIFEST.json", "release/BUILD-METADATA.json", "release/REVIEW-MANIFEST.json"]
          },
          {
            id: "delivery-chain-attestation-evidence",
            label: "Attestation intake evidence",
            summary: "Verification packs and apply-audit packs stay bundled as one review-only intake envelope.",
            artifacts: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"]
          }
        ],
        blockedBy: ["intake acknowledgement remains metadata-only", "host-side execution remains disabled"]
      },
      {
        id: "delivery-chain-operator-review",
        label: "Operator review",
        phase: "review",
        status: "in-review",
        owner: "release-manager",
        posture: "active reviewer queue / acknowledgement pending",
        summary: "The active board now sits inside a wider delivery chain so reviewer ownership maps to a named delivery stage instead of stopping at the operator loop.",
        pipelineStageId: "stage-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        decisionHandoffId: "decision-handoff-approval-orchestration",
        evidenceCloseoutId: "evidence-closeout-approval-orchestration",
        escalationWindowId: "escalation-window-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        upstreamStageIds: ["delivery-chain-attestation-intake"],
        downstreamStageIds: ["delivery-chain-promotion-readiness"],
        artifactGroups: [
          {
            id: "delivery-chain-review-board",
            label: "Board / handoff / closeout",
            summary: "Board posture, baton posture, and evidence closeout stay grouped as one delivery checkpoint.",
            artifacts: [
              "release/OPERATOR-REVIEW-BOARD.json",
              "release/RELEASE-DECISION-HANDOFF.json",
              "release/REVIEW-EVIDENCE-CLOSEOUT.json",
              "release/RELEASE-APPROVAL-WORKFLOW.json"
            ]
          },
          {
            id: "delivery-chain-review-routing",
            label: "Approval routing",
            summary: "Approval routing contracts and orchestration packs anchor reviewer ownership and queue timing.",
            artifacts: [
              "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
              "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"
            ]
          }
        ],
        blockedBy: [
          "product-owner acknowledgement remains metadata-only",
          "signing-publish gating handshake remains blocked",
          "host-side execution remains disabled"
        ]
      },
      {
        id: "delivery-chain-promotion-readiness",
        label: "Promotion readiness",
        phase: "promotion",
        status: "planned",
        owner: "product-owner",
        posture: "promotion path declared / staged apply still review-only",
        summary: "Promotion evidence, apply manifests, staged apply closeout, and enforcement lifecycle are grouped as one promotion-review stage.",
        pipelineStageId: "stage-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        decisionHandoffId: "decision-handoff-lifecycle-enforcement",
        evidenceCloseoutId: "evidence-closeout-lifecycle-enforcement",
        escalationWindowId: "escalation-window-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        upstreamStageIds: ["delivery-chain-operator-review"],
        downstreamStageIds: ["delivery-chain-publish-decision", "delivery-chain-rollback-readiness"],
        artifactGroups: [
          {
            id: "delivery-chain-promotion-preflight",
            label: "Promotion preflight",
            summary: "Promotion evidence, apply readiness, manifests, checkpoints, and handoff rails define the pre-cutover review path.",
            artifacts: [
              "release/CHANNEL-PROMOTION-EVIDENCE.json",
              "release/PROMOTION-APPLY-READINESS.json",
              "release/PROMOTION-APPLY-MANIFESTS.json",
              "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
              "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json"
            ]
          },
          {
            id: "delivery-chain-promotion-closeout",
            label: "Staged apply closeout",
            summary: "Staged ledgers, runsheets, confirmations, signoffs, and enforcement lifecycle now read as one promotion-closeout path.",
            artifacts: [
              "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
              "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
              "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
              "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
              "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
              "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
              "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
              "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
            ]
          }
        ],
        blockedBy: ["promotion staged apply remains metadata-only", "approval closeout still blocks downstream acknowledgement"]
      },
      {
        id: "delivery-chain-rollback-readiness",
        label: "Rollback readiness",
        phase: "rollback",
        status: "planned",
        owner: "runtime-owner",
        posture: "rollback rehearsal visible / settlement still overdue",
        summary: "Rollback handshake, rehearsal, cutover records, and receipt settlement closeout are grouped as one recovery-facing review stage.",
        pipelineStageId: "stage-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        decisionHandoffId: "decision-handoff-rollback-settlement",
        evidenceCloseoutId: "evidence-closeout-rollback-settlement",
        escalationWindowId: "escalation-window-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        upstreamStageIds: ["delivery-chain-promotion-readiness"],
        downstreamStageIds: ["delivery-chain-publish-decision"],
        artifactGroups: [
          {
            id: "delivery-chain-rollback-recovery",
            label: "Recovery posture",
            summary: "Rollback handshake, recovery ledgers, rehearsal, drillbooks, and live-readiness checks define the recovery backbone.",
            artifacts: [
              "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
              "release/ROLLBACK-RECOVERY-LEDGER.json",
              "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
              "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
              "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json"
            ]
          },
          {
            id: "delivery-chain-rollback-cutover",
            label: "Cutover closeout",
            summary: "Cutover readiness, execution, outcome reporting, publication bundles, and receipt settlement stay bundled as one rollback review path.",
            artifacts: [
              "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
              "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
              "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
              "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
              "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
            ]
          }
        ],
        blockedBy: ["rollback publication remains review-only", "final decision board remains blocked"]
      },
      {
        id: "delivery-chain-publish-decision",
        label: "Publish decision gate",
        phase: "publish",
        status: "blocked",
        owner: "release-manager",
        posture: "signing / publish gates still metadata-only",
        summary: "Signing metadata, publish gates, promotion gates, and release notes now read like one blocked publish-facing decision stage.",
        pipelineStageId: "stage-final-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        decisionHandoffId: "decision-handoff-final-release-decision",
        evidenceCloseoutId: "evidence-closeout-final-release-decision",
        escalationWindowId: "escalation-window-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        upstreamStageIds: ["delivery-chain-promotion-readiness", "delivery-chain-rollback-readiness"],
        downstreamStageIds: [],
        artifactGroups: [
          {
            id: "delivery-chain-publish-signing",
            label: "Signing / publish handshake",
            summary: "Signing metadata, notarization, pipeline, approval bridge, and promotion handshake remain explicit publish inputs.",
            artifacts: [
              "release/SIGNING-METADATA.json",
              "release/NOTARIZATION-PLAN.json",
              "release/SIGNING-PUBLISH-PIPELINE.json",
              "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
              "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
              "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"
            ]
          },
          {
            id: "delivery-chain-publish-gates",
            label: "Release gates",
            summary: "Release notes plus publish and promotion gates make the blocked final decision concrete.",
            artifacts: ["release/RELEASE-NOTES.md", "release/PUBLISH-GATES.json", "release/PROMOTION-GATES.json"]
          }
        ],
        blockedBy: [
          "signing-publish gating handshake remains metadata-only",
          "publish rollback handshake remains metadata-only",
          "real publish automation remains blocked"
        ]
      }
    ],
    blockedBy: [
      "delivery-chain workspace remains review-only metadata",
      "promotion, publish, and rollback execution remain blocked",
      "host-side execution remains disabled"
    ]
  };
}

function buildOperatorReviewBoard({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-operator-review-board/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    board: {
      id: "operator-review-board-release-approval",
      title: "Operator Review Board",
      posture: "release-manager queue active / acknowledgement pending / review-only handoff",
      activeOwner: "release-manager",
      activeStageId: "stage-approval-orchestration",
      activeDeliveryChainStageId: "delivery-chain-operator-review",
      activePacketId: "review-packet-approval-orchestration",
      activeReviewerQueueId: "reviewer-queue-approval-orchestration",
      activeAcknowledgementState: "pending",
      activeEscalationWindowId: "escalation-window-approval-orchestration",
      activeCloseoutWindowId: "closeout-window-approval-orchestration",
      sharedStateLaneId: "shared-state-lane-trace-review",
      windowId: "window-trace-review",
      reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
      decisionHandoffPath: "release/RELEASE-DECISION-HANDOFF.json",
      evidenceCloseoutPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json"
    },
    reviewerNotes: [
      {
        id: "board-note-windowing",
        label: "Cross-window review lane",
        value: "Trace Review Lane / window-trace-review",
        detail: "Operator ownership is intentionally tied to the same shared-state lane and review window surfaced in the phase60 shell."
      },
      {
        id: "board-note-queue",
        label: "Reviewer queue",
        value: "Approval reviewer queue / pending acknowledgement",
        detail: "Queue ownership and acknowledgement state are explicit so the active review loop is auditable before any live reviewer dispatch exists."
      },
      {
        id: "board-note-baton",
        label: "Decision baton",
        value: "release-manager -> product-owner",
        detail: "The active baton remains metadata-only and local-only, but reviewer ownership, acknowledgement posture, and next-stage timing are explicit."
      },
      {
        id: "board-note-delivery-chain",
        label: "Delivery chain",
        value: "operator review -> promotion -> publish -> rollback",
        detail: "The board now points into a dedicated delivery-chain workspace artifact instead of stopping at the operator-review loop."
      },
      {
        id: "board-note-windows",
        label: "Escalation / closeout windows",
        value: "open / open",
        detail: "Escalation and closeout timing are first-class review-loop objects instead of hidden note fields."
      }
    ],
    stages: [
      {
        id: "stage-attestation-intake",
        label: "Attestation intake board",
        status: "ready",
        owner: "release-engineering",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        packetId: "review-packet-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        handoffId: "decision-handoff-attestation-intake",
        escalationWindowId: "escalation-window-attestation-intake",
        closeoutId: "evidence-closeout-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        evidence: [
          "release/RELEASE-MANIFEST.json",
          "release/ATTESTATION-VERIFICATION-PACKS.json",
          "release/ATTESTATION-APPLY-AUDIT-PACKS.json"
        ]
      },
      {
        id: "stage-approval-orchestration",
        label: "Approval orchestration board",
        status: "in-review",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-operator-review",
        packetId: "review-packet-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        handoffId: "decision-handoff-approval-orchestration",
        escalationWindowId: "escalation-window-approval-orchestration",
        closeoutId: "evidence-closeout-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        evidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/OPERATOR-REVIEW-BOARD.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ]
      },
      {
        id: "stage-lifecycle-enforcement",
        label: "Release decision lifecycle",
        status: "planned",
        owner: "product-owner",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        packetId: "review-packet-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        handoffId: "decision-handoff-lifecycle-enforcement",
        escalationWindowId: "escalation-window-lifecycle-enforcement",
        closeoutId: "evidence-closeout-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        evidence: [
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
          "release/RELEASE-DECISION-HANDOFF.json"
        ]
      },
      {
        id: "stage-rollback-settlement",
        label: "Rollback settlement closeout",
        status: "planned",
        owner: "runtime-owner",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        packetId: "review-packet-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        handoffId: "decision-handoff-rollback-settlement",
        escalationWindowId: "escalation-window-rollback-settlement",
        closeoutId: "evidence-closeout-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        evidence: [
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
        ]
      },
      {
        id: "stage-final-release-decision",
        label: "Final release decision board",
        status: "blocked",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-publish-decision",
        packetId: "review-packet-final-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        handoffId: "decision-handoff-final-release-decision",
        escalationWindowId: "escalation-window-final-release-decision",
        closeoutId: "evidence-closeout-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        evidence: [
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json"
        ]
      }
    ],
    reviewerQueues: [
      {
        id: "reviewer-queue-attestation-intake",
        label: "Intake reviewer queue",
        status: "handoff-ready",
        owner: "release-engineering",
        acknowledgementState: "acknowledged",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        stageId: "stage-attestation-intake",
        windowId: "window-shell-main",
        sharedStateLaneId: "shared-state-lane-boundary-review",
        entries: [
          { id: "queue-entry-attestation-intake-owner", owner: "release-engineering", status: "active", acknowledgementState: "acknowledged" },
          { id: "queue-entry-attestation-intake-board", owner: "release-manager", status: "queued", acknowledgementState: "pending" }
        ]
      },
      {
        id: "reviewer-queue-approval-orchestration",
        label: "Approval reviewer queue",
        status: "active",
        owner: "release-manager",
        acknowledgementState: "pending",
        deliveryChainStageId: "delivery-chain-operator-review",
        stageId: "stage-approval-orchestration",
        windowId: "window-trace-review",
        sharedStateLaneId: "shared-state-lane-trace-review",
        entries: [
          { id: "queue-entry-approval-owner", owner: "release-manager", status: "active", acknowledgementState: "pending" },
          { id: "queue-entry-approval-product-owner", owner: "product-owner", status: "awaiting-ack", acknowledgementState: "pending" },
          { id: "queue-entry-approval-runtime-owner", owner: "runtime-owner", status: "queued", acknowledgementState: "pending" }
        ]
      },
      {
        id: "reviewer-queue-lifecycle-enforcement",
        label: "Lifecycle reviewer queue",
        status: "handoff-ready",
        owner: "product-owner",
        acknowledgementState: "blocked",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        stageId: "stage-lifecycle-enforcement",
        windowId: "window-review-board",
        sharedStateLaneId: "shared-state-lane-preview-review",
        entries: [
          { id: "queue-entry-lifecycle-owner", owner: "product-owner", status: "queued", acknowledgementState: "blocked" },
          { id: "queue-entry-lifecycle-runtime-owner", owner: "runtime-owner", status: "queued", acknowledgementState: "blocked" }
        ]
      },
      {
        id: "reviewer-queue-rollback-settlement",
        label: "Rollback settlement queue",
        status: "escalated",
        owner: "runtime-owner",
        acknowledgementState: "overdue",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        stageId: "stage-rollback-settlement",
        windowId: "window-trace-review",
        sharedStateLaneId: "shared-state-lane-trace-review",
        entries: [
          { id: "queue-entry-rollback-owner", owner: "runtime-owner", status: "escalated", acknowledgementState: "overdue" },
          { id: "queue-entry-rollback-release-manager", owner: "release-manager", status: "queued", acknowledgementState: "overdue" }
        ]
      },
      {
        id: "reviewer-queue-final-release-decision",
        label: "Final decision queue",
        status: "closed",
        owner: "release-manager",
        acknowledgementState: "blocked",
        deliveryChainStageId: "delivery-chain-publish-decision",
        stageId: "stage-final-release-decision",
        windowId: "window-shell-main",
        sharedStateLaneId: "shared-state-lane-boundary-review",
        entries: [
          { id: "queue-entry-final-owner", owner: "release-manager", status: "closed", acknowledgementState: "blocked" },
          { id: "queue-entry-final-signing", owner: "signing-gate", status: "queued", acknowledgementState: "blocked" }
        ]
      }
    ],
    escalationWindows: [
      {
        id: "escalation-window-attestation-intake",
        label: "Intake escalation watch",
        state: "watch",
        acknowledgementState: "acknowledged",
        owner: "release-engineering",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        stageId: "stage-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        deadlineLabel: "Before board pickup",
        trigger: "Open only if release-manager pickup drifts past the local review window."
      },
      {
        id: "escalation-window-approval-orchestration",
        label: "Decision-lifecycle escalation window",
        state: "open",
        acknowledgementState: "pending",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-operator-review",
        stageId: "stage-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        deadlineLabel: "Next 30 min",
        trigger: "Escalate if product-owner acknowledgement remains pending after the current local review pass."
      },
      {
        id: "escalation-window-lifecycle-enforcement",
        label: "Lifecycle handoff escalation window",
        state: "blocked",
        acknowledgementState: "blocked",
        owner: "product-owner",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        stageId: "stage-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        deadlineLabel: "After approval closeout",
        trigger: "Blocked until approval closeout stops holding the lifecycle queue."
      },
      {
        id: "escalation-window-rollback-settlement",
        label: "Rollback settlement escalation window",
        state: "escalated",
        acknowledgementState: "overdue",
        owner: "runtime-owner",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        stageId: "stage-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        deadlineLabel: "Escalated now",
        trigger: "Lifecycle evidence is still missing after the local rollback review window elapsed."
      },
      {
        id: "escalation-window-final-release-decision",
        label: "Final decision escalation window",
        state: "blocked",
        acknowledgementState: "blocked",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-publish-decision",
        stageId: "stage-final-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        deadlineLabel: "Blocked by gates",
        trigger: "Cannot open until signing and publish gates stop being metadata-only."
      }
    ],
    closeoutWindows: [
      {
        id: "closeout-window-attestation-intake",
        label: "Intake closeout window",
        state: "scheduled",
        acknowledgementState: "acknowledged",
        owner: "release-engineering",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        stageId: "stage-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        sealedEvidence: ["release/RELEASE-MANIFEST.json"],
        pendingEvidence: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"]
      },
      {
        id: "closeout-window-approval-orchestration",
        label: "Approval closeout window",
        state: "open",
        acknowledgementState: "pending",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-operator-review",
        stageId: "stage-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        sealedEvidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"],
        pendingEvidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/RELEASE-DECISION-HANDOFF.json"
        ]
      },
      {
        id: "closeout-window-lifecycle-enforcement",
        label: "Lifecycle closeout window",
        state: "scheduled",
        acknowledgementState: "blocked",
        owner: "product-owner",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        stageId: "stage-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        sealedEvidence: [],
        pendingEvidence: [
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
        ]
      },
      {
        id: "closeout-window-rollback-settlement",
        label: "Rollback settlement closeout window",
        state: "ready-to-seal",
        acknowledgementState: "overdue",
        owner: "runtime-owner",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        stageId: "stage-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        sealedEvidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"],
        pendingEvidence: [
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ]
      },
      {
        id: "closeout-window-final-release-decision",
        label: "Final decision closeout window",
        state: "blocked",
        acknowledgementState: "blocked",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-publish-decision",
        stageId: "stage-final-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        sealedEvidence: [],
        pendingEvidence: [
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json"
        ]
      }
    ],
    blockedBy: [
      "operator review board remains review-only",
      "reviewer queues remain local-only metadata",
      "acknowledgement, escalation, and closeout windows remain descriptive only",
      "decision baton remains metadata-only",
      "host-side execution remains disabled"
    ]
  };
}

function buildReleaseDecisionHandoff({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-release-decision-handoff/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    activeHandoffId: "decision-handoff-approval-orchestration",
    activeReviewerQueueId: "reviewer-queue-approval-orchestration",
    activeDeliveryChainStageId: "delivery-chain-operator-review",
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    handoffs: [
      {
        id: "decision-handoff-attestation-intake",
        label: "Intake to approval handoff",
        batonState: "handoff-ready",
        acknowledgementState: "acknowledged",
        sourceOwner: "release-engineering",
        targetOwner: "release-manager",
        posture: "intake packet ready for approval routing",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        packetId: "review-packet-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        escalationWindowId: "escalation-window-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        pending: ["approval acknowledgement stays metadata-only", "host-side execution remains disabled"],
        linkedArtifacts: ["release/RELEASE-MANIFEST.json", "release/OPERATOR-REVIEW-BOARD.json"]
      },
      {
        id: "decision-handoff-approval-orchestration",
        label: "Approval to lifecycle handoff",
        batonState: "awaiting-ack",
        acknowledgementState: "pending",
        sourceOwner: "release-manager",
        targetOwner: "product-owner",
        posture: "reviewer baton waiting on decision-lifecycle acknowledgement",
        deliveryChainStageId: "delivery-chain-operator-review",
        packetId: "review-packet-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        escalationWindowId: "escalation-window-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        pending: [
          "product-owner acknowledgement remains metadata-only",
          "signing-publish gating handshake remains blocked",
          "host-side execution remains disabled"
        ],
        linkedArtifacts: ["release/OPERATOR-REVIEW-BOARD.json", "release/RELEASE-DECISION-HANDOFF.json"]
      },
      {
        id: "decision-handoff-lifecycle-enforcement",
        label: "Lifecycle to rollback handoff",
        batonState: "held",
        acknowledgementState: "blocked",
        sourceOwner: "product-owner",
        targetOwner: "runtime-owner",
        posture: "lifecycle packet held until approval board closes",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        packetId: "review-packet-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        escalationWindowId: "escalation-window-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        pending: ["approval board closeout remains open", "rollback closeout remains metadata-only"],
        linkedArtifacts: [
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
        ]
      },
      {
        id: "decision-handoff-rollback-settlement",
        label: "Rollback closeout to final decision handoff",
        batonState: "held",
        acknowledgementState: "overdue",
        sourceOwner: "runtime-owner",
        targetOwner: "release-manager",
        posture: "rollback closeout queued behind lifecycle evidence",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        packetId: "review-packet-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        escalationWindowId: "escalation-window-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        pending: ["rollback publication remains review-only", "final decision board remains blocked"],
        linkedArtifacts: [
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
        ]
      },
      {
        id: "decision-handoff-final-release-decision",
        label: "Final decision handoff",
        batonState: "blocked",
        acknowledgementState: "blocked",
        sourceOwner: "release-manager",
        targetOwner: "signing-gate",
        posture: "blocked by publish and signing gates",
        deliveryChainStageId: "delivery-chain-publish-decision",
        packetId: "review-packet-final-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        escalationWindowId: "escalation-window-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        pending: [
          "signing-publish gating handshake remains metadata-only",
          "publish rollback handshake remains metadata-only",
          "real publish automation remains blocked"
        ],
        linkedArtifacts: ["release/SIGNING-PUBLISH-GATING-HANDSHAKE.json", "release/PUBLISH-GATES.json"]
      }
    ],
    blockedBy: [
      "all decision handoffs remain local-only metadata",
      "reviewer acknowledgement remains metadata-only",
      "signing / publish / rollback execution remain blocked",
      "host-side execution remains disabled"
    ]
  };
}

function buildReviewEvidenceCloseout({ generatedAt }) {
  return {
    schemaVersion: "openclaw-studio-review-evidence-closeout/v1",
    generatedAt,
    phase: PHASE_ID,
    mode: "local-only-review",
    activeCloseoutId: "evidence-closeout-approval-orchestration",
    activeCloseoutWindowId: "closeout-window-approval-orchestration",
    activeDeliveryChainStageId: "delivery-chain-operator-review",
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    closeouts: [
      {
        id: "evidence-closeout-attestation-intake",
        label: "Intake evidence closeout",
        sealingState: "pending-seal",
        acknowledgementState: "acknowledged",
        owner: "release-engineering",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        sealedEvidence: ["release/RELEASE-MANIFEST.json"],
        pendingEvidence: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"],
        linkedHandoffId: "decision-handoff-attestation-intake"
      },
      {
        id: "evidence-closeout-approval-orchestration",
        label: "Approval evidence closeout",
        sealingState: "open",
        acknowledgementState: "pending",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-operator-review",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        sealedEvidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"],
        pendingEvidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ],
        linkedHandoffId: "decision-handoff-approval-orchestration"
      },
      {
        id: "evidence-closeout-lifecycle-enforcement",
        label: "Lifecycle evidence closeout",
        sealingState: "open",
        acknowledgementState: "blocked",
        owner: "product-owner",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        sealedEvidence: [],
        pendingEvidence: [
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
        ],
        linkedHandoffId: "decision-handoff-lifecycle-enforcement"
      },
      {
        id: "evidence-closeout-rollback-settlement",
        label: "Rollback evidence closeout",
        sealingState: "pending-seal",
        acknowledgementState: "overdue",
        owner: "runtime-owner",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        sealedEvidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"],
        pendingEvidence: [
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ],
        linkedHandoffId: "decision-handoff-rollback-settlement"
      },
      {
        id: "evidence-closeout-final-release-decision",
        label: "Final decision closeout",
        sealingState: "blocked",
        acknowledgementState: "blocked",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-publish-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        sealedEvidence: [],
        pendingEvidence: [
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json"
        ],
        linkedHandoffId: "decision-handoff-final-release-decision"
      }
    ],
    closeoutWindows: [
      {
        id: "closeout-window-attestation-intake",
        label: "Intake closeout window",
        state: "scheduled",
        acknowledgementState: "acknowledged",
        owner: "release-engineering",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        sealedEvidence: ["release/RELEASE-MANIFEST.json"],
        pendingEvidence: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"]
      },
      {
        id: "closeout-window-approval-orchestration",
        label: "Approval closeout window",
        state: "open",
        acknowledgementState: "pending",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-operator-review",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        sealedEvidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"],
        pendingEvidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/RELEASE-DECISION-HANDOFF.json"
        ]
      },
      {
        id: "closeout-window-lifecycle-enforcement",
        label: "Lifecycle closeout window",
        state: "scheduled",
        acknowledgementState: "blocked",
        owner: "product-owner",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        sealedEvidence: [],
        pendingEvidence: [
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
        ]
      },
      {
        id: "closeout-window-rollback-settlement",
        label: "Rollback settlement closeout window",
        state: "ready-to-seal",
        acknowledgementState: "overdue",
        owner: "runtime-owner",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        sealedEvidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"],
        pendingEvidence: [
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ]
      },
      {
        id: "closeout-window-final-release-decision",
        label: "Final decision closeout window",
        state: "blocked",
        acknowledgementState: "blocked",
        owner: "release-manager",
        deliveryChainStageId: "delivery-chain-publish-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        sealedEvidence: [],
        pendingEvidence: [
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json"
        ]
      }
    ],
    blockedBy: [
      "evidence sealing remains review-only",
      "closeout windows remain metadata-only",
      "publish / promotion closeout remains blocked",
      "host-side execution remains disabled"
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
      { id: "gate-attestation-verification-packs", label: "Attestation verification packs reviewed", status: "planned" },
      { id: "gate-attestation-apply-audit-packs", label: "Attestation apply audit packs reviewed", status: "planned" },
      { id: "gate-attestation-apply-execution-packets", label: "Attestation apply execution packets reviewed", status: "planned" },
      { id: "gate-attestation-operator-worklists", label: "Attestation operator worklists reviewed", status: "planned" },
      { id: "gate-attestation-operator-dispatch-manifests", label: "Attestation operator dispatch manifests reviewed", status: "blocked" },
      { id: "gate-attestation-operator-dispatch-packets", label: "Attestation operator dispatch packets reviewed", status: "blocked" },
      { id: "gate-attestation-operator-dispatch-receipts", label: "Attestation operator dispatch receipts reviewed", status: "blocked" },
      { id: "gate-attestation-operator-reconciliation-ledgers", label: "Attestation operator reconciliation ledgers reviewed", status: "blocked" },
      { id: "gate-attestation-operator-settlement-packs", label: "Attestation operator settlement packs reviewed", status: "blocked" },
      { id: "gate-attestation-operator-approval-routing-contracts", label: "Attestation operator approval routing contracts reviewed", status: "blocked" },
      { id: "gate-attestation-operator-approval-orchestration", label: "Attestation operator approval orchestration reviewed", status: "blocked" },
      { id: "gate-installer-targets", label: "Installer targets reviewed", status: "planned" },
      { id: "gate-installer-builder-execution", label: "Installer builder execution reviewed", status: "planned" },
      { id: "gate-installer-builder-orchestration", label: "Installer builder orchestration reviewed", status: "planned" },
      { id: "gate-installer-channel-routing", label: "Installer channel routing reviewed", status: "planned" },
      { id: "gate-channel-promotion-evidence", label: "Channel promotion evidence reviewed", status: "planned" },
      { id: "gate-promotion-apply-manifests", label: "Promotion apply manifests reviewed", status: "planned" },
      { id: "gate-promotion-execution-checkpoints", label: "Promotion execution checkpoints reviewed", status: "blocked" },
      { id: "gate-promotion-operator-handoff-rails", label: "Promotion operator handoff rails reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-ledgers", label: "Promotion staged-apply ledgers reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-runsheets", label: "Promotion staged-apply runsheets reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-command-sheets", label: "Promotion staged-apply command sheets reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-confirmation-ledgers", label: "Promotion staged-apply confirmation ledgers reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-closeout-journals", label: "Promotion staged-apply closeout journals reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-signoff-sheets", label: "Promotion staged-apply signoff sheets reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-release-decision-enforcement-contracts", label: "Promotion staged-apply release decision enforcement contracts reviewed", status: "blocked" },
      { id: "gate-promotion-staged-apply-release-decision-enforcement-lifecycle", label: "Promotion staged-apply release decision enforcement lifecycle reviewed", status: "blocked" },
      { id: "gate-signing", label: "Signing / notarization complete", status: "blocked" },
      { id: "gate-signing-handshake", label: "Signing-publish gating handshake resolved", status: "blocked" },
      { id: "gate-approval-bridge", label: "Signing-publish approval bridge resolved", status: "blocked" },
      { id: "gate-promotion-handshake", label: "Signing-publish promotion handshake resolved", status: "blocked" },
      { id: "gate-publish-rollback-handshake", label: "Publish rollback handshake resolved", status: "blocked" },
      { id: "gate-rollback-execution-rehearsal-ledger", label: "Rollback execution rehearsal ledger reviewed", status: "blocked" },
      { id: "gate-rollback-operator-drillbooks", label: "Rollback operator drillbooks reviewed", status: "blocked" },
      { id: "gate-rollback-live-readiness-contracts", label: "Rollback live-readiness contracts reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-readiness-maps", label: "Rollback cutover readiness maps reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-handoff-plans", label: "Rollback cutover handoff plans reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-execution-checklists", label: "Rollback cutover execution checklists reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-execution-records", label: "Rollback cutover execution records reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-outcome-reports", label: "Rollback cutover outcome reports reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-publication-bundles", label: "Rollback cutover publication bundles reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-publication-receipt-closeout-contracts", label: "Rollback cutover publication receipt closeout contracts reviewed", status: "blocked" },
      { id: "gate-rollback-cutover-publication-receipt-settlement-closeout", label: "Rollback cutover publication receipt settlement closeout reviewed", status: "blocked" },
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
          "attestation verification packs",
          "attestation apply audit packs",
          "attestation apply execution packets",
          "attestation operator worklists",
          "attestation operator dispatch manifests",
          "attestation operator dispatch packets",
          "attestation operator dispatch receipts",
          "attestation operator reconciliation ledgers",
          "attestation operator settlement packs",
          "attestation operator approval routing contracts",
          "attestation operator approval orchestration",
          "installer targets",
          "installer builder execution",
          "installer channel routing",
          "channel promotion evidence",
          "promotion apply manifests",
          "promotion execution checkpoints",
          "promotion operator handoff rails",
          "promotion staged-apply ledgers",
          "promotion staged-apply runsheets",
          "promotion staged-apply command sheets",
          "promotion staged-apply confirmation ledgers",
          "promotion staged-apply closeout journals",
          "promotion staged-apply signoff sheets",
          "promotion staged-apply release decision enforcement contracts",
          "promotion staged-apply release decision enforcement lifecycle",
          "signing",
          "signing-publish gating handshake",
          "signing-publish promotion handshake",
          "publish rollback handshake",
          "rollback execution rehearsal ledger",
          "rollback operator drillbooks",
          "rollback live-readiness contracts",
          "rollback cutover readiness maps",
          "rollback cutover handoff plans",
          "rollback cutover execution checklists",
          "rollback cutover execution records",
          "rollback cutover outcome reports",
          "rollback cutover publication bundles",
          "rollback cutover publication receipt closeout contracts",
          "rollback cutover publication receipt settlement closeout",
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
          "attestation verification packs",
          "attestation apply audit packs",
          "attestation apply execution packets",
          "attestation operator worklists",
          "attestation operator dispatch manifests",
          "attestation operator dispatch packets",
          "attestation operator dispatch receipts",
          "attestation operator reconciliation ledgers",
          "attestation operator settlement packs",
          "attestation operator approval routing contracts",
          "attestation operator approval orchestration",
          "installer channel routing",
          "channel promotion evidence",
          "promotion apply manifests",
          "promotion execution checkpoints",
          "promotion operator handoff rails",
          "promotion staged-apply ledgers",
          "promotion staged-apply runsheets",
          "promotion staged-apply command sheets",
          "promotion staged-apply confirmation ledgers",
          "promotion staged-apply closeout journals",
          "promotion staged-apply signoff sheets",
          "promotion staged-apply release decision enforcement contracts",
          "promotion staged-apply release decision enforcement lifecycle",
          "signing-publish gating handshake",
          "signing-publish promotion handshake",
          "publish rollback handshake",
          "rollback execution rehearsal ledger",
          "rollback operator drillbooks",
          "rollback live-readiness contracts",
          "rollback cutover readiness maps",
          "rollback cutover handoff plans",
          "rollback cutover execution checklists",
          "rollback cutover execution records",
          "rollback cutover outcome reports",
          "rollback cutover publication bundles",
          "rollback cutover publication receipt closeout contracts",
          "rollback cutover publication receipt settlement closeout",
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
    "console.log(`attestation verification packs metadata: ${manifest.attestationVerificationPacksPath}`);",
    "console.log(`attestation apply audit packs metadata: ${manifest.attestationApplyAuditPacksPath}`);",
    "console.log(`attestation apply execution packets metadata: ${manifest.attestationApplyExecutionPacketsPath}`);",
    "console.log(`attestation operator worklists metadata: ${manifest.attestationOperatorWorklistsPath}`);",
    "console.log(`attestation operator dispatch manifests metadata: ${manifest.attestationOperatorDispatchManifestsPath}`);",
    "console.log(`attestation operator dispatch packets metadata: ${manifest.attestationOperatorDispatchPacketsPath}`);",
    "console.log(`attestation operator dispatch receipts metadata: ${manifest.attestationOperatorDispatchReceiptsPath}`);",
    "console.log(`attestation operator reconciliation ledgers metadata: ${manifest.attestationOperatorReconciliationLedgersPath}`);",
    "console.log(`attestation operator settlement packs metadata: ${manifest.attestationOperatorSettlementPacksPath}`);",
    "console.log(`attestation operator approval routing contracts metadata: ${manifest.attestationOperatorApprovalRoutingContractsPath}`);",
    "console.log(`attestation operator approval orchestration metadata: ${manifest.attestationOperatorApprovalOrchestrationPath}`);",
    "console.log(`delivery-chain workspace metadata: ${manifest.reviewOnlyDeliveryChainPath}`);",
    "console.log(`operator review board metadata: ${manifest.operatorReviewBoardPath}`);",
    "console.log(`release decision handoff metadata: ${manifest.releaseDecisionHandoffPath}`);",
    "console.log(`review evidence closeout metadata: ${manifest.reviewEvidenceCloseoutPath}`);",
    "console.log(`installer targets metadata: ${manifest.installerTargetsPath}`);",
    "console.log(`installer builder execution metadata: ${manifest.installerBuilderExecutionSkeletonPath}`);",
    "console.log(`installer-target builder metadata: ${manifest.installerTargetBuilderSkeletonPath}`);",
    "console.log(`installer builder orchestration metadata: ${manifest.installerBuilderOrchestrationPath}`);",
    "console.log(`installer channel routing metadata: ${manifest.installerChannelRoutingPath}`);",
    "console.log(`channel promotion evidence metadata: ${manifest.channelPromotionEvidencePath}`);",
    "console.log(`promotion apply manifests metadata: ${manifest.promotionApplyManifestsPath}`);",
    "console.log(`promotion execution checkpoints metadata: ${manifest.promotionExecutionCheckpointsPath}`);",
    "console.log(`promotion operator handoff rails metadata: ${manifest.promotionOperatorHandoffRailsPath}`);",
    "console.log(`promotion staged-apply ledgers metadata: ${manifest.promotionStagedApplyLedgersPath}`);",
    "console.log(`promotion staged-apply runsheets metadata: ${manifest.promotionStagedApplyRunsheetsPath}`);",
    "console.log(`promotion staged-apply command sheets metadata: ${manifest.promotionStagedApplyCommandSheetsPath}`);",
    "console.log(`promotion staged-apply confirmation ledgers metadata: ${manifest.promotionStagedApplyConfirmationLedgersPath}`);",
    "console.log(`promotion staged-apply closeout journals metadata: ${manifest.promotionStagedApplyCloseoutJournalsPath}`);",
    "console.log(`promotion staged-apply signoff sheets metadata: ${manifest.promotionStagedApplySignoffSheetsPath}`);",
    "console.log(`promotion staged-apply release decision enforcement contracts metadata: ${manifest.promotionStagedApplyReleaseDecisionEnforcementContractsPath}`);",
    "console.log(`promotion staged-apply release decision enforcement lifecycle metadata: ${manifest.promotionStagedApplyReleaseDecisionEnforcementLifecyclePath}`);",
    "console.log(`signing-publish gating handshake metadata: ${manifest.signingPublishGatingHandshakePath}`);",
    "console.log(`signing & publish pipeline metadata: ${manifest.signingPublishPipelinePath}`);",
    "console.log(`signing-publish approval bridge metadata: ${manifest.signingPublishApprovalBridgePath}`);",
    "console.log(`signing-publish promotion handshake metadata: ${manifest.signingPublishPromotionHandshakePath}`);",
    "console.log(`publish rollback handshake metadata: ${manifest.publishRollbackHandshakePath}`);",
    "console.log(`rollback execution rehearsal ledger metadata: ${manifest.rollbackExecutionRehearsalLedgerPath}`);",
    "console.log(`rollback operator drillbooks metadata: ${manifest.rollbackOperatorDrillbooksPath}`);",
    "console.log(`rollback live-readiness contracts metadata: ${manifest.rollbackLiveReadinessContractsPath}`);",
    "console.log(`rollback cutover readiness maps metadata: ${manifest.rollbackCutoverReadinessMapsPath}`);",
    "console.log(`rollback cutover handoff plans metadata: ${manifest.rollbackCutoverHandoffPlansPath}`);",
    "console.log(`rollback cutover execution checklists metadata: ${manifest.rollbackCutoverExecutionChecklistsPath}`);",
    "console.log(`rollback cutover execution records metadata: ${manifest.rollbackCutoverExecutionRecordsPath}`);",
    "console.log(`rollback cutover outcome reports metadata: ${manifest.rollbackCutoverOutcomeReportsPath}`);",
    "console.log(`rollback cutover publication bundles metadata: ${manifest.rollbackCutoverPublicationBundlesPath}`);",
    "console.log(`rollback cutover publication receipt closeout contracts metadata: ${manifest.rollbackCutoverPublicationReceiptCloseoutContractsPath}`);",
    "console.log(`rollback cutover publication receipt settlement closeout metadata: ${manifest.rollbackCutoverPublicationReceiptSettlementCloseoutPath}`);",
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
    integrityAttestationEvidencePath: "release/INTEGRITY-ATTESTATION-EVIDENCE.json",
    attestationVerificationPacksPath: "release/ATTESTATION-VERIFICATION-PACKS.json",
    attestationApplyAuditPacksPath: "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    attestationApplyExecutionPacketsPath: "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    attestationOperatorWorklistsPath: "release/ATTESTATION-OPERATOR-WORKLISTS.json",
    attestationOperatorDispatchManifestsPath: "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    attestationOperatorDispatchPacketsPath: "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    attestationOperatorDispatchReceiptsPath: "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    attestationOperatorReconciliationLedgersPath: "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    attestationOperatorSettlementPacksPath: "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    attestationOperatorApprovalRoutingContractsPath: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    attestationOperatorApprovalOrchestrationPath: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    operatorReviewBoardPath: "release/OPERATOR-REVIEW-BOARD.json",
    releaseDecisionHandoffPath: "release/RELEASE-DECISION-HANDOFF.json",
    reviewEvidenceCloseoutPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json",
    installerTargetsPath: "release/INSTALLER-TARGETS.json",
    installerBuilderExecutionSkeletonPath: "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    installerTargetBuilderSkeletonPath: "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
    installerBuilderOrchestrationPath: "release/INSTALLER-BUILDER-ORCHESTRATION.json",
    installerChannelRoutingPath: "release/INSTALLER-CHANNEL-ROUTING.json",
    channelPromotionEvidencePath: "release/CHANNEL-PROMOTION-EVIDENCE.json",
    promotionApplyReadinessPath: "release/PROMOTION-APPLY-READINESS.json",
    promotionApplyManifestsPath: "release/PROMOTION-APPLY-MANIFESTS.json",
    promotionExecutionCheckpointsPath: "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
    promotionOperatorHandoffRailsPath: "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    promotionStagedApplyLedgersPath: "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
    promotionStagedApplyRunsheetsPath: "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    promotionStagedApplyCommandSheetsPath: "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    promotionStagedApplyConfirmationLedgersPath: "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    promotionStagedApplyCloseoutJournalsPath: "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    promotionStagedApplySignoffSheetsPath: "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    promotionStagedApplyReleaseDecisionEnforcementContractsPath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    promotionStagedApplyReleaseDecisionEnforcementLifecyclePath: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    signingPublishGatingHandshakePath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    signingPublishPipelinePath: "release/SIGNING-PUBLISH-PIPELINE.json",
    signingPublishApprovalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    signingPublishPromotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    publishRollbackHandshakePath: "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    rollbackRecoveryLedgerPath: "release/ROLLBACK-RECOVERY-LEDGER.json",
    rollbackExecutionRehearsalLedgerPath: "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
    rollbackOperatorDrillbooksPath: "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
    rollbackLiveReadinessContractsPath: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    rollbackCutoverReadinessMapsPath: "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
    rollbackCutoverHandoffPlansPath: "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    rollbackCutoverExecutionChecklistsPath: "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    rollbackCutoverExecutionRecordsPath: "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    rollbackCutoverOutcomeReportsPath: "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    rollbackCutoverPublicationBundlesPath: "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    rollbackCutoverPublicationReceiptCloseoutContractsPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    rollbackCutoverPublicationReceiptSettlementCloseoutPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
  const integrityAttestationEvidence = buildIntegrityAttestationEvidence({
    generatedAt
  });
  const attestationVerificationPacks = buildAttestationVerificationPacks({
    generatedAt
  });
  const attestationApplyAuditPacks = buildAttestationApplyAuditPacks({
    generatedAt
  });
  const attestationApplyExecutionPackets = buildAttestationApplyExecutionPackets({
    generatedAt
  });
  const attestationOperatorWorklists = buildAttestationOperatorWorklists({
    generatedAt
  });
  const attestationOperatorDispatchManifests = buildAttestationOperatorDispatchManifests({
    generatedAt
  });
  const attestationOperatorDispatchPackets = buildAttestationOperatorDispatchPackets({
    generatedAt
  });
  const attestationOperatorDispatchReceipts = buildAttestationOperatorDispatchReceipts({
    generatedAt
  });
  const attestationOperatorReconciliationLedgers = buildAttestationOperatorReconciliationLedgers({
    generatedAt
  });
  const attestationOperatorSettlementPacks = buildAttestationOperatorSettlementPacks({
    generatedAt
  });
  const attestationOperatorApprovalRoutingContracts = buildAttestationOperatorApprovalRoutingContracts({
    generatedAt
  });
  const attestationOperatorApprovalOrchestration = buildAttestationOperatorApprovalOrchestration({
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
  const promotionApplyReadiness = buildPromotionApplyReadiness({
    generatedAt
  });
  const promotionApplyManifests = buildPromotionApplyManifests({
    generatedAt
  });
  const promotionExecutionCheckpoints = buildPromotionExecutionCheckpoints({
    generatedAt
  });
  const promotionOperatorHandoffRails = buildPromotionOperatorHandoffRails({
    generatedAt
  });
  const promotionStagedApplyLedgers = buildPromotionStagedApplyLedgers({
    generatedAt
  });
  const promotionStagedApplyRunsheets = buildPromotionStagedApplyRunsheets({
    generatedAt
  });
  const promotionStagedApplyCommandSheets = buildPromotionStagedApplyCommandSheets({
    generatedAt
  });
  const promotionStagedApplyConfirmationLedgers = buildPromotionStagedApplyConfirmationLedgers({
    generatedAt
  });
  const promotionStagedApplyCloseoutJournals = buildPromotionStagedApplyCloseoutJournals({
    generatedAt
  });
  const promotionStagedApplySignoffSheets = buildPromotionStagedApplySignoffSheets({
    generatedAt
  });
  const promotionStagedApplyReleaseDecisionEnforcementContracts = buildPromotionStagedApplyReleaseDecisionEnforcementContracts({
    generatedAt
  });
  const promotionStagedApplyReleaseDecisionEnforcementLifecycle = buildPromotionStagedApplyReleaseDecisionEnforcementLifecycle({
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
  const rollbackRecoveryLedger = buildRollbackRecoveryLedger({
    generatedAt
  });
  const rollbackExecutionRehearsalLedger = buildRollbackExecutionRehearsalLedger({
    generatedAt
  });
  const rollbackOperatorDrillbooks = buildRollbackOperatorDrillbooks({
    generatedAt
  });
  const rollbackLiveReadinessContracts = buildRollbackLiveReadinessContracts({
    generatedAt
  });
  const rollbackCutoverReadinessMaps = buildRollbackCutoverReadinessMaps({
    generatedAt
  });
  const rollbackCutoverHandoffPlans = buildRollbackCutoverHandoffPlans({
    generatedAt
  });
  const rollbackCutoverExecutionChecklists = buildRollbackCutoverExecutionChecklists({
    generatedAt
  });
  const rollbackCutoverExecutionRecords = buildRollbackCutoverExecutionRecords({
    generatedAt
  });
  const rollbackCutoverOutcomeReports = buildRollbackCutoverOutcomeReports({
    generatedAt
  });
  const rollbackCutoverPublicationBundles = buildRollbackCutoverPublicationBundles({
    generatedAt
  });
  const rollbackCutoverPublicationReceiptCloseoutContracts = buildRollbackCutoverPublicationReceiptCloseoutContracts({
    generatedAt
  });
  const rollbackCutoverPublicationReceiptSettlementCloseout = buildRollbackCutoverPublicationReceiptSettlementCloseout({
    generatedAt
  });
  const releaseApprovalWorkflow = buildReleaseApprovalWorkflow({
    generatedAt
  });
  const reviewOnlyDeliveryChain = buildReviewOnlyDeliveryChain({
    generatedAt
  });
  const operatorReviewBoard = buildOperatorReviewBoard({
    generatedAt
  });
  const releaseDecisionHandoff = buildReleaseDecisionHandoff({
    generatedAt
  });
  const reviewEvidenceCloseout = buildReviewEvidenceCloseout({
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
    integrityAttestationEvidence,
    attestationVerificationPacks,
    attestationApplyAuditPacks,
    attestationApplyExecutionPackets,
    attestationOperatorWorklists,
    attestationOperatorDispatchManifests,
    attestationOperatorDispatchPackets,
    attestationOperatorDispatchReceipts,
    attestationOperatorReconciliationLedgers,
    attestationOperatorSettlementPacks,
    attestationOperatorApprovalRoutingContracts,
    attestationOperatorApprovalOrchestration,
    reviewOnlyDeliveryChain,
    installerTargets,
    installerBuilderExecutionSkeleton,
    installerTargetBuilderSkeleton,
    installerBuilderOrchestration,
    installerChannelRouting,
    channelPromotionEvidence,
    promotionApplyReadiness,
    promotionApplyManifests,
    promotionExecutionCheckpoints,
    promotionOperatorHandoffRails,
    promotionStagedApplyLedgers,
    promotionStagedApplyRunsheets,
    promotionStagedApplyCommandSheets,
    promotionStagedApplyConfirmationLedgers,
    promotionStagedApplyCloseoutJournals,
    promotionStagedApplySignoffSheets,
    promotionStagedApplyReleaseDecisionEnforcementContracts,
    promotionStagedApplyReleaseDecisionEnforcementLifecycle,
    signingMetadata,
    notarizationPlan,
    signingPublishGatingHandshake,
    signingPublishPipeline,
    signingPublishApprovalBridge,
    signingPublishPromotionHandshake,
    publishRollbackHandshake,
    rollbackRecoveryLedger,
    rollbackExecutionRehearsalLedger,
    rollbackOperatorDrillbooks,
    rollbackLiveReadinessContracts,
    rollbackCutoverReadinessMaps,
    rollbackCutoverHandoffPlans,
    rollbackCutoverExecutionChecklists,
    rollbackCutoverExecutionRecords,
    rollbackCutoverOutcomeReports,
    rollbackCutoverPublicationBundles,
    rollbackCutoverPublicationReceiptCloseoutContracts,
    rollbackCutoverPublicationReceiptSettlementCloseout,
    releaseApprovalWorkflow,
    operatorReviewBoard,
    releaseDecisionHandoff,
    reviewEvidenceCloseout,
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
  writeJsonFile(
    path.join(destinationRoot, "release", "INTEGRITY-ATTESTATION-EVIDENCE.json"),
    skeleton.integrityAttestationEvidence
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-VERIFICATION-PACKS.json"),
    skeleton.attestationVerificationPacks
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-APPLY-AUDIT-PACKS.json"),
    skeleton.attestationApplyAuditPacks
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-APPLY-EXECUTION-PACKETS.json"),
    skeleton.attestationApplyExecutionPackets
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-WORKLISTS.json"),
    skeleton.attestationOperatorWorklists
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json"),
    skeleton.attestationOperatorDispatchManifests
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-DISPATCH-PACKETS.json"),
    skeleton.attestationOperatorDispatchPackets
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json"),
    skeleton.attestationOperatorDispatchReceipts
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json"),
    skeleton.attestationOperatorReconciliationLedgers
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json"),
    skeleton.attestationOperatorSettlementPacks
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"),
    skeleton.attestationOperatorApprovalRoutingContracts
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"),
    skeleton.attestationOperatorApprovalOrchestration
  );
  writeJsonFile(path.join(destinationRoot, "release", "REVIEW-ONLY-DELIVERY-CHAIN.json"), skeleton.reviewOnlyDeliveryChain);
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
  writeJsonFile(path.join(destinationRoot, "release", "PROMOTION-APPLY-READINESS.json"), skeleton.promotionApplyReadiness);
  writeJsonFile(path.join(destinationRoot, "release", "PROMOTION-APPLY-MANIFESTS.json"), skeleton.promotionApplyManifests);
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-EXECUTION-CHECKPOINTS.json"),
    skeleton.promotionExecutionCheckpoints
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-OPERATOR-HANDOFF-RAILS.json"),
    skeleton.promotionOperatorHandoffRails
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-LEDGERS.json"),
    skeleton.promotionStagedApplyLedgers
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-RUNSHEETS.json"),
    skeleton.promotionStagedApplyRunsheets
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json"),
    skeleton.promotionStagedApplyCommandSheets
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json"),
    skeleton.promotionStagedApplyConfirmationLedgers
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json"),
    skeleton.promotionStagedApplyCloseoutJournals
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json"),
    skeleton.promotionStagedApplySignoffSheets
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json"),
    skeleton.promotionStagedApplyReleaseDecisionEnforcementContracts
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"),
    skeleton.promotionStagedApplyReleaseDecisionEnforcementLifecycle
  );
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
    path.join(destinationRoot, "release", "ROLLBACK-RECOVERY-LEDGER.json"),
    skeleton.rollbackRecoveryLedger
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json"),
    skeleton.rollbackExecutionRehearsalLedger
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-OPERATOR-DRILLBOOKS.json"),
    skeleton.rollbackOperatorDrillbooks
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-LIVE-READINESS-CONTRACTS.json"),
    skeleton.rollbackLiveReadinessContracts
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-READINESS-MAPS.json"),
    skeleton.rollbackCutoverReadinessMaps
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-HANDOFF-PLANS.json"),
    skeleton.rollbackCutoverHandoffPlans
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json"),
    skeleton.rollbackCutoverExecutionChecklists
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-EXECUTION-RECORDS.json"),
    skeleton.rollbackCutoverExecutionRecords
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-OUTCOME-REPORTS.json"),
    skeleton.rollbackCutoverOutcomeReports
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json"),
    skeleton.rollbackCutoverPublicationBundles
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"),
    skeleton.rollbackCutoverPublicationReceiptCloseoutContracts
  );
  writeJsonFile(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"),
    skeleton.rollbackCutoverPublicationReceiptSettlementCloseout
  );
  writeJsonFile(path.join(destinationRoot, "release", "OPERATOR-REVIEW-BOARD.json"), skeleton.operatorReviewBoard);
  writeJsonFile(path.join(destinationRoot, "release", "RELEASE-DECISION-HANDOFF.json"), skeleton.releaseDecisionHandoff);
  writeJsonFile(path.join(destinationRoot, "release", "REVIEW-EVIDENCE-CLOSEOUT.json"), skeleton.reviewEvidenceCloseout);
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
    "release/INTEGRITY-ATTESTATION-EVIDENCE.json",
    "release/ATTESTATION-VERIFICATION-PACKS.json",
    "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    "release/ATTESTATION-OPERATOR-WORKLISTS.json",
    "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
    "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
    "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    "release/OPERATOR-REVIEW-BOARD.json",
    "release/RELEASE-DECISION-HANDOFF.json",
    "release/REVIEW-EVIDENCE-CLOSEOUT.json",
    "release/INSTALLER-TARGETS.json",
    "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
    "release/INSTALLER-BUILDER-ORCHESTRATION.json",
    "release/INSTALLER-CHANNEL-ROUTING.json",
    "release/CHANNEL-PROMOTION-EVIDENCE.json",
    "release/PROMOTION-APPLY-READINESS.json",
    "release/PROMOTION-APPLY-MANIFESTS.json",
    "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
    "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
    "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
    "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
    "release/SIGNING-METADATA.json",
    "release/NOTARIZATION-PLAN.json",
    "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    "release/SIGNING-PUBLISH-PIPELINE.json",
    "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    "release/ROLLBACK-RECOVERY-LEDGER.json",
    "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
    "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
    "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
    "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
    "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
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
  const writtenIntegrityAttestationEvidence = readJson(
    path.join(destinationRoot, "release", "INTEGRITY-ATTESTATION-EVIDENCE.json")
  );
  const writtenAttestationVerificationPacks = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-VERIFICATION-PACKS.json")
  );
  const writtenAttestationApplyAuditPacks = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-APPLY-AUDIT-PACKS.json")
  );
  const writtenAttestationApplyExecutionPackets = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-APPLY-EXECUTION-PACKETS.json")
  );
  const writtenAttestationOperatorWorklists = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-WORKLISTS.json")
  );
  const writtenAttestationOperatorDispatchManifests = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json")
  );
  const writtenAttestationOperatorDispatchPackets = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-DISPATCH-PACKETS.json")
  );
  const writtenAttestationOperatorDispatchReceipts = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json")
  );
  const writtenAttestationOperatorReconciliationLedgers = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json")
  );
  const writtenAttestationOperatorSettlementPacks = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json")
  );
  const writtenAttestationOperatorApprovalRoutingContracts = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json")
  );
  const writtenAttestationOperatorApprovalOrchestration = readJson(
    path.join(destinationRoot, "release", "ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json")
  );
  const writtenReviewOnlyDeliveryChain = readJson(
    path.join(destinationRoot, "release", "REVIEW-ONLY-DELIVERY-CHAIN.json")
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
  const writtenPromotionApplyReadiness = readJson(
    path.join(destinationRoot, "release", "PROMOTION-APPLY-READINESS.json")
  );
  const writtenPromotionApplyManifests = readJson(
    path.join(destinationRoot, "release", "PROMOTION-APPLY-MANIFESTS.json")
  );
  const writtenPromotionExecutionCheckpoints = readJson(
    path.join(destinationRoot, "release", "PROMOTION-EXECUTION-CHECKPOINTS.json")
  );
  const writtenPromotionOperatorHandoffRails = readJson(
    path.join(destinationRoot, "release", "PROMOTION-OPERATOR-HANDOFF-RAILS.json")
  );
  const writtenPromotionStagedApplyLedgers = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-LEDGERS.json")
  );
  const writtenPromotionStagedApplyRunsheets = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-RUNSHEETS.json")
  );
  const writtenPromotionStagedApplyCommandSheets = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json")
  );
  const writtenPromotionStagedApplyConfirmationLedgers = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json")
  );
  const writtenPromotionStagedApplyCloseoutJournals = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json")
  );
  const writtenPromotionStagedApplySignoffSheets = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json")
  );
  const writtenPromotionStagedApplyReleaseDecisionEnforcementContracts = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json")
  );
  const writtenPromotionStagedApplyReleaseDecisionEnforcementLifecycle = readJson(
    path.join(destinationRoot, "release", "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json")
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
  const writtenRollbackRecoveryLedger = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-RECOVERY-LEDGER.json")
  );
  const writtenRollbackExecutionRehearsalLedger = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json")
  );
  const writtenRollbackOperatorDrillbooks = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-OPERATOR-DRILLBOOKS.json")
  );
  const writtenRollbackLiveReadinessContracts = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-LIVE-READINESS-CONTRACTS.json")
  );
  const writtenRollbackCutoverReadinessMaps = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-READINESS-MAPS.json")
  );
  const writtenRollbackCutoverHandoffPlans = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-HANDOFF-PLANS.json")
  );
  const writtenRollbackCutoverExecutionChecklists = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json")
  );
  const writtenRollbackCutoverExecutionRecords = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-EXECUTION-RECORDS.json")
  );
  const writtenRollbackCutoverOutcomeReports = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-OUTCOME-REPORTS.json")
  );
  const writtenRollbackCutoverPublicationBundles = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json")
  );
  const writtenRollbackCutoverPublicationReceiptCloseoutContracts = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json")
  );
  const writtenRollbackCutoverPublicationReceiptSettlementCloseout = readJson(
    path.join(destinationRoot, "release", "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json")
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
    writtenInstaller.attestationVerificationPacksPath !== "release/ATTESTATION-VERIFICATION-PACKS.json" ||
    writtenInstaller.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    writtenInstaller.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    writtenInstaller.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    writtenInstaller.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    writtenInstaller.attestationOperatorDispatchPacketsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" ||
    writtenInstaller.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    writtenInstaller.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    writtenInstaller.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    writtenInstaller.attestationOperatorApprovalRoutingContractsPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" ||
    writtenInstaller.attestationOperatorApprovalOrchestrationPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" ||
    writtenInstaller.reviewOnlyDeliveryChainPath !== "release/REVIEW-ONLY-DELIVERY-CHAIN.json" ||
    writtenInstaller.installerTargetsPath !== "release/INSTALLER-TARGETS.json" ||
    writtenInstaller.installerBuilderExecutionSkeletonPath !== "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json" ||
    writtenInstaller.installerTargetBuilderSkeletonPath !== "release/INSTALLER-TARGET-BUILDER-SKELETON.json" ||
    writtenInstaller.installerBuilderOrchestrationPath !== "release/INSTALLER-BUILDER-ORCHESTRATION.json" ||
    writtenInstaller.installerChannelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    writtenInstaller.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenInstaller.promotionApplyManifestsPath !== "release/PROMOTION-APPLY-MANIFESTS.json" ||
    writtenInstaller.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    writtenInstaller.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    writtenInstaller.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    writtenInstaller.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    writtenInstaller.promotionStagedApplyCommandSheetsPath !== "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" ||
    writtenInstaller.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    writtenInstaller.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    writtenInstaller.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    writtenInstaller.promotionStagedApplyReleaseDecisionEnforcementContractsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" ||
    writtenInstaller.promotionStagedApplyReleaseDecisionEnforcementLifecyclePath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" ||
    writtenInstaller.signingPublishGatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    writtenInstaller.signingPublishPipelinePath !== "release/SIGNING-PUBLISH-PIPELINE.json" ||
    writtenInstaller.signingPublishApprovalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    writtenInstaller.signingPublishPromotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    writtenInstaller.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    writtenInstaller.rollbackExecutionRehearsalLedgerPath !== "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" ||
    writtenInstaller.rollbackOperatorDrillbooksPath !== "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" ||
    writtenInstaller.rollbackLiveReadinessContractsPath !== "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" ||
    writtenInstaller.rollbackCutoverReadinessMapsPath !== "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" ||
    writtenInstaller.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    writtenInstaller.rollbackCutoverExecutionChecklistsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" ||
    writtenInstaller.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    writtenInstaller.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    writtenInstaller.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    writtenInstaller.rollbackCutoverPublicationReceiptCloseoutContractsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" ||
    writtenInstaller.rollbackCutoverPublicationReceiptSettlementCloseoutPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" ||
    writtenInstaller.approvalWorkflowPath !== "release/RELEASE-APPROVAL-WORKFLOW.json"
  ) {
    throw new Error(`Installer placeholder is missing the expected ${PHASE_ID} dispatch / runsheet / handoff / handshake / approval paths.`);
  }

  if (
    writtenReviewOnlyDeliveryChain.phase !== PHASE_ID ||
    writtenReviewOnlyDeliveryChain.activeStageId !== "delivery-chain-operator-review" ||
    writtenReviewOnlyDeliveryChain.operatorReviewBoardPath !== "release/OPERATOR-REVIEW-BOARD.json" ||
    writtenReviewOnlyDeliveryChain.releaseDecisionHandoffPath !== "release/RELEASE-DECISION-HANDOFF.json" ||
    writtenReviewOnlyDeliveryChain.reviewEvidenceCloseoutPath !== "release/REVIEW-EVIDENCE-CLOSEOUT.json" ||
    !Array.isArray(writtenReviewOnlyDeliveryChain.stages) ||
    writtenReviewOnlyDeliveryChain.stages.length < 5 ||
    !Array.isArray(writtenReviewOnlyDeliveryChain.paths?.promotionStageIds) ||
    !Array.isArray(writtenReviewOnlyDeliveryChain.paths?.publishStageIds) ||
    !Array.isArray(writtenReviewOnlyDeliveryChain.paths?.rollbackStageIds) ||
    !Array.isArray(writtenReviewOnlyDeliveryChain.blockedBy) ||
    writtenReviewOnlyDeliveryChain.blockedBy.length < 3
  ) {
    throw new Error(`Review-only delivery chain does not reflect the expected ${PHASE_ID} staged workflow metadata.`);
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
    writtenIntegrityAttestationEvidence.phase !== PHASE_ID ||
    writtenIntegrityAttestationEvidence.mode !== "local-only-review" ||
    !Array.isArray(writtenIntegrityAttestationEvidence.attestations) ||
    writtenIntegrityAttestationEvidence.attestations.length < 3
  ) {
    throw new Error(`Integrity attestation evidence does not reflect the expected ${PHASE_ID} attestation metadata.`);
  }

  if (
    writtenAttestationVerificationPacks.phase !== PHASE_ID ||
    writtenAttestationVerificationPacks.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationVerificationPacks.packs) ||
    writtenAttestationVerificationPacks.packs.length < 3
  ) {
    throw new Error(`Attestation verification packs do not reflect the expected ${PHASE_ID} verification metadata.`);
  }

  if (
    writtenAttestationApplyAuditPacks.phase !== PHASE_ID ||
    writtenAttestationApplyAuditPacks.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationApplyAuditPacks.packs) ||
    writtenAttestationApplyAuditPacks.packs.length < 2
  ) {
    throw new Error(`Attestation apply audit packs do not reflect the expected ${PHASE_ID} audit metadata.`);
  }

  if (
    writtenAttestationApplyExecutionPackets.phase !== PHASE_ID ||
    writtenAttestationApplyExecutionPackets.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationApplyExecutionPackets.packets) ||
    writtenAttestationApplyExecutionPackets.packets.length < 2
  ) {
    throw new Error(`Attestation apply execution packets do not reflect the expected ${PHASE_ID} execution metadata.`);
  }

  if (
    writtenAttestationOperatorWorklists.phase !== PHASE_ID ||
    writtenAttestationOperatorWorklists.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorWorklists.worklists) ||
    writtenAttestationOperatorWorklists.worklists.length < 2
  ) {
    throw new Error(`Attestation operator worklists do not reflect the expected ${PHASE_ID} execution-adjacent metadata.`);
  }

  if (
    writtenAttestationOperatorDispatchManifests.phase !== PHASE_ID ||
    writtenAttestationOperatorDispatchManifests.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorDispatchManifests.manifests) ||
    writtenAttestationOperatorDispatchManifests.manifests.length < 2
  ) {
    throw new Error(`Attestation operator dispatch manifests do not reflect the expected ${PHASE_ID} dispatch metadata.`);
  }

  if (
    writtenAttestationOperatorDispatchPackets.phase !== PHASE_ID ||
    writtenAttestationOperatorDispatchPackets.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorDispatchPackets.packets) ||
    writtenAttestationOperatorDispatchPackets.packets.length < 2
  ) {
    throw new Error(`Attestation operator dispatch packets do not reflect the expected ${PHASE_ID} packet metadata.`);
  }

  if (
    writtenAttestationOperatorDispatchReceipts.phase !== PHASE_ID ||
    writtenAttestationOperatorDispatchReceipts.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorDispatchReceipts.receipts) ||
    writtenAttestationOperatorDispatchReceipts.receipts.length < 2
  ) {
    throw new Error(`Attestation operator dispatch receipts do not reflect the expected ${PHASE_ID} receipt metadata.`);
  }

  if (
    writtenAttestationOperatorReconciliationLedgers.phase !== PHASE_ID ||
    writtenAttestationOperatorReconciliationLedgers.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorReconciliationLedgers.ledgers) ||
    writtenAttestationOperatorReconciliationLedgers.ledgers.length < 2
  ) {
    throw new Error(`Attestation operator reconciliation ledgers do not reflect the expected ${PHASE_ID} reconciliation metadata.`);
  }

  if (
    writtenAttestationOperatorSettlementPacks.phase !== PHASE_ID ||
    writtenAttestationOperatorSettlementPacks.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorSettlementPacks.packs) ||
    writtenAttestationOperatorSettlementPacks.packs.length < 2
  ) {
    throw new Error(`Attestation operator settlement packs do not reflect the expected ${PHASE_ID} settlement-pack metadata.`);
  }

  if (
    writtenAttestationOperatorApprovalRoutingContracts.phase !== PHASE_ID ||
    writtenAttestationOperatorApprovalRoutingContracts.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorApprovalRoutingContracts.contracts) ||
    writtenAttestationOperatorApprovalRoutingContracts.contracts.length < 2
  ) {
    throw new Error(
      `Attestation operator approval routing contracts do not reflect the expected ${PHASE_ID} routing-contract metadata.`
    );
  }

  if (
    writtenAttestationOperatorApprovalOrchestration.phase !== PHASE_ID ||
    writtenAttestationOperatorApprovalOrchestration.mode !== "local-only-review" ||
    !Array.isArray(writtenAttestationOperatorApprovalOrchestration.orchestrations) ||
    writtenAttestationOperatorApprovalOrchestration.orchestrations.length < 2
  ) {
    throw new Error(
      `Attestation operator approval orchestration does not reflect the expected ${PHASE_ID} orchestration metadata.`
    );
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

  if (
    writtenPromotionApplyReadiness.phase !== PHASE_ID ||
    writtenPromotionApplyReadiness.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionApplyReadiness.readiness) ||
    writtenPromotionApplyReadiness.readiness.length < 2
  ) {
    throw new Error(`Promotion apply readiness does not reflect the expected ${PHASE_ID} readiness metadata.`);
  }

  if (
    writtenPromotionApplyManifests.phase !== PHASE_ID ||
    writtenPromotionApplyManifests.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionApplyManifests.manifests) ||
    writtenPromotionApplyManifests.manifests.length < 2
  ) {
    throw new Error(`Promotion apply manifests do not reflect the expected ${PHASE_ID} apply-manifest metadata.`);
  }

  if (
    writtenPromotionExecutionCheckpoints.phase !== PHASE_ID ||
    writtenPromotionExecutionCheckpoints.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionExecutionCheckpoints.checkpoints) ||
    writtenPromotionExecutionCheckpoints.checkpoints.length < 2
  ) {
    throw new Error(`Promotion execution checkpoints do not reflect the expected ${PHASE_ID} checkpoint metadata.`);
  }

  if (
    writtenPromotionOperatorHandoffRails.phase !== PHASE_ID ||
    writtenPromotionOperatorHandoffRails.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionOperatorHandoffRails.rails) ||
    writtenPromotionOperatorHandoffRails.rails.length < 2
  ) {
    throw new Error(`Promotion operator handoff rails do not reflect the expected ${PHASE_ID} handoff metadata.`);
  }

  if (
    writtenPromotionStagedApplyLedgers.phase !== PHASE_ID ||
    writtenPromotionStagedApplyLedgers.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyLedgers.ledgers) ||
    writtenPromotionStagedApplyLedgers.ledgers.length < 2
  ) {
    throw new Error(`Promotion staged-apply ledgers do not reflect the expected ${PHASE_ID} staged-apply metadata.`);
  }

  if (
    writtenPromotionStagedApplyRunsheets.phase !== PHASE_ID ||
    writtenPromotionStagedApplyRunsheets.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyRunsheets.runsheets) ||
    writtenPromotionStagedApplyRunsheets.runsheets.length < 2
  ) {
    throw new Error(`Promotion staged-apply runsheets do not reflect the expected ${PHASE_ID} runsheet metadata.`);
  }

  if (
    writtenPromotionStagedApplyCommandSheets.phase !== PHASE_ID ||
    writtenPromotionStagedApplyCommandSheets.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyCommandSheets.commandSheets) ||
    writtenPromotionStagedApplyCommandSheets.commandSheets.length < 2
  ) {
    throw new Error(`Promotion staged-apply command sheets do not reflect the expected ${PHASE_ID} command-sheet metadata.`);
  }

  if (
    writtenPromotionStagedApplyConfirmationLedgers.phase !== PHASE_ID ||
    writtenPromotionStagedApplyConfirmationLedgers.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyConfirmationLedgers.ledgers) ||
    writtenPromotionStagedApplyConfirmationLedgers.ledgers.length < 2
  ) {
    throw new Error(`Promotion staged-apply confirmation ledgers do not reflect the expected ${PHASE_ID} confirmation-ledger metadata.`);
  }

  if (
    writtenPromotionStagedApplyCloseoutJournals.phase !== PHASE_ID ||
    writtenPromotionStagedApplyCloseoutJournals.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyCloseoutJournals.journals) ||
    writtenPromotionStagedApplyCloseoutJournals.journals.length < 2
  ) {
    throw new Error(`Promotion staged-apply closeout journals do not reflect the expected ${PHASE_ID} closeout-journal metadata.`);
  }

  if (
    writtenPromotionStagedApplySignoffSheets.phase !== PHASE_ID ||
    writtenPromotionStagedApplySignoffSheets.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplySignoffSheets.signoffSheets) ||
    writtenPromotionStagedApplySignoffSheets.signoffSheets.length < 2
  ) {
    throw new Error(`Promotion staged-apply signoff sheets do not reflect the expected ${PHASE_ID} signoff-sheet metadata.`);
  }

  if (
    writtenPromotionStagedApplyReleaseDecisionEnforcementContracts.phase !== PHASE_ID ||
    writtenPromotionStagedApplyReleaseDecisionEnforcementContracts.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyReleaseDecisionEnforcementContracts.contracts) ||
    writtenPromotionStagedApplyReleaseDecisionEnforcementContracts.contracts.length < 2
  ) {
    throw new Error(
      `Promotion staged-apply release decision enforcement contracts do not reflect the expected ${PHASE_ID} enforcement-contract metadata.`
    );
  }

  if (
    writtenPromotionStagedApplyReleaseDecisionEnforcementLifecycle.phase !== PHASE_ID ||
    writtenPromotionStagedApplyReleaseDecisionEnforcementLifecycle.mode !== "local-only-review" ||
    !Array.isArray(writtenPromotionStagedApplyReleaseDecisionEnforcementLifecycle.lifecycles) ||
    writtenPromotionStagedApplyReleaseDecisionEnforcementLifecycle.lifecycles.length < 2
  ) {
    throw new Error(
      `Promotion staged-apply release decision enforcement lifecycle does not reflect the expected ${PHASE_ID} lifecycle metadata.`
    );
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
    writtenSigningPublishGatingHandshake.attestationVerificationPacksPath !== "release/ATTESTATION-VERIFICATION-PACKS.json" ||
    writtenSigningPublishGatingHandshake.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    writtenSigningPublishGatingHandshake.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorDispatchPacketsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorApprovalRoutingContractsPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" ||
    writtenSigningPublishGatingHandshake.attestationOperatorApprovalOrchestrationPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" ||
    writtenSigningPublishGatingHandshake.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplyCommandSheetsPath !== "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplyReleaseDecisionEnforcementContractsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" ||
    writtenSigningPublishGatingHandshake.promotionStagedApplyReleaseDecisionEnforcementLifecyclePath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" ||
    writtenSigningPublishGatingHandshake.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverExecutionChecklistsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverPublicationReceiptCloseoutContractsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" ||
    writtenSigningPublishGatingHandshake.rollbackCutoverPublicationReceiptSettlementCloseoutPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" ||
    !Array.isArray(writtenSigningPublishGatingHandshake.stages) ||
    writtenSigningPublishGatingHandshake.stages.length < 15 ||
    !Array.isArray(writtenSigningPublishGatingHandshake.acknowledgements) ||
    writtenSigningPublishGatingHandshake.acknowledgements.length < 14
  ) {
    throw new Error(`Signing-publish gating handshake does not reflect the expected ${PHASE_ID} handshake metadata.`);
  }

  if (
    writtenSigningPublishPipeline.phase !== PHASE_ID ||
    writtenSigningPublishPipeline.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenSigningPublishPipeline.attestationVerificationPacksPath !== "release/ATTESTATION-VERIFICATION-PACKS.json" ||
    writtenSigningPublishPipeline.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    writtenSigningPublishPipeline.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    writtenSigningPublishPipeline.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    writtenSigningPublishPipeline.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    writtenSigningPublishPipeline.attestationOperatorDispatchPacketsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" ||
    writtenSigningPublishPipeline.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    writtenSigningPublishPipeline.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    writtenSigningPublishPipeline.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    writtenSigningPublishPipeline.attestationOperatorApprovalRoutingContractsPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" ||
    writtenSigningPublishPipeline.attestationOperatorApprovalOrchestrationPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" ||
    writtenSigningPublishPipeline.gatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    writtenSigningPublishPipeline.approvalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    writtenSigningPublishPipeline.channelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    writtenSigningPublishPipeline.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenSigningPublishPipeline.promotionApplyManifestsPath !== "release/PROMOTION-APPLY-MANIFESTS.json" ||
    writtenSigningPublishPipeline.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    writtenSigningPublishPipeline.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyCommandSheetsPath !== "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyReleaseDecisionEnforcementContractsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" ||
    writtenSigningPublishPipeline.promotionStagedApplyReleaseDecisionEnforcementLifecyclePath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" ||
    writtenSigningPublishPipeline.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    writtenSigningPublishPipeline.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    writtenSigningPublishPipeline.rollbackExecutionRehearsalLedgerPath !== "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" ||
    writtenSigningPublishPipeline.rollbackOperatorDrillbooksPath !== "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" ||
    writtenSigningPublishPipeline.rollbackLiveReadinessContractsPath !== "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverReadinessMapsPath !== "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverExecutionChecklistsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    writtenSigningPublishPipeline.rollbackCutoverPublicationReceiptCloseoutContractsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" ||
    writtenSigningPublishPipeline.rollbackCutoverPublicationReceiptSettlementCloseoutPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" ||
    !Array.isArray(writtenSigningPublishPipeline.stages) ||
    writtenSigningPublishPipeline.stages.length < 27
  ) {
    throw new Error(`Signing & publish pipeline does not reflect the expected ${PHASE_ID} pipeline metadata.`);
  }

  if (
    writtenSigningPublishApprovalBridge.phase !== PHASE_ID ||
    !Array.isArray(writtenSigningPublishApprovalBridge.bridge) ||
    writtenSigningPublishApprovalBridge.bridge.length < 9
  ) {
    throw new Error(`Signing-publish approval bridge does not reflect the expected ${PHASE_ID} bridge metadata.`);
  }

  if (
    writtenSigningPublishPromotionHandshake.phase !== PHASE_ID ||
    writtenSigningPublishPromotionHandshake.canPromote !== false ||
    writtenSigningPublishPromotionHandshake.channelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    writtenSigningPublishPromotionHandshake.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenSigningPublishPromotionHandshake.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenSigningPublishPromotionHandshake.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    writtenSigningPublishPromotionHandshake.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorDispatchPacketsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorApprovalRoutingContractsPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" ||
    writtenSigningPublishPromotionHandshake.attestationOperatorApprovalOrchestrationPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" ||
    writtenSigningPublishPromotionHandshake.promotionApplyManifestsPath !== "release/PROMOTION-APPLY-MANIFESTS.json" ||
    writtenSigningPublishPromotionHandshake.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    writtenSigningPublishPromotionHandshake.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyCommandSheetsPath !== "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyReleaseDecisionEnforcementContractsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" ||
    writtenSigningPublishPromotionHandshake.promotionStagedApplyReleaseDecisionEnforcementLifecyclePath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" ||
    writtenSigningPublishPromotionHandshake.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverExecutionChecklistsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverPublicationReceiptCloseoutContractsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" ||
    writtenSigningPublishPromotionHandshake.rollbackCutoverPublicationReceiptSettlementCloseoutPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" ||
    !Array.isArray(writtenSigningPublishPromotionHandshake.stages) ||
    writtenSigningPublishPromotionHandshake.stages.length < 14 ||
    !Array.isArray(writtenSigningPublishPromotionHandshake.acknowledgements) ||
    writtenSigningPublishPromotionHandshake.acknowledgements.length < 14
  ) {
    throw new Error(`Signing-publish promotion handshake does not reflect the expected ${PHASE_ID} promotion metadata.`);
  }

  if (
    writtenPublishRollbackHandshake.phase !== PHASE_ID ||
    writtenPublishRollbackHandshake.canRollback !== false ||
    writtenPublishRollbackHandshake.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    writtenPublishRollbackHandshake.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    writtenPublishRollbackHandshake.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    writtenPublishRollbackHandshake.attestationOperatorDispatchPacketsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" ||
    writtenPublishRollbackHandshake.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    writtenPublishRollbackHandshake.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    writtenPublishRollbackHandshake.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    writtenPublishRollbackHandshake.attestationOperatorApprovalRoutingContractsPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json" ||
    writtenPublishRollbackHandshake.attestationOperatorApprovalOrchestrationPath !== "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" ||
    writtenPublishRollbackHandshake.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    writtenPublishRollbackHandshake.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    writtenPublishRollbackHandshake.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyCommandSheetsPath !== "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyReleaseDecisionEnforcementContractsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json" ||
    writtenPublishRollbackHandshake.promotionStagedApplyReleaseDecisionEnforcementLifecyclePath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" ||
    writtenPublishRollbackHandshake.rollbackExecutionRehearsalLedgerPath !== "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" ||
    writtenPublishRollbackHandshake.rollbackOperatorDrillbooksPath !== "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" ||
    writtenPublishRollbackHandshake.rollbackLiveReadinessContractsPath !== "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverReadinessMapsPath !== "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverExecutionChecklistsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverPublicationReceiptCloseoutContractsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json" ||
    writtenPublishRollbackHandshake.rollbackCutoverPublicationReceiptSettlementCloseoutPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" ||
    !Array.isArray(writtenPublishRollbackHandshake.paths) ||
    writtenPublishRollbackHandshake.paths.length < 2 ||
    !Array.isArray(writtenPublishRollbackHandshake.stages) ||
    writtenPublishRollbackHandshake.stages.length < 12 ||
    !Array.isArray(writtenPublishRollbackHandshake.acknowledgements) ||
    writtenPublishRollbackHandshake.acknowledgements.length < 12
  ) {
    throw new Error(`Publish rollback handshake does not reflect the expected ${PHASE_ID} rollback metadata.`);
  }

  if (
    writtenRollbackRecoveryLedger.phase !== PHASE_ID ||
    writtenRollbackRecoveryLedger.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackRecoveryLedger.ledgers) ||
    writtenRollbackRecoveryLedger.ledgers.length < 2
  ) {
    throw new Error(`Rollback recovery ledger does not reflect the expected ${PHASE_ID} recovery metadata.`);
  }

  if (
    writtenRollbackExecutionRehearsalLedger.phase !== PHASE_ID ||
    writtenRollbackExecutionRehearsalLedger.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackExecutionRehearsalLedger.rehearsals) ||
    writtenRollbackExecutionRehearsalLedger.rehearsals.length < 2
  ) {
    throw new Error(`Rollback execution rehearsal ledger does not reflect the expected ${PHASE_ID} rehearsal metadata.`);
  }

  if (
    writtenRollbackOperatorDrillbooks.phase !== PHASE_ID ||
    writtenRollbackOperatorDrillbooks.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackOperatorDrillbooks.drillbooks) ||
    writtenRollbackOperatorDrillbooks.drillbooks.length < 2
  ) {
    throw new Error(`Rollback operator drillbooks do not reflect the expected ${PHASE_ID} operator metadata.`);
  }

  if (
    writtenRollbackLiveReadinessContracts.phase !== PHASE_ID ||
    writtenRollbackLiveReadinessContracts.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackLiveReadinessContracts.contracts) ||
    writtenRollbackLiveReadinessContracts.contracts.length < 2
  ) {
    throw new Error(`Rollback live-readiness contracts do not reflect the expected ${PHASE_ID} readiness metadata.`);
  }

  if (
    writtenRollbackCutoverReadinessMaps.phase !== PHASE_ID ||
    writtenRollbackCutoverReadinessMaps.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverReadinessMaps.maps) ||
    writtenRollbackCutoverReadinessMaps.maps.length < 2
  ) {
    throw new Error(`Rollback cutover readiness maps do not reflect the expected ${PHASE_ID} cutover metadata.`);
  }

  if (
    writtenRollbackCutoverHandoffPlans.phase !== PHASE_ID ||
    writtenRollbackCutoverHandoffPlans.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverHandoffPlans.plans) ||
    writtenRollbackCutoverHandoffPlans.plans.length < 2
  ) {
    throw new Error(`Rollback cutover handoff plans do not reflect the expected ${PHASE_ID} handoff metadata.`);
  }

  if (
    writtenRollbackCutoverExecutionChecklists.phase !== PHASE_ID ||
    writtenRollbackCutoverExecutionChecklists.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverExecutionChecklists.checklists) ||
    writtenRollbackCutoverExecutionChecklists.checklists.length < 2
  ) {
    throw new Error(`Rollback cutover execution checklists do not reflect the expected ${PHASE_ID} execution-checklist metadata.`);
  }

  if (
    writtenRollbackCutoverExecutionRecords.phase !== PHASE_ID ||
    writtenRollbackCutoverExecutionRecords.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverExecutionRecords.records) ||
    writtenRollbackCutoverExecutionRecords.records.length < 2
  ) {
    throw new Error(`Rollback cutover execution records do not reflect the expected ${PHASE_ID} execution-record metadata.`);
  }

  if (
    writtenRollbackCutoverOutcomeReports.phase !== PHASE_ID ||
    writtenRollbackCutoverOutcomeReports.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverOutcomeReports.reports) ||
    writtenRollbackCutoverOutcomeReports.reports.length < 2
  ) {
    throw new Error(`Rollback cutover outcome reports do not reflect the expected ${PHASE_ID} outcome-report metadata.`);
  }

  if (
    writtenRollbackCutoverPublicationBundles.phase !== PHASE_ID ||
    writtenRollbackCutoverPublicationBundles.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverPublicationBundles.bundles) ||
    writtenRollbackCutoverPublicationBundles.bundles.length < 2
  ) {
    throw new Error(`Rollback cutover publication bundles do not reflect the expected ${PHASE_ID} publication-bundle metadata.`);
  }

  if (
    writtenRollbackCutoverPublicationReceiptCloseoutContracts.phase !== PHASE_ID ||
    writtenRollbackCutoverPublicationReceiptCloseoutContracts.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverPublicationReceiptCloseoutContracts.contracts) ||
    writtenRollbackCutoverPublicationReceiptCloseoutContracts.contracts.length < 2
  ) {
    throw new Error(
      `Rollback cutover publication receipt closeout contracts do not reflect the expected ${PHASE_ID} closeout-contract metadata.`
    );
  }

  if (
    writtenRollbackCutoverPublicationReceiptSettlementCloseout.phase !== PHASE_ID ||
    writtenRollbackCutoverPublicationReceiptSettlementCloseout.mode !== "local-only-review" ||
    !Array.isArray(writtenRollbackCutoverPublicationReceiptSettlementCloseout.closeouts) ||
    writtenRollbackCutoverPublicationReceiptSettlementCloseout.closeouts.length < 2
  ) {
    throw new Error(
      `Rollback cutover publication receipt settlement closeout does not reflect the expected ${PHASE_ID} settlement-closeout metadata.`
    );
  }

  if (
    writtenReleaseApprovalWorkflow.phase !== PHASE_ID ||
    writtenReleaseApprovalWorkflow.mode !== "local-only-review" ||
    writtenReleaseApprovalWorkflow.gatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    writtenReleaseApprovalWorkflow.approvalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    writtenReleaseApprovalWorkflow.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    writtenReleaseApprovalWorkflow.reviewOnlyDeliveryChainPath !== "release/REVIEW-ONLY-DELIVERY-CHAIN.json" ||
    !Array.isArray(writtenReleaseApprovalWorkflow.stages) ||
    writtenReleaseApprovalWorkflow.stages.length < 8
  ) {
    throw new Error(`Release approval workflow does not reflect the expected ${PHASE_ID} approval metadata.`);
  }

  if (writtenPublishGates.phase !== PHASE_ID || !Array.isArray(writtenPublishGates.gates) || writtenPublishGates.gates.length < 21) {
    throw new Error(`Publish gates do not reflect the expected ${PHASE_ID} release gating skeleton.`);
  }

  if (writtenPromotionGates.phase !== PHASE_ID || !Array.isArray(writtenPromotionGates.promotions) || writtenPromotionGates.promotions.length < 2) {
    throw new Error(`Promotion gates do not reflect the expected ${PHASE_ID} promotion-gating skeleton.`);
  }

  if (!writtenReleaseSummary.includes(`${PHASE_TITLE} Release Summary`) && !writtenReleaseSummary.includes(PHASE_TITLE)) {
    throw new Error(`Release summary does not reflect the expected ${PHASE_ID} review summary.`);
  }

  if (!writtenReleaseNotes.includes(`${PHASE_TITLE} Release Notes`) && !writtenReleaseNotes.includes(PHASE_TITLE)) {
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
    `Attestation verification packs: ${skeleton.attestationVerificationPacks.packs.length}`,
    `Attestation apply audit packs: ${skeleton.attestationApplyAuditPacks.packs.length}`,
    `Attestation apply execution packets: ${skeleton.attestationApplyExecutionPackets.packets.length}`,
    `Attestation operator worklists: ${skeleton.attestationOperatorWorklists.worklists.length}`,
    `Attestation operator dispatch manifests: ${skeleton.attestationOperatorDispatchManifests.manifests.length}`,
    `Attestation operator dispatch packets: ${skeleton.attestationOperatorDispatchPackets.packets.length}`,
    `Attestation operator dispatch receipts: ${skeleton.attestationOperatorDispatchReceipts.receipts.length}`,
    `Attestation operator reconciliation ledgers: ${skeleton.attestationOperatorReconciliationLedgers.ledgers.length}`,
    `Attestation operator settlement packs: ${skeleton.attestationOperatorSettlementPacks.packs.length}`,
    `Attestation operator approval routing contracts: ${skeleton.attestationOperatorApprovalRoutingContracts.contracts.length}`,
    `Attestation operator approval orchestration: ${skeleton.attestationOperatorApprovalOrchestration.orchestrations.length}`,
    `Delivery-chain workspace stages: ${skeleton.reviewOnlyDeliveryChain.stages.length} (${skeleton.reviewOnlyDeliveryChain.mode})`,
    `Installer targets: ${skeleton.installerTargets.targets.length}`,
    `Installer execution skeletons: ${skeleton.installerBuilderExecutionSkeleton.executions.length}`,
    `Installer builders: ${skeleton.installerTargetBuilderSkeleton.builders.length}`,
    `Installer orchestration flows: ${skeleton.installerBuilderOrchestration.flows.length}`,
    `Installer channel routes: ${skeleton.installerChannelRouting.routes.length}`,
    `Channel promotion evidence entries: ${skeleton.channelPromotionEvidence.promotions.length}`,
    `Promotion apply readiness entries: ${skeleton.promotionApplyReadiness.readiness.length}`,
    `Promotion apply manifests: ${skeleton.promotionApplyManifests.manifests.length}`,
    `Promotion execution checkpoints: ${skeleton.promotionExecutionCheckpoints.checkpoints.length}`,
    `Promotion operator handoff rails: ${skeleton.promotionOperatorHandoffRails.rails.length}`,
    `Promotion staged-apply ledgers: ${skeleton.promotionStagedApplyLedgers.ledgers.length}`,
    `Promotion staged-apply runsheets: ${skeleton.promotionStagedApplyRunsheets.runsheets.length}`,
    `Promotion staged-apply command sheets: ${skeleton.promotionStagedApplyCommandSheets.commandSheets.length}`,
    `Promotion staged-apply confirmation ledgers: ${skeleton.promotionStagedApplyConfirmationLedgers.ledgers.length}`,
    `Promotion staged-apply closeout journals: ${skeleton.promotionStagedApplyCloseoutJournals.journals.length}`,
    `Promotion staged-apply signoff sheets: ${skeleton.promotionStagedApplySignoffSheets.signoffSheets.length}`,
    `Promotion staged-apply release decision enforcement contracts: ${skeleton.promotionStagedApplyReleaseDecisionEnforcementContracts.contracts.length}`,
    `Promotion staged-apply release decision enforcement lifecycle: ${skeleton.promotionStagedApplyReleaseDecisionEnforcementLifecycle.lifecycles.length}`,
    `Signing/publish handshake stages: ${skeleton.signingPublishGatingHandshake.stages.length}`,
    `Signing/publish pipeline stages: ${skeleton.signingPublishPipeline.stages.length}`,
    `Signing/publish approval bridge entries: ${skeleton.signingPublishApprovalBridge.bridge.length}`,
    `Signing/publish promotion handshake stages: ${skeleton.signingPublishPromotionHandshake.stages.length}`,
    `Publish rollback handshake paths: ${skeleton.publishRollbackHandshake.paths.length}`,
    `Rollback recovery ledger entries: ${skeleton.rollbackRecoveryLedger.ledgers.length}`,
    `Rollback execution rehearsals: ${skeleton.rollbackExecutionRehearsalLedger.rehearsals.length}`,
    `Rollback operator drillbooks: ${skeleton.rollbackOperatorDrillbooks.drillbooks.length}`,
    `Rollback live-readiness contracts: ${skeleton.rollbackLiveReadinessContracts.contracts.length}`,
    `Rollback cutover readiness maps: ${skeleton.rollbackCutoverReadinessMaps.maps.length}`,
    `Rollback cutover handoff plans: ${skeleton.rollbackCutoverHandoffPlans.plans.length}`,
    `Rollback cutover execution checklists: ${skeleton.rollbackCutoverExecutionChecklists.checklists.length}`,
    `Rollback cutover execution records: ${skeleton.rollbackCutoverExecutionRecords.records.length}`,
    `Rollback cutover outcome reports: ${skeleton.rollbackCutoverOutcomeReports.reports.length}`,
    `Rollback cutover publication bundles: ${skeleton.rollbackCutoverPublicationBundles.bundles.length}`,
    `Rollback cutover publication receipt closeout contracts: ${skeleton.rollbackCutoverPublicationReceiptCloseoutContracts.contracts.length}`,
    `Rollback cutover publication receipt settlement closeout: ${skeleton.rollbackCutoverPublicationReceiptSettlementCloseout.closeouts.length}`,
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
  PHASE_TITLE,
  PHASE_MILESTONE,
  RELEASE_CHANNEL,
  REVIEW_STAGE_ID,
  REQUIRED_RELEASE_COMMANDS,
  createReleaseSkeleton,
  formatReleasePlanSummary,
  verifyReleaseSkeletonOutput,
  writeReleaseSkeleton
};
