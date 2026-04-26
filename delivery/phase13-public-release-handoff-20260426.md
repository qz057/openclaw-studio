# Phase 13 Public Release Handoff - 2026-04-26

## Status

Public release remains blocked by signing prerequisites. Local QA and artifact UI parity are passed.

## Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| RC Windows zip | `E:\claucd\界面控制台程序\apps\studio\release\OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 bytes | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC executable | `E:\claucd\界面控制台程序\apps\studio\release\win-unpacked\OpenClaw Studio.exe` | 222973952 bytes | `B12DAE546AB02BC7BF1940F0B860A5424D72C489C0AAC3C92BB06F3DF457AEFC` |
| Portable zip | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142897544 bytes | `5F7F1D34CED6CA5315ACF921E07F815C52A4174C7B81ACF9BF95BFA4629C6493` |
| Portable executable | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\win-unpacked\OpenClaw Studio.exe` | 222973952 bytes | `F07FF1619A1C33E9C4683CF5A305EAA74E8F4F3DEAC99BE1C6F8041A04411343` |
| NSIS installer | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102277901 bytes | `C65BB0165286D2F6103A973A4D4CAB0E8612B00A27B9D53929E521C7A880A0AF` |
| NSIS blockmap | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe.blockmap` | 106607 bytes | `2BAC8DA1673BB4C2F62FA14FC9BD00889C33EBD4C9BFBEF72E32711C324B4BEE` |

## UI Parity

| Form | Status | Pages | Failures |
|---|---|---:|---:|
| RC unpacked | passed | 6 | 0 |
| Portable | passed | 6 | 0 |
| Installed NSIS app | passed | 6 | 0 |

## Signing Inputs

- signtool: E:\claucd\界面控制台程序\.tools\windows-sdk-buildtools\10.0.26100.7705\bin\10.0.26100.0\x64\signtool.exe
- PowerShell Authenticode: available
- certificate input: missing
- password input: missing
- timestamp URL: present (default: http://timestamp.digicert.com)
- installer signature: NotSigned
- signing bridge: dev-signed-untrusted / UnknownError
- signing bridge target: `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-signed-dev\out\OpenClaw-Studio-0.1.0-win-x64-setup.dev-signed.exe`
- trusted signing intake: trusted-signing-input-blocked
- signing env template: `E:\claucd\界面控制台程序\delivery\phase15-signing-env.template.ps1`
- signing materials pack: materials-pack-ready-external-inputs-required
- signing materials root: `E:\claucd\界面控制台程序\delivery\signing-materials-20260426`
- signing external materials tracked: 4
- signing handoff audit: external-signing-handoff-ready
- signing handoff secret findings: 0
- signing gate fail-fast probe: passed

## Blockers

- phase9:windows-installer-not-signed - NSIS installer signature status is NotSigned.
- phase9:signing-certificate-input-missing - No signing certificate input env var is present.
- phase9:signing-password-input-missing - No signing password env var is present.
- phase10:signing-certificate-input-missing - Set CSC_LINK, WIN_CSC_LINK, or WINDOWS_CODESIGN_CERT_FILE before signing.
- phase10:signing-password-input-missing - Set CSC_KEY_PASSWORD, WIN_CSC_KEY_PASSWORD, or WINDOWS_CODESIGN_CERT_PASSWORD before signing.

## Command Plan

- install-windows-sdk: signtool-missing

```powershell
Install Windows SDK / App Certification Kit so signtool.exe is available on PATH or under C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\signtool.exe
```

- set-signing-env: signing inputs are missing

```powershell
Set CSC_LINK or WINDOWS_CODESIGN_CERT_FILE plus CSC_KEY_PASSWORD or WINDOWS_CODESIGN_CERT_PASSWORD; the default timestamp URL is http://timestamp.digicert.com unless the CA requires another TSA.
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
