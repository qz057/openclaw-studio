# Phase 7 Package Closeout - 2026-04-26

## Status

Passed for Windows RC zip, unpacked app, and local portable zip. NSIS installer is explicitly recorded as not generated for this RC.

## Scope

- Rebuilt the Windows local portable package from the current build output.
- Smoke-tested the fresh portable package by launching the localized packaged app for 20000 ms.
- Added automated Phase 7 package closeout verification.
- Verified portable and RC archives contain the executable and `resources/app.asar`.
- Recorded installer/signing boundary for the next release stage.

## Implementation Changes

- Added `phase7:package-closeout` script to `apps/studio/package.json`.
- Added `apps/studio/scripts/phase7-package-closeout.cjs`.
- Generated structured report: `delivery/phase7-package-closeout-20260426.json`.

## Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| Local portable zip | `apps/studio/.packaging/windows-local/out/OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142884736 bytes | `8AEF3B96E182859CCA6F731F703A2A664EF15407F3847BE54DEFD23324372397` |
| Local portable executable | `apps/studio/.packaging/windows-local/out/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `109B787EA24B71CF0862434B9F38684E0ECFB432BAC3ECF84AAC27CA34563D57` |
| RC Windows zip | `apps/studio/release/OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 bytes | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC unpacked executable | `apps/studio/release/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `50730C076C408878624E0284FCC932048B6EBCD76F9EFB0F9C34E6851321FF8B` |

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:portable
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:smoke -- --portable
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase7:package-closeout
```

## Verification Results

- Windows portable package build: passed.
- Fresh portable smoke: passed; app stayed alive for 20000 ms and shut down via forced taskkill.
- Archive closeout: passed; portable archive has 77 entries and includes `win-unpacked/OpenClaw Studio.exe` plus `win-unpacked/resources/app.asar`.
- RC archive closeout: passed; RC archive has 76 entries and includes `OpenClaw Studio.exe` plus `resources/app.asar`.
- NSIS installer: not generated in this RC.

## Release Decision

Phase 7 is cleared for portable/zip delivery. The next release engineering branch is installer/signing enablement: add an explicit NSIS target, define signing certificate input, run installer install/uninstall smoke, and then update the release channel gate.

## Remaining Boundaries

- No signed installer has been produced.
- No NSIS setup executable has been produced.
- Local portable package is verified as a launchable portable archive, not as an installed application.
- Electron-builder `DEP0190` warning remains non-blocking tooling noise during package generation.
