# Phase 13 Public Release Handoff - 2026-04-26

## Status

Public release remains blocked by signing prerequisites. Local QA and artifact UI parity are passed.

## Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| RC Windows zip | `E:\claucd\界面控制台程序\apps\studio\release\OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 bytes | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC executable | `E:\claucd\界面控制台程序\apps\studio\release\win-unpacked\OpenClaw Studio.exe` | 222973952 bytes | `50730C076C408878624E0284FCC932048B6EBCD76F9EFB0F9C34E6851321FF8B` |
| Portable zip | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142884736 bytes | `8AEF3B96E182859CCA6F731F703A2A664EF15407F3847BE54DEFD23324372397` |
| Portable executable | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\win-unpacked\OpenClaw Studio.exe` | 222973952 bytes | `109B787EA24B71CF0862434B9F38684E0ECFB432BAC3ECF84AAC27CA34563D57` |
| NSIS installer | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102268358 bytes | `ABF2616260EDDCA9FEF94A27567D06533B1F824BE09340B693ADCEEB76FC7408` |
| NSIS blockmap | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe.blockmap` | 106619 bytes | `EC0C2AC3CE4B382ABBFEA3AA50742DCBD9837D3AC8C76AF85B30FF71DEAB2F5D` |

## UI Parity

| Form | Status | Pages | Failures |
|---|---|---:|---:|
| RC unpacked | passed | 7 | 0 |
| Portable | passed | 7 | 0 |
| Installed NSIS app | passed | 7 | 0 |

## Signing Inputs

- signtool: missing
- PowerShell Authenticode: available
- certificate input: missing
- password input: missing
- timestamp URL: missing
- installer signature: NotSigned
- signing bridge: dev-signed-untrusted / UnknownError
- signing bridge target: `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-signed-dev\out\OpenClaw-Studio-0.1.0-win-x64-setup.dev-signed.exe`
- trusted signing intake: trusted-signing-input-blocked
- signing env template: `E:\claucd\界面控制台程序\delivery\phase15-signing-env.template.ps1`
- signing materials pack: materials-pack-ready-external-inputs-required
- signing materials root: `E:\claucd\界面控制台程序\delivery\signing-materials-20260426`
- signing external materials tracked: 5
- signing handoff audit: external-signing-handoff-ready
- signing handoff secret findings: 0
- signing gate fail-fast probe: passed

## Blockers

- phase9:windows-installer-not-signed - NSIS installer signature status is NotSigned.
- phase9:signing-certificate-input-missing - No signing certificate input env var is present.
- phase9:signing-password-input-missing - No signing password env var is present.
- phase9:timestamp-url-missing - No timestamp authority URL env var is present.
- phase10:signing-certificate-input-missing - Set CSC_LINK, WIN_CSC_LINK, or WINDOWS_CODESIGN_CERT_FILE before signing.
- phase10:signing-password-input-missing - Set CSC_KEY_PASSWORD, WIN_CSC_KEY_PASSWORD, or WINDOWS_CODESIGN_CERT_PASSWORD before signing.
- phase10:timestamp-url-missing - Set WINDOWS_CODESIGN_TIMESTAMP_URL before signing.

## Command Plan

- install-windows-sdk: signtool-missing

```powershell
Install Windows SDK / App Certification Kit so signtool.exe is available on PATH or under C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\signtool.exe
```

- set-signing-env: signing inputs are missing

```powershell
Set CSC_LINK or WINDOWS_CODESIGN_CERT_FILE, CSC_KEY_PASSWORD or WINDOWS_CODESIGN_CERT_PASSWORD, and WINDOWS_CODESIGN_TIMESTAMP_URL in the signing environment.
```

- rebuild-installer: signing inputs are present

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:installer
```

- verify-signed-installer: installer rebuilt

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-smoke && npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-closeout
```

- final-gates: signed installer closeout is valid

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate -- --require-public && npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness -- --require-ready
```

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase12:artifact-ui-parity
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase13:public-release-handoff
```
