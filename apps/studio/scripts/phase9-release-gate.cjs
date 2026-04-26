const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function verifyFile(fileInfo, label, failures, warnings) {
  if (!fileInfo?.path) {
    failures.push(`${label}: missing path in report`);
    return null;
  }

  if (!fs.existsSync(fileInfo.path)) {
    failures.push(`${label}: file missing at ${fileInfo.path}`);
    return {
      ...fileInfo,
      actualExists: false,
      hashMatches: false
    };
  }

  const stats = fs.statSync(fileInfo.path);
  const actualSha256 = stats.isFile() ? hashFile(fileInfo.path) : null;
  const sizeMatches = typeof fileInfo.size === "number" ? stats.size === fileInfo.size : true;
  const hashMatches = fileInfo.sha256 ? actualSha256 === String(fileInfo.sha256).toUpperCase() : true;

  if (!sizeMatches) {
    failures.push(`${label}: size mismatch. expected ${fileInfo.size}, actual ${stats.size}`);
  }

  if (!hashMatches) {
    failures.push(`${label}: sha256 mismatch. expected ${fileInfo.sha256}, actual ${actualSha256}`);
  }

  if (!fileInfo.sha256) {
    warnings.push(`${label}: no expected hash recorded`);
  }

  return {
    ...fileInfo,
    actualExists: true,
    actualSize: stats.size,
    actualSha256,
    sizeMatches,
    hashMatches
  };
}

function check(condition, failures, message) {
  if (!condition) {
    failures.push(message);
  }
}

const EXPECTED_VISIBLE_PAGE_COUNT = 6;

function checkPhaseUiReport(report, label, failures) {
  check(report?.status === "passed", failures, `${label} report is not passed`);
  check(
    Array.isArray(report?.pages) && report.pages.length === EXPECTED_VISIBLE_PAGE_COUNT,
    failures,
    `${label} did not validate exactly ${EXPECTED_VISIBLE_PAGE_COUNT} visible pages`
  );
  check(
    Array.isArray(report?.screenshots) && report.screenshots.length === EXPECTED_VISIBLE_PAGE_COUNT,
    failures,
    `${label} did not capture exactly ${EXPECTED_VISIBLE_PAGE_COUNT} screenshots`
  );
  check((report?.failures?.length ?? 0) === 0, failures, `${label} has UI failures`);
  check((report?.consoleErrors?.length ?? 0) === 0, failures, `${label} has console errors`);
  check((report?.pageErrors?.length ?? 0) === 0, failures, `${label} has page errors`);
}

function hasEnv(name) {
  return Boolean(process.env[name]);
}

function collectSigningEnv() {
  const candidates = {
    CSC_LINK: hasEnv("CSC_LINK"),
    CSC_KEY_PASSWORD: hasEnv("CSC_KEY_PASSWORD"),
    WIN_CSC_LINK: hasEnv("WIN_CSC_LINK"),
    WIN_CSC_KEY_PASSWORD: hasEnv("WIN_CSC_KEY_PASSWORD"),
    WINDOWS_CODESIGN_CERT_FILE: hasEnv("WINDOWS_CODESIGN_CERT_FILE"),
    WINDOWS_CODESIGN_CERT_PASSWORD: hasEnv("WINDOWS_CODESIGN_CERT_PASSWORD"),
    WINDOWS_CODESIGN_CERT_THUMBPRINT: hasEnv("WINDOWS_CODESIGN_CERT_THUMBPRINT"),
    WINDOWS_CODESIGN_CERT_SUBJECT: hasEnv("WINDOWS_CODESIGN_CERT_SUBJECT"),
    WINDOWS_CODESIGN_TIMESTAMP_URL: hasEnv("WINDOWS_CODESIGN_TIMESTAMP_URL")
  };

  return {
    candidates,
    hasCertificateInput:
      candidates.CSC_LINK ||
      candidates.WIN_CSC_LINK ||
      candidates.WINDOWS_CODESIGN_CERT_FILE ||
      candidates.WINDOWS_CODESIGN_CERT_THUMBPRINT ||
      candidates.WINDOWS_CODESIGN_CERT_SUBJECT,
    hasPasswordInput:
      candidates.CSC_KEY_PASSWORD ||
      candidates.WIN_CSC_KEY_PASSWORD ||
      candidates.WINDOWS_CODESIGN_CERT_PASSWORD ||
      candidates.WINDOWS_CODESIGN_CERT_THUMBPRINT ||
      candidates.WINDOWS_CODESIGN_CERT_SUBJECT,
    hasTimestampInput: candidates.WINDOWS_CODESIGN_TIMESTAMP_URL
  };
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const requirePublicRelease = process.argv.includes("--require-public");
  const failures = [];
  const warnings = [];

  const paths = {
    phase4RcSmoke: path.join(deliveryRoot, "phase4-rc-smoke-20260426.json"),
    phase5Runtime: path.join(deliveryRoot, "phase5-runtime-gateway-closeout-20260426.md"),
    phase6Contract: path.join(deliveryRoot, "phase6-contract-audit-20260426.json"),
    phase7Package: path.join(deliveryRoot, "phase7-package-closeout-20260426.json"),
    phase8Installer: path.join(deliveryRoot, "phase8-installer-closeout-20260426.json"),
    phase8Smoke: path.join(deliveryRoot, "phase8-installer-smoke-20260426.json"),
    phase11Ui: path.join(deliveryRoot, "phase11-ui-full-check-20260426.json"),
    phase12PortableUi: path.join(deliveryRoot, "phase12-portable-ui-full-check-20260426.json"),
    phase12InstalledUi: path.join(deliveryRoot, "phase12-installed-ui-full-check-20260426.json"),
    manifest: path.join(deliveryRoot, "openclaw-studio-rc-manifest-20260426.md")
  };

  for (const [label, filePath] of Object.entries(paths)) {
    check(fs.existsSync(filePath), failures, `${label}: missing report ${filePath}`);
  }

  const phase4 = fs.existsSync(paths.phase4RcSmoke) ? readJson(paths.phase4RcSmoke) : null;
  const phase5 = readTextIfExists(paths.phase5Runtime);
  const phase6 = fs.existsSync(paths.phase6Contract) ? readJson(paths.phase6Contract) : null;
  const phase7 = fs.existsSync(paths.phase7Package) ? readJson(paths.phase7Package) : null;
  const phase8 = fs.existsSync(paths.phase8Installer) ? readJson(paths.phase8Installer) : null;
  const phase8Smoke = fs.existsSync(paths.phase8Smoke) ? readJson(paths.phase8Smoke) : null;
  const phase11Ui = fs.existsSync(paths.phase11Ui) ? readJson(paths.phase11Ui) : null;
  const phase12PortableUi = fs.existsSync(paths.phase12PortableUi) ? readJson(paths.phase12PortableUi) : null;
  const phase12InstalledUi = fs.existsSync(paths.phase12InstalledUi) ? readJson(paths.phase12InstalledUi) : null;
  const manifest = readTextIfExists(paths.manifest);

  check(phase4?.checks?.extract === "passed", failures, "Phase 4 RC extract check is not passed");
  check(phase4?.checks?.shutdown === "passed", failures, "Phase 4 RC shutdown check is not passed");
  check(Boolean(phase4?.checks?.firstLaunch?.stayedAliveMs), failures, "Phase 4 first launch evidence is missing");
  check(Boolean(phase4?.checks?.restartLaunch?.stayedAliveMs), failures, "Phase 4 restart launch evidence is missing");

  check(Boolean(phase5?.includes("passed")), failures, "Phase 5 runtime closeout does not contain a passed marker");

  check(phase6?.passed === true, failures, "Phase 6 contract audit is not passed");
  check(phase6?.warnings?.length === 0, failures, "Phase 6 contract audit has warnings");
  check(phase6?.failures?.length === 0, failures, "Phase 6 contract audit has failures");

  check(phase7?.status === "passed", failures, "Phase 7 package closeout is not passed");
  check(phase8?.status === "passed", failures, "Phase 8 installer closeout is not passed");
  check(phase8Smoke?.status === "passed", failures, "Phase 8 installer smoke is not passed");
  check(manifest?.includes("Phase 8 installer closeout: passed"), failures, "RC manifest does not include Phase 8 closeout");
  checkPhaseUiReport(phase11Ui, "Phase 11 RC UI", failures);
  checkPhaseUiReport(phase12PortableUi, "Phase 12 portable UI", failures);
  checkPhaseUiReport(phase12InstalledUi, "Phase 12 installed UI", failures);

  const artifacts = {
    rcZip: verifyFile(phase7?.artifacts?.rcZip, "RC Windows zip", failures, warnings),
    rcExe: verifyFile(phase7?.artifacts?.rcExe, "RC unpacked executable", failures, warnings),
    portableZip: verifyFile(phase7?.artifacts?.portableZip, "Portable zip", failures, warnings),
    portableExe: verifyFile(phase7?.artifacts?.portableExe, "Portable executable", failures, warnings),
    installer: verifyFile(phase8?.artifacts?.installer, "NSIS installer", failures, warnings),
    installerBlockMap: verifyFile(phase8?.artifacts?.blockMap, "NSIS blockmap", failures, warnings)
  };

  const signingEnv = collectSigningEnv();
  const signatureStatus = phase8?.signature?.status ?? null;
  const publicBlockers = [];

  if (signatureStatus !== "Valid") {
    publicBlockers.push({
      id: "windows-installer-not-signed",
      severity: "release-blocker",
      detail: `NSIS installer signature status is ${signatureStatus ?? "unknown"}.`
    });
  }

  if (!signingEnv.hasCertificateInput) {
    publicBlockers.push({
      id: "signing-certificate-input-missing",
      severity: "release-blocker",
      detail: "No signing certificate input env var is present."
    });
  }

  if (!signingEnv.hasPasswordInput) {
    publicBlockers.push({
      id: "signing-password-input-missing",
      severity: "release-blocker",
      detail: "No signing password env var is present."
    });
  }

  if (!signingEnv.hasTimestampInput) {
    publicBlockers.push({
      id: "timestamp-url-missing",
      severity: "release-blocker",
      detail: "No timestamp authority URL env var is present."
    });
  }

  const localQaPassed = failures.length === 0;
  const publicReleaseReady = localQaPassed && publicBlockers.length === 0;

  if (requirePublicRelease && !publicReleaseReady) {
    failures.push("Public release was required but signing/publish blockers remain.");
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: requirePublicRelease ? "require-public" : "local-qa",
    status: failures.length > 0 ? "failed" : publicReleaseReady ? "public-release-ready" : "local-qa-passed-public-blocked",
    localQa: {
      status: localQaPassed ? "passed" : "failed",
      evidence: {
        phase4RcSmoke: paths.phase4RcSmoke,
        phase5RuntimeCloseout: paths.phase5Runtime,
        phase6ContractAudit: paths.phase6Contract,
        phase7PackageCloseout: paths.phase7Package,
        phase8InstallerCloseout: paths.phase8Installer,
        phase8InstallerSmoke: paths.phase8Smoke,
        phase11UiFullCheck: paths.phase11Ui,
        phase12PortableUiFullCheck: paths.phase12PortableUi,
        phase12InstalledUiFullCheck: paths.phase12InstalledUi,
        rcManifest: paths.manifest
      }
    },
    publicRelease: {
      status: publicReleaseReady ? "ready" : "blocked",
      signatureStatus,
      blockers: publicBlockers
    },
    signingEnv,
    artifacts,
    warnings,
    failures
  };

  fs.mkdirSync(deliveryRoot, { recursive: true });
  const reportPath = path.join(deliveryRoot, "phase9-release-gate-20260426.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Phase 9 release gate failed. Report: ${reportPath}`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Phase 9 release gate passed. Report: ${reportPath}`);
  console.log(`Local QA: ${report.localQa.status}`);
  console.log(`Public release: ${report.publicRelease.status}`);

  if (publicBlockers.length > 0) {
    console.log(`Public blockers: ${publicBlockers.map((blocker) => blocker.id).join(", ")}`);
  }
}

main();
