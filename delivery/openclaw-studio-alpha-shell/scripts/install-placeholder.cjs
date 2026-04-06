#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const deliveryRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(deliveryRoot, "release", "INSTALLER-PLACEHOLDER.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

console.log("OpenClaw Studio installer placeholder");
console.log(`status: ${manifest.status}`);
console.log(`current delivery: ${manifest.currentDelivery}`);
console.log(`can install: ${manifest.canInstall ? "yes" : "no"}`);
console.log(`package root: ${path.basename(deliveryRoot)}`);
console.log(`packaged app directory metadata: ${manifest.packagedAppDirectorySkeletonPath}`);
console.log(`packaged app directory materialization metadata: ${manifest.packagedAppDirectoryMaterializationPath}`);
console.log(`packaged app materialization metadata: ${manifest.packagedAppMaterializationSkeletonPath}`);
console.log(`packaged app staged output metadata: ${manifest.packagedAppStagedOutputSkeletonPath}`);
console.log(`packaged app bundle sealing metadata: ${manifest.packagedAppBundleSealingSkeletonPath}`);
console.log(`sealed-bundle integrity metadata: ${manifest.sealedBundleIntegrityContractPath}`);
console.log(`attestation verification packs metadata: ${manifest.attestationVerificationPacksPath}`);
console.log(`attestation apply audit packs metadata: ${manifest.attestationApplyAuditPacksPath}`);
console.log(`attestation apply execution packets metadata: ${manifest.attestationApplyExecutionPacketsPath}`);
console.log(`attestation operator worklists metadata: ${manifest.attestationOperatorWorklistsPath}`);
console.log(`attestation operator dispatch manifests metadata: ${manifest.attestationOperatorDispatchManifestsPath}`);
console.log(`attestation operator dispatch packets metadata: ${manifest.attestationOperatorDispatchPacketsPath}`);
console.log(`attestation operator dispatch receipts metadata: ${manifest.attestationOperatorDispatchReceiptsPath}`);
console.log(`attestation operator reconciliation ledgers metadata: ${manifest.attestationOperatorReconciliationLedgersPath}`);
console.log(`attestation operator settlement packs metadata: ${manifest.attestationOperatorSettlementPacksPath}`);
console.log(`attestation operator approval routing contracts metadata: ${manifest.attestationOperatorApprovalRoutingContractsPath}`);
console.log(`installer targets metadata: ${manifest.installerTargetsPath}`);
console.log(`installer builder execution metadata: ${manifest.installerBuilderExecutionSkeletonPath}`);
console.log(`installer-target builder metadata: ${manifest.installerTargetBuilderSkeletonPath}`);
console.log(`installer builder orchestration metadata: ${manifest.installerBuilderOrchestrationPath}`);
console.log(`installer channel routing metadata: ${manifest.installerChannelRoutingPath}`);
console.log(`channel promotion evidence metadata: ${manifest.channelPromotionEvidencePath}`);
console.log(`promotion apply manifests metadata: ${manifest.promotionApplyManifestsPath}`);
console.log(`promotion execution checkpoints metadata: ${manifest.promotionExecutionCheckpointsPath}`);
console.log(`promotion operator handoff rails metadata: ${manifest.promotionOperatorHandoffRailsPath}`);
console.log(`promotion staged-apply ledgers metadata: ${manifest.promotionStagedApplyLedgersPath}`);
console.log(`promotion staged-apply runsheets metadata: ${manifest.promotionStagedApplyRunsheetsPath}`);
console.log(`promotion staged-apply command sheets metadata: ${manifest.promotionStagedApplyCommandSheetsPath}`);
console.log(`promotion staged-apply confirmation ledgers metadata: ${manifest.promotionStagedApplyConfirmationLedgersPath}`);
console.log(`promotion staged-apply closeout journals metadata: ${manifest.promotionStagedApplyCloseoutJournalsPath}`);
console.log(`promotion staged-apply signoff sheets metadata: ${manifest.promotionStagedApplySignoffSheetsPath}`);
console.log(`promotion staged-apply release decision enforcement contracts metadata: ${manifest.promotionStagedApplyReleaseDecisionEnforcementContractsPath}`);
console.log(`signing-publish gating handshake metadata: ${manifest.signingPublishGatingHandshakePath}`);
console.log(`signing & publish pipeline metadata: ${manifest.signingPublishPipelinePath}`);
console.log(`signing-publish approval bridge metadata: ${manifest.signingPublishApprovalBridgePath}`);
console.log(`signing-publish promotion handshake metadata: ${manifest.signingPublishPromotionHandshakePath}`);
console.log(`publish rollback handshake metadata: ${manifest.publishRollbackHandshakePath}`);
console.log(`rollback execution rehearsal ledger metadata: ${manifest.rollbackExecutionRehearsalLedgerPath}`);
console.log(`rollback operator drillbooks metadata: ${manifest.rollbackOperatorDrillbooksPath}`);
console.log(`rollback live-readiness contracts metadata: ${manifest.rollbackLiveReadinessContractsPath}`);
console.log(`rollback cutover readiness maps metadata: ${manifest.rollbackCutoverReadinessMapsPath}`);
console.log(`rollback cutover handoff plans metadata: ${manifest.rollbackCutoverHandoffPlansPath}`);
console.log(`rollback cutover execution checklists metadata: ${manifest.rollbackCutoverExecutionChecklistsPath}`);
console.log(`rollback cutover execution records metadata: ${manifest.rollbackCutoverExecutionRecordsPath}`);
console.log(`rollback cutover outcome reports metadata: ${manifest.rollbackCutoverOutcomeReportsPath}`);
console.log(`rollback cutover publication bundles metadata: ${manifest.rollbackCutoverPublicationBundlesPath}`);
console.log(`rollback cutover publication receipt closeout contracts metadata: ${manifest.rollbackCutoverPublicationReceiptCloseoutContractsPath}`);
console.log(`approval workflow metadata: ${manifest.approvalWorkflowPath}`);
console.log("missing capabilities:");
for (const item of manifest.missingCapabilities) {
  console.log(`- ${item}`);
}
console.log("next pipeline steps:");
for (const item of manifest.futurePipeline) {
  console.log(`- ${item}`);
}
console.log("This placeholder does not install anything.");
