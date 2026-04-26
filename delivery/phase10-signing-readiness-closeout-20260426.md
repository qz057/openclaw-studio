# Phase 10 Signing Readiness Closeout - 2026-04-26

## Status

Blocked. The unsigned NSIS installer candidate exists and upstream release gates are usable, but this machine is not ready to sign the installer.

## Scope

- Located the current NSIS installer candidate.
- Checked Phase 9 release gate status.
- Checked Phase 8 installer signature status.
- Searched for `signtool.exe` on PATH and under Windows Kits 10 bin directories.
- Checked signing certificate, password, and timestamp inputs without exposing secret values.

## Implementation Changes

- Added `apps/studio/scripts/phase10-signing-readiness.cjs`.
- Added package script `phase10:signing-readiness`.
- Generated structured report: `delivery/phase10-signing-readiness-20260426.json`.

## Readiness Result

| Check | Result |
|---|---|
| Installer candidate exists | passed |
| Phase 9 release gate exists | passed |
| Phase 8 installer closeout exists | passed |
| Current installer signature | `NotSigned` |
| `signtool.exe` | missing |
| Signing certificate input | missing |
| Signing password input | missing |
| Timestamp URL input | missing |

## Blockers

| Blocker | Detail |
|---|---|
| `signtool-missing` | `signtool.exe` was not found on PATH or in Windows Kits 10 bin directories. |
| `signing-certificate-input-missing` | Set `CSC_LINK`, `WIN_CSC_LINK`, or `WINDOWS_CODESIGN_CERT_FILE`. |
| `signing-password-input-missing` | Set `CSC_KEY_PASSWORD`, `WIN_CSC_KEY_PASSWORD`, or `WINDOWS_CODESIGN_CERT_PASSWORD`. |
| `timestamp-url-missing` | Set `WINDOWS_CODESIGN_TIMESTAMP_URL`. |

## Verification

```powershell
node --check "E:\claucd\界面控制台程序\apps\studio\scripts\phase10-signing-readiness.cjs"
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness
```

## Next Required Work

Install or expose Windows signing tools, provide a signing certificate, provide the certificate password through environment variables, configure a timestamp authority, rebuild/sign the installer, rerun Phase 8 installer smoke, rerun Phase 9 release gate, then rerun Phase 10 with `--require-ready`.

## Release Decision

Phase 10 does not block local QA. It blocks public signed distribution until the four readiness blockers above are resolved.
