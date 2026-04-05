const fs = require("node:fs");
const { getPreflightSummary } = require("./studio-preflight.cjs");
const {
  createReleaseSkeleton,
  formatReleasePlanSummary,
  verifyReleaseSkeletonOutput,
  writeReleaseSkeleton
} = require("./release-skeleton.cjs");

function main() {
  const summary = getPreflightSummary();

  if (!summary.buildReady) {
    console.error("OpenClaw Studio package snapshot could not be created because build artifacts are missing.");
    console.error("Run `npm run build` from the repo root and try again.");
    process.exit(1);
  }

  const skeleton = createReleaseSkeleton(summary);

  fs.rmSync(skeleton.paths.deliveryRoot, {
    recursive: true,
    force: true
  });
  fs.mkdirSync(skeleton.paths.deliveryRoot, {
    recursive: true
  });

  writeReleaseSkeleton(skeleton.paths.deliveryRoot, skeleton);
  verifyReleaseSkeletonOutput(skeleton.paths.deliveryRoot, skeleton);

  console.log(`OpenClaw Studio alpha package snapshot created at ${skeleton.paths.deliveryRoot}`);
  console.log(formatReleasePlanSummary(skeleton));
  console.log("This output is intentionally not a standalone installer.");
}

main();
