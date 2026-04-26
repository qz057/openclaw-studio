# Phase 9 Release Gate Closeout - 2026-04-26

## Status

Local QA candidate passed. Public release is blocked by signing requirements.

## Scope

- Aggregated Phase 4 RC smoke, Phase 5 runtime closeout, Phase 6 contract audit, Phase 7 package closeout, and Phase 8 installer closeout.
- Recomputed artifact hashes for RC zip, unpacked executable, portable zip, portable executable, NSIS installer, and NSIS blockmap.
- Checked the RC manifest contains current Phase 8 installer closeout evidence.
- Split release decision into local QA readiness and public distribution readiness.
- Captured code-signing environment readiness without exposing secrets.

## Implementation Changes

- Added `apps/studio/scripts/phase9-release-gate.cjs`.
- Added package script `phase9:release-gate`.
- Generated structured gate report: `delivery/phase9-release-gate-20260426.json`.

## Gate Result

| Gate | Result |
|---|---|
| Local QA candidate | passed |
| Public release | blocked |
| Artifact hash verification | passed |
| Contract audit evidence | passed |
| Installer smoke evidence | passed |
| Installer signature | `NotSigned` |

## Public Release Blockers

| Blocker | Severity | Detail |
|---|---|---|
| `windows-installer-not-signed` | release-blocker | NSIS installer signature status is `NotSigned`. |
| `signing-certificate-input-missing` | release-blocker | No signing certificate input env var is present. |
| `signing-password-input-missing` | release-blocker | No signing password env var is present. |
| `timestamp-url-missing` | release-blocker | No timestamp authority URL env var is present. |

## Verified Artifacts

| Artifact | SHA256 |
|---|---|
| RC Windows zip | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC unpacked executable | `50730C076C408878624E0284FCC932048B6EBCD76F9EFB0F9C34E6851321FF8B` |
| Portable zip | `8AEF3B96E182859CCA6F731F703A2A664EF15407F3847BE54DEFD23324372397` |
| Portable executable | `109B787EA24B71CF0862434B9F38684E0ECFB432BAC3ECF84AAC27CA34563D57` |
| NSIS installer | `ABF2616260EDDCA9FEF94A27567D06533B1F824BE09340B693ADCEEB76FC7408` |
| NSIS blockmap | `EC0C2AC3CE4B382ABBFEA3AA50742DCBD9837D3AC8C76AF85B30FF71DEAB2F5D` |

## Verification

```powershell
node --check "E:\claucd\界面控制台程序\apps\studio\scripts\phase9-release-gate.cjs"
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate
```

## Release Decision

The build is cleared as a local QA / release review candidate. It is not cleared for public distribution until certificate signing, password input, and timestamp authority configuration are provided, the installer is rebuilt, and Phase 8 plus Phase 9 are rerun.

## Next Required Inputs For Public Release

- Signing certificate input: `CSC_LINK`, `WIN_CSC_LINK`, or `WINDOWS_CODESIGN_CERT_FILE`.
- Signing password input: `CSC_KEY_PASSWORD`, `WIN_CSC_KEY_PASSWORD`, or `WINDOWS_CODESIGN_CERT_PASSWORD`.
- Timestamp authority input: `WINDOWS_CODESIGN_TIMESTAMP_URL`.
- Rebuilt installer with Authenticode status `Valid`.
