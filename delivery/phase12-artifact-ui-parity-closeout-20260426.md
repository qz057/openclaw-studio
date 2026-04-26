# Phase 12 Artifact UI Parity Closeout - 2026-04-26

## Status

Passed for the current 6-page main navigation contract across RC, portable, and installed-app UI parity.

## Scope

- Rebuilt the Windows portable artifact from the current UI-polished build.
- Rebuilt the Windows NSIS installer from the current UI-polished build.
- Ran the packaged UI full check against the RC executable under `release/win-unpacked`.
- Ran the same 6-page UI full check against the portable executable under `.packaging/windows-local/out/win-unpacked`.
- Installed the NSIS candidate into a temporary install root and ran the same 6-page UI full check against the installed executable.
- Enforced the regression guard that fails if removed internal/user-facing phrases reappear in the main pages or command palette.

## Current Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| RC Windows zip | `apps/studio/release/OpenClaw Studio-0.1.0-win-x64.zip` | 141157276 bytes | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC executable | `apps/studio/release/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `B12DAE546AB02BC7BF1940F0B860A5424D72C489C0AAC3C92BB06F3DF457AEFC` |
| Portable zip | `apps/studio/.packaging/windows-local/out/OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142897544 bytes | `5F7F1D34CED6CA5315ACF921E07F815C52A4174C7B81ACF9BF95BFA4629C6493` |
| Portable executable | `apps/studio/.packaging/windows-local/out/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `F07FF1619A1C33E9C4683CF5A305EAA74E8F4F3DEAC99BE1C6F8041A04411343` |
| NSIS installer | `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102277901 bytes | `C65BB0165286D2F6103A973A4D4CAB0E8612B00A27B9D53929E521C7A880A0AF` |
| NSIS blockmap | `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe.blockmap` | 106607 bytes | `2BAC8DA1673BB4C2F62FA14FC9BD00889C33EBD4C9BFBEF72E32711C324B4BEE` |

## UI Parity Matrix

| Artifact Form | Report | Pages | Screenshots | Console Errors | Page Errors | Failures |
|---|---|---:|---:|---:|---:|---:|
| RC unpacked app | `delivery/phase11-ui-full-check-20260426.json` | 6 | 6 | 0 | 0 | 0 |
| Portable unpacked app | `delivery/phase12-portable-ui-full-check-20260426.json` | 6 | 6 | 0 | 0 | 0 |
| Installed NSIS app | `delivery/phase12-installed-ui-full-check-20260426.json` | 6 | 6 | 0 | 0 | 0 |

## Verified Navigation

The visible primary navigation is:

- `dashboard`
- `chat`
- `sessions`
- `skills`
- `settings`
- `agents`

`Hermes`, `Claude`, and `Codex` are no longer primary navigation pages. OpenClaw and Hermes remain visible only as gateway/service status rows, not as separate page routes.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" typecheck
npm run -C "E:\claucd\界面控制台程序\apps\studio" test -- --run
npm run -C "E:\claucd\界面控制台程序\apps\studio" build
npm run -C "E:\claucd\界面控制台程序\apps\studio" smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase11:ui-full-check
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase12:artifact-ui-parity
```

## Results

- Typecheck: passed.
- Unit tests: passed, 8 files / 73 tests.
- Smoke: passed, including renderer markers, bridge fallback, runtime contracts, host boundary actions, connector controls, and release skeleton.
- Phase 11 UI full check: passed, 6 pages / 6 screenshots / 0 warnings.
- Phase 12 artifact UI parity: passed end to end.
- Phase 9 release gate: local QA passed, public release blocked by signing.
- Phase 10 signing readiness: blocked because `signtool.exe`, signing certificate input, signing password input, and timestamp URL are missing.

## Boundaries

- Public distribution is still blocked until signing is configured and the installer is rebuilt.
- Dashboard and Skills content can still mention Codex, Claude, OpenClaw, Hermes, Electron, MCP, or shell as product/runtime/tooling names; those are not navigation regressions.
- Temporary Electron user data cleanup can report transient Windows `EPERM` after shutdown. The app verification itself passed before cleanup.
