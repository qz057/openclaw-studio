# Phase 8 Installer Closeout - 2026-04-26

## Status

Passed for an unsigned Windows NSIS installer candidate. The installer builds, installs silently to a temporary directory, launches the installed app for 20000 ms, uninstalls, and cleans up.

## Scope

- Added an isolated Windows NSIS installer build channel under `.packaging/windows-installer/out`.
- Added a deterministic Windows icon asset required by NSIS packaging.
- Added installer smoke automation for silent install, launch, uninstall, and cleanup.
- Added installer closeout automation for artifact hashes, blockmap, signature state, and smoke status.

## Implementation Changes

- Added `apps/studio/build/icons/icon.ico`.
- Added `apps/studio/scripts/package-windows-installer.cjs`.
- Added `apps/studio/scripts/phase8-installer-smoke.cjs`.
- Added `apps/studio/scripts/phase8-installer-closeout.cjs`.
- Added package scripts:
  - `package:windows:installer`
  - `phase8:installer-smoke`
  - `phase8:installer-closeout`

## Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| NSIS installer | `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102268358 bytes | `ABF2616260EDDCA9FEF94A27567D06533B1F824BE09340B693ADCEEB76FC7408` |
| NSIS blockmap | `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe.blockmap` | 106619 bytes | `EC0C2AC3CE4B382ABBFEA3AA50742DCBD9837D3AC8C76AF85B30FF71DEAB2F5D` |
| Generated NSIS config | `apps/studio/.packaging/windows-installer/electron-builder.nsis.generated.json` | 1393 bytes | `91AD85C25615F7D353CC03D5AD6EEE5E7CE1628BA8BA0B29A2F8ADBC37F2608A` |

## Verification

```powershell
node --check "E:\claucd\界面控制台程序\apps\studio\scripts\package-windows-installer.cjs"
node --check "E:\claucd\界面控制台程序\apps\studio\scripts\phase8-installer-smoke.cjs"
node --check "E:\claucd\界面控制台程序\apps\studio\scripts\phase8-installer-closeout.cjs"
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:installer
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-closeout
```

## Verification Results

- NSIS installer build: passed.
- Initial NSIS build blocker fixed: missing icon directory was resolved by adding `build/icons/icon.ico`.
- Authenticode status: `NotSigned`.
- Silent install: passed; executable created under a temp install root.
- Installed app launch smoke: passed; app stayed alive for 20000 ms.
- Uninstall: passed; NSIS uninstaller ran in silent mode.
- Cleanup: passed; temp install root removed after retrying through a transient Windows `EPERM` lock.
- Closeout report: `delivery/phase8-installer-closeout-20260426.json`.
- Smoke report: `delivery/phase8-installer-smoke-20260426.json`.

## Release Decision

Phase 8 is cleared for an unsigned installer candidate. This is suitable for local QA and release review, but not for trusted public distribution until certificate signing and timestamping are configured and reverified.

## Remaining Boundaries

- Installer is unsigned.
- No signing certificate or timestamp authority is configured.
- SmartScreen/trust reputation has not been established.
- Public release should add signing inputs, rebuild installer, rerun installer smoke, and regenerate this closeout.
