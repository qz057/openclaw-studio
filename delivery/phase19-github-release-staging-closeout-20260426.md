# Phase 19 GitHub Release Staging Closeout - 2026-04-26

## Status

github-release-upload-staged

## Upload Root

`E:\claucd\界面控制台程序\delivery\github-release-upload-20260426`

## Staged Assets

| Asset | Size | SHA256 |
|---|---:|---|
| OpenClaw-Studio-0.1.0-win-x64-setup.exe | 102285737 | `DB56693AD9F9229275D52C49E065E04AE43DCBB28D7190E28D97DD686E1B59D3` |
| OpenClaw-Studio-0.1.0-alpha-x64-portable.zip | 142909286 | `1C904F7DAF15A80E90D948915E538323F302F5736A1B06EDE56A7D696DF99C59` |
| openclaw-studio-rc-manifest-20260426.md | 10980 | `D793C91F0536DD9C873BA9334E9C8A4CFB27D93B889532900B91E972AF4529B4` |
| phase13-public-release-handoff-20260426.md | 4635 | `260278DB73D2C16D1D9EB1B68EF75A45E73B57897D91E4D1A205A178CED4357D` |
| phase17-signing-handoff-audit-closeout-20260426.md | 1190 | `303ECAA9EC7C452B630BCC4AFCED292EF8176C8DF3F20D210363F9FA18955A08` |
| phase20-runtime-release-closeout-20260426.md | 2922 | `67DEE441F06F5AAFF5F41B35A63C3057EB9B2D7157A2A909A91FD280CC4101FF` |
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
