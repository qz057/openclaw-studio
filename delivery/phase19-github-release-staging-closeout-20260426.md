# Phase 19 GitHub Release Staging Closeout - 2026-04-26

## Status

github-release-upload-staged

## Upload Root

`E:\claucd\界面控制台程序\delivery\github-release-upload-20260426`

## Staged Assets

| Asset | Size | SHA256 |
|---|---:|---|
| OpenClaw-Studio-0.1.0-win-x64-setup.exe | 102271599 | `919798396DE786A716B19CE71B240C55E60C44189169A7E4784AD1A363657DD9` |
| OpenClaw-Studio-0.1.0-alpha-x64-portable.zip | 142888611 | `90C4D78AE903C72260D6C8BF1C170ED470E9732F85C8F6E4EBFAF72005DF34F0` |
| openclaw-studio-rc-manifest-20260426.md | 10980 | `6314F97822A75E4AA8242328FEC49B565A4003DD91810030C645BCC72AE3DF83` |
| phase13-public-release-handoff-20260426.md | 4619 | `3543B2F7A7B9E8B49B28D286EE378684742A02D326397F68E2BEF571434B5356` |
| phase17-signing-handoff-audit-closeout-20260426.md | 1146 | `86B83F9B7054827E7AEAE49BDD30378E184686173920E5ADFB80C93E78CB16FA` |
| phase20-runtime-release-closeout-20260426.md | 3144 | `8A0DBA6BB0B35B7EB0A454442284DC2E0D6BA92702047DBB2C3FCFC9C85B4DBB` |
| SHA256SUMS.txt | | |

## Commands

- Browser steps: `E:\claucd\界面控制台程序\delivery\github-release-upload-20260426\BROWSER_UPLOAD_STEPS.md`
- GitHub CLI script: `E:\claucd\界面控制台程序\delivery\github-release-upload-20260426\PUBLISH_WITH_GH.ps1`

## Blockers

- none

## Warnings

- Optional asset not staged by default: RC Windows zip (E:\claucd\界面控制台程序\apps\studio\release\OpenClaw Studio-0.1.0-win-x64.zip)
- GitHub CLI is not logged in. Use browser upload or run gh auth login before CLI publishing.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase19:github-release-staging
```
