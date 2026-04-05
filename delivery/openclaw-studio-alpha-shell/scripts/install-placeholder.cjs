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
console.log(`installer targets metadata: ${manifest.installerTargetsPath}`);
console.log(`installer builder execution metadata: ${manifest.installerBuilderExecutionSkeletonPath}`);
console.log(`installer-target builder metadata: ${manifest.installerTargetBuilderSkeletonPath}`);
console.log(`installer builder orchestration metadata: ${manifest.installerBuilderOrchestrationPath}`);
console.log(`installer channel routing metadata: ${manifest.installerChannelRoutingPath}`);
console.log(`channel promotion evidence metadata: ${manifest.channelPromotionEvidencePath}`);
console.log(`promotion apply manifests metadata: ${manifest.promotionApplyManifestsPath}`);
console.log(`promotion execution checkpoints metadata: ${manifest.promotionExecutionCheckpointsPath}`);
console.log(`signing-publish gating handshake metadata: ${manifest.signingPublishGatingHandshakePath}`);
console.log(`signing & publish pipeline metadata: ${manifest.signingPublishPipelinePath}`);
console.log(`signing-publish approval bridge metadata: ${manifest.signingPublishApprovalBridgePath}`);
console.log(`signing-publish promotion handshake metadata: ${manifest.signingPublishPromotionHandshakePath}`);
console.log(`publish rollback handshake metadata: ${manifest.publishRollbackHandshakePath}`);
console.log(`rollback execution rehearsal ledger metadata: ${manifest.rollbackExecutionRehearsalLedgerPath}`);
console.log(`rollback operator drillbooks metadata: ${manifest.rollbackOperatorDrillbooksPath}`);
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
