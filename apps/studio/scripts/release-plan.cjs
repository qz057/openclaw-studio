const { getPreflightSummary } = require("./studio-preflight.cjs");
const { createReleaseSkeleton, formatReleasePlanSummary } = require("./release-skeleton.cjs");

function main() {
  const summary = getPreflightSummary();

  if (!summary.buildReady) {
    console.error("OpenClaw Studio release plan could not be generated because build artifacts are missing.");
    console.error("Run `npm run build` from the repo root and try again.");
    process.exit(1);
  }

  const skeleton = createReleaseSkeleton(summary);

  console.log("OpenClaw Studio phase42 release plan ready.");
  console.log(formatReleasePlanSummary(skeleton));
  console.log("This is a dry-run phase42 release skeleton summary. No installer was built.");
}

main();
