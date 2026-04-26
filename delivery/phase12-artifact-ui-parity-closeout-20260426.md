# Phase 12 Artifact UI Parity Closeout - 2026-04-26

## Status

Passed for navigation-fixed RC, portable, and installed-app UI parity.

## Scope

- Rebuilt the Windows portable artifact from the current navigation-fixed build.
- Rebuilt the Windows NSIS installer from the current navigation-fixed build.
- Ran the packaged UI full check against the RC executable under `release/win-unpacked`.
- Ran the same 7-page UI full check against the portable executable under `.packaging/windows-local/out/win-unpacked`.
- Installed the NSIS candidate into a temporary install root and ran the same 7-page UI full check against the installed executable.
- Enforced the regression guard that fails if `Claude` or `Codex` appears as a left-nav item.

## Current Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| RC Windows zip | `apps/studio/release/OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 bytes | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC executable | `apps/studio/release/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `50730C076C408878624E0284FCC932048B6EBCD76F9EFB0F9C34E6851321FF8B` |
| Portable zip | `apps/studio/.packaging/windows-local/out/OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142884736 bytes | `8AEF3B96E182859CCA6F731F703A2A664EF15407F3847BE54DEFD23324372397` |
| Portable executable | `apps/studio/.packaging/windows-local/out/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `109B787EA24B71CF0862434B9F38684E0ECFB432BAC3ECF84AAC27CA34563D57` |
| NSIS installer | `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102268358 bytes | `ABF2616260EDDCA9FEF94A27567D06533B1F824BE09340B693ADCEEB76FC7408` |
| NSIS blockmap | `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe.blockmap` | 106619 bytes | `EC0C2AC3CE4B382ABBFEA3AA50742DCBD9837D3AC8C76AF85B30FF71DEAB2F5D` |

## UI Parity Matrix

| Artifact Form | Report | Pages | Console Errors | Page Errors | Failures |
|---|---|---:|---:|---:|---:|
| RC unpacked app | `delivery/phase11-ui-full-check-20260426.json` | 7 | 0 | 0 | 0 |
| Portable unpacked app | `delivery/phase12-portable-ui-full-check-20260426.json` | 7 | 0 | 0 | 0 |
| Installed NSIS app | `delivery/phase12-installed-ui-full-check-20260426.json` | 7 | 0 | 0 | 0 |

## Verified Navigation

The visible left navigation is:

- `dashboard`
- `chat`
- `hermes`
- `sessions`
- `agents`
- `skills`
- `settings`

`Claude` and `Codex` are no longer visible navigation pages. The UI checker now treats them as removed-nav regressions if they appear in `.nav-item`.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:portable
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:installer
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:smoke -- --portable
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase7:package-closeout
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-closeout
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness
```

## Results

- Portable package smoke: passed when run serially. A prior parallel run exited code 0 early because installer smoke was also launching an Electron instance.
- Installer smoke: passed; silent install, installed-app launch, uninstall, and cleanup completed.
- Phase 7 package closeout: passed.
- Phase 8 installer closeout: passed; installer remains unsigned.
- Phase 9 release gate: local QA passed, public release blocked by signing.
- Phase 10 signing readiness: blocked because `signtool.exe`, signing certificate input, signing password input, and timestamp URL are missing.

## Boundaries

- Public distribution is still blocked until signing is configured and the installer is rebuilt.
- Dashboard and Skills content can still mention Codex or Claude as runtime/tooling data sources; that is not a navigation regression.
- Temporary Electron user data cleanup can report transient Windows `EPERM` after shutdown. The app verification itself passed before cleanup.
