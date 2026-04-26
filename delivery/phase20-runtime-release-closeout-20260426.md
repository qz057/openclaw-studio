# Phase 20 Runtime Release Closeout - 2026-04-26

## Status

release-candidate-ready-for-github-preview

## Current Build Assets

| Asset | Path | Size | SHA256 | Hash matches report |
|---|---|---:|---|---:|
| Windows NSIS installer | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102277901 | `C65BB0165286D2F6103A973A4D4CAB0E8612B00A27B9D53929E521C7A880A0AF` | yes |
| NSIS blockmap | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe.blockmap` | 106607 | `2BAC8DA1673BB4C2F62FA14FC9BD00889C33EBD4C9BFBEF72E32711C324B4BEE` | yes |
| Windows portable zip | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142897544 | `5F7F1D34CED6CA5315ACF921E07F815C52A4174C7B81ACF9BF95BFA4629C6493` | yes |
| Windows portable executable | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\win-unpacked\OpenClaw Studio.exe` | 222973952 | `F07FF1619A1C33E9C4683CF5A305EAA74E8F4F3DEAC99BE1C6F8041A04411343` | yes |
| RC Windows zip | `E:\claucd\界面控制台程序\apps\studio\release\OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` | yes |
| RC executable | `E:\claucd\界面控制台程序\apps\studio\release\win-unpacked\OpenClaw Studio.exe` | 222973952 | `B12DAE546AB02BC7BF1940F0B860A5424D72C489C0AAC3C92BB06F3DF457AEFC` | yes |

## Runtime UI Verification

- Expected visible pages: 6

| Form | Status | Pages | Screenshots | Warnings | Failures |
|---|---|---:|---:|---:|---:|
| RC unpacked app | passed | 6 | 6 | 0 | 0 |
| Portable app | passed | 6 | 6 | 0 | 0 |
| Installed NSIS app | passed | 6 | 6 | 0 | 0 |

## Theme And Viewport Verification

- Status: passed; screenshots: 28; failures: 0

## Signing And Release Boundary

- Phase 9 release gate: local-qa-passed-public-blocked
- Phase 10 signing readiness: blocked
- Installer Authenticode: NotSigned
- Public release handoff: handoff-blocked
- Signing handoff audit: external-signing-handoff-ready

## GitHub Preview Staging

- Public preview pack: github-public-preview-pack-ready
- Upload staging: github-release-upload-staged
- Public preview root: `E:\claucd\界面控制台程序\delivery\github-public-preview-20260426`
- Upload root: `E:\claucd\界面控制台程序\delivery\github-release-upload-20260426`
- Release notes: `E:\claucd\界面控制台程序\delivery\github-release-upload-20260426\RELEASE_NOTES_v0.1.0-preview.5.md`
- Git tag v0.1.0-preview.5 aligned with HEAD: yes
- GitHub CLI logged in: no

## Blockers

- none

## Warnings

- Public release remains blocked until trusted signing prerequisites are resolved.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase20:runtime-release-closeout
```
