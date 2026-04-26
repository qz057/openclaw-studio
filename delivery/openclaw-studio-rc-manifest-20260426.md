# OpenClaw Studio RC Manifest - 2026-04-26

## Release Candidate

Status: RC directory and Windows zip are generated and verified.

## Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| Windows zip | `apps/studio/release/OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 bytes | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| Unpacked Windows app | `apps/studio/release/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `50730C076C408878624E0284FCC932048B6EBCD76F9EFB0F9C34E6851321FF8B` |

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" typecheck
npm run -C "E:\claucd\界面控制台程序\apps\studio" build
npm run -C "E:\claucd\界面控制台程序\apps\studio" test
npm run -C "E:\claucd\界面控制台程序\apps\studio" smoke
node "E:\claucd\界面控制台程序\.tmp\visual-check.mjs"
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" dist:win
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase4:rc-smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" contract:audit
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase11:ui-full-check
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:portable
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:installer
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase12:artifact-ui-parity
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase13:public-release-handoff
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase14:signing-bridge -- --dev-self-signed
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase15:trusted-signing-intake
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase16:signing-materials-pack
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase17:signing-handoff-audit
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase18:github-public-preview-pack
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase19:github-release-staging
```

## Result

- Typecheck: passed.
- Build: passed.
- Tests: 8 files passed, 67 tests passed.
- Smoke: passed.
- Visual check: 36 checks passed, 0 failures.
- Package smoke: passed; packaged app stayed alive for 20000ms and was shut down by the smoke script.
- Dist win: passed; generated `win-unpacked` and `OpenClaw Studio-0.1.0-win-x64.zip`.
- Phase 4 RC smoke: passed; zip extraction, first launch, shutdown, and restart verified. Report: `delivery/phase4-rc-smoke-20260426.json`.
- Phase 5 runtime closeout: passed; OpenClaw Gateway RPC and Hermes WSL runtime are now observable. Report: `delivery/phase5-runtime-gateway-closeout-20260426.md`.
- Phase 6 contract audit: passed; 37 API methods, 39 channels, 0 warnings, 0 failures. Report: `delivery/phase6-contract-audit-20260426.json`; closeout: `delivery/phase6-contract-closeout-20260426.md`.
- Phase 7 package closeout: passed for Windows RC zip, unpacked app, and local portable zip. Report: `delivery/phase7-package-closeout-20260426.json`; closeout: `delivery/phase7-package-closeout-20260426.md`.
- Phase 8 installer closeout: passed for unsigned Windows NSIS installer candidate. Installer: `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe`; report: `delivery/phase8-installer-closeout-20260426.json`; closeout: `delivery/phase8-installer-closeout-20260426.md`.
- Phase 9 release gate: local QA candidate passed; public release blocked by signing requirements. Report: `delivery/phase9-release-gate-20260426.json`; closeout: `delivery/phase9-release-gate-closeout-20260426.md`.
- Phase 10 signing readiness: blocked; installer exists, but `signtool.exe`, signing certificate input, signing password input, and timestamp URL are missing. Report: `delivery/phase10-signing-readiness-20260426.json`; closeout: `delivery/phase10-signing-readiness-closeout-20260426.md`.
- Phase 11 packaged UI full check: passed; launched the packaged app, navigated all 7 visible sidebar pages, exercised non-destructive visible controls, captured screenshots, and found 0 console errors, 0 page errors, 0 failures. Report: `delivery/phase11-ui-full-check-20260426.json`; closeout: `delivery/phase11-ui-full-check-closeout-20260426.md`.
- Phase 12 artifact UI parity: passed; rebuilt portable and NSIS installer from the current navigation-fixed build, then ran the 7-page UI check against RC, portable, and installed-app executable forms. Reports: `delivery/phase12-portable-ui-full-check-20260426.json`, `delivery/phase12-installed-ui-full-check-20260426.json`; closeout: `delivery/phase12-artifact-ui-parity-closeout-20260426.md`.
- Phase 13 public release handoff: generated machine-readable and markdown handoff for signing/public release. Local QA is passed; public release remains blocked by missing signing prerequisites. Report: `delivery/phase13-public-release-handoff-20260426.json`; closeout: `delivery/phase13-public-release-handoff-20260426.md`.
- Phase 14 signing bridge: passed as a development self-signed signing-path proof. It generated a signed installer copy with a signer certificate, but verification remains untrusted and is not valid for public distribution. Report: `delivery/phase14-signing-bridge-20260426.json`; closeout: `delivery/phase14-signing-bridge-closeout-20260426.md`.
- Phase 14 dev-signed installed UI check: passed; the self-signed installer copy installed successfully and its installed app passed the same 7-page UI parity check. Report: `delivery/phase14-dev-signed-installed-ui-full-check-20260426.json`.
- Phase 15 trusted signing intake: blocked until a trusted signing certificate input and timestamp URL are provided. It generated the private environment template at `delivery/phase15-signing-env.template.ps1`. Report: `delivery/phase15-trusted-signing-intake-20260426.json`; closeout: `delivery/phase15-trusted-signing-intake-closeout-20260426.md`.
- Phase 16 signing materials pack: generated the release signing intake templates, key custody policy, private env template, runbook, acceptance checklist, timestamp policy, evidence template, private-file ignore rules, and public release gate command wrapper under `delivery/signing-materials-20260426`. Report: `delivery/phase16-signing-materials-pack-20260426.json`; closeout: `delivery/phase16-signing-materials-pack-closeout-20260426.md`.
- Phase 17 signing handoff audit: passed; verified 9 signing material files, confirmed 0 secret-scan findings, and confirmed the public release gate wrapper fails fast with a clear missing-private-env message before real signing inputs are present. Report: `delivery/phase17-signing-handoff-audit-20260426.json`; closeout: `delivery/phase17-signing-handoff-audit-closeout-20260426.md`.
- Phase 18 GitHub public preview pack: passed; generated unsigned GitHub preview release notes, asset manifest, upload command template, public preview README, and security policy draft. It scanned 591 public-source candidate files, scanned 526 text files, found 0 large-file blockers and 0 secret findings. Report: `delivery/phase18-github-public-preview-pack-20260426.json`; closeout: `delivery/phase18-github-public-preview-pack-closeout-20260426.md`.
- Phase 19 GitHub release staging: passed; copied the unsigned installer, portable zip, public release evidence documents, and `SHA256SUMS.txt` into `delivery/github-release-upload-20260426/assets` for GitHub Release upload. Report: `delivery/phase19-github-release-staging-20260426.json`; closeout: `delivery/phase19-github-release-staging-closeout-20260426.md`.
- Manual launch check: `release/win-unpacked/OpenClaw Studio.exe` stayed alive for 20 seconds and was then stopped.
- Zip contents check: includes `OpenClaw Studio.exe` and `resources/app.asar`.

## Known Non-Blocking Warnings

- electron-builder reports duplicate dependency references for several transitive packages. The build completes and output artifacts are present.
- electron-builder emits Node `DEP0190` from its child-process shell usage. This is upstream/tooling noise in the current packaging path.
- Product boundaries still intentionally keep host executor disabled and installer/signing flows as metadata/review-only paths.
- NSIS setup executable is generated as an unsigned local candidate in Phase 8. Code signing and timestamping remain the next release-engineering branch.
- Phase 9 blocks public distribution until the NSIS installer signature is `Valid` and signing certificate/password/timestamp inputs are configured.
- Phase 10 additionally confirms this host currently cannot execute signing because `signtool.exe` is missing.
- Phase 11 intentionally does not trigger destructive or external side-effect actions such as delete, uninstall, stop gateway, send message, create session, or connect/disconnect; those controls were inspected for rendered state and safe availability only.
- Phase 11 recorded a non-product Windows cleanup warning while deleting the temporary user data directory after Electron shutdown.
- Phase 12 installed-app UI check used a temporary NSIS install root, verified the installed executable, then removed the temporary install root. Public distribution remains blocked until signing is configured.
- Phase 13 does not sign or publish. It records exact signing prerequisites and commands only; signing still requires trusted certificate material and timestamp configuration.
- Phase 14 development self-signed output proves local signing execution only. Public release still requires trusted certificate input and timestamped `Valid` Authenticode verification.
- Phase 14 dev-signed installer is not a public artifact; it exists only to prove the local signing and post-sign install/UI path.
- Phase 15 template is a placeholder only. Do not commit or paste real certificate passwords; fill them only in a private shell before rerunning public signing gates.
- Phase 16 intentionally does not generate real trusted certificate/private-key material. Legal publisher identity, CA validation, trusted code-signing certificate access, private-key access, and timestamp authority selection remain external release inputs.
- Phase 17 validates handoff material safety and gate behavior only. It intentionally does not run public signing without `delivery/signing-materials-20260426/SIGNING-ENV.private.ps1`.
- Phase 18 supports unsigned GitHub public preview distribution only. It does not remove Windows Unknown publisher / SmartScreen warnings; installer and portable zip must be uploaded as GitHub Release assets, not committed to Git.
- Phase 19 upload staging artifacts are intentionally ignored by Git because they contain large release binaries. Upload them to GitHub Release assets instead of committing them.
