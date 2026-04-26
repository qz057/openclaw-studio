# Phase 19 GitHub Release Staging Closeout - 2026-04-26

## Status

github-release-upload-staged

## Upload Root

`E:\claucd\界面控制台程序\delivery\github-release-upload-20260426`

## Staged Assets

| Asset | Size | SHA256 |
|---|---:|---|
| OpenClaw-Studio-0.1.0-win-x64-setup.exe | 102277901 | `C65BB0165286D2F6103A973A4D4CAB0E8612B00A27B9D53929E521C7A880A0AF` |
| OpenClaw-Studio-0.1.0-alpha-x64-portable.zip | 142897544 | `5F7F1D34CED6CA5315ACF921E07F815C52A4174C7B81ACF9BF95BFA4629C6493` |
| openclaw-studio-rc-manifest-20260426.md | 10980 | `6314F97822A75E4AA8242328FEC49B565A4003DD91810030C645BCC72AE3DF83` |
| phase13-public-release-handoff-20260426.md | 4619 | `E8EAC6CCD557434165A80B223541C7D883C61391AC912A9662077404E1AABA55` |
| phase17-signing-handoff-audit-closeout-20260426.md | 1146 | `86B83F9B7054827E7AEAE49BDD30378E184686173920E5ADFB80C93E78CB16FA` |
| phase20-runtime-release-closeout-20260426.md | 2923 | `BD3B4EC73AA8C98905A85D9AA02DFB79E60D58D8E66A57A51F9CD29E3AB03161` |
| SHA256SUMS.txt | | |

## Commands

- Browser steps: `E:\claucd\界面控制台程序\delivery\github-release-upload-20260426\BROWSER_UPLOAD_STEPS.md`
- GitHub CLI script: `E:\claucd\界面控制台程序\delivery\github-release-upload-20260426\PUBLISH_WITH_GH.ps1`

## Blockers

- none

## Warnings

- Optional asset not staged by default: RC Windows zip (E:\claucd\界面控制台程序\apps\studio\release\OpenClaw Studio-0.1.0-win-x64.zip)

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase19:github-release-staging
```
