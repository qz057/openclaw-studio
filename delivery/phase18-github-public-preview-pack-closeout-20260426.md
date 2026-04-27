# Phase 18 GitHub Public Preview Pack Closeout - 2026-04-26

## Status

github-public-preview-pack-ready

## Generated Pack

- root: `E:\claucd\界面控制台程序\delivery\github-public-preview-20260426`
- release notes: `delivery/github-public-preview-20260426/RELEASE_NOTES_v0.1.0-preview.7.md`
- release asset manifest: `delivery/github-public-preview-20260426/GITHUB_RELEASE_ASSETS.json`
- release commands: `delivery/github-public-preview-20260426/GITHUB_RELEASE_COMMANDS.ps1`
- public preview README: `delivery/github-public-preview-20260426/README-PUBLIC-PREVIEW.md`
- security policy draft: `delivery/github-public-preview-20260426/SECURITY.md`
- runtime release closeout: `delivery/phase20-runtime-release-closeout-20260426.md`

## Release Assets

| Asset | Exists | Size | SHA256 |
|---|---:|---:|---|
| Windows NSIS installer | yes | 102285737 | `DB56693AD9F9229275D52C49E065E04AE43DCBB28D7190E28D97DD686E1B59D3` |
| Windows portable zip | yes | 142909286 | `1C904F7DAF15A80E90D948915E538323F302F5736A1B06EDE56A7D696DF99C59` |
| RC Windows zip | yes | 141182170 | `337330D8DE49DD98E5833B54F39D4BAF34CD14A76CF9C054171FAA9B70D8BB7B` |
| RC manifest | yes | 10980 | `D793C91F0536DD9C873BA9334E9C8A4CFB27D93B889532900B91E972AF4529B4` |
| Public release handoff | yes | 4635 | `260278DB73D2C16D1D9EB1B68EF75A45E73B57897D91E4D1A205A178CED4357D` |
| Signing handoff audit | yes | 1190 | `303ECAA9EC7C452B630BCC4AFCED292EF8176C8DF3F20D210363F9FA18955A08` |
| Runtime release closeout | yes | 2922 | `67DEE441F06F5AAFF5F41B35A63C3057EB9B2D7157A2A909A91FD280CC4101FF` |

## Public Source Scan

- candidate files: 802
- text files scanned: 548
- large files >= 50 MiB: 0
- secret findings: 0

## Blockers

- none

## Warnings

- GitHub CLI is not logged in. Manual GitHub login or browser release upload is required.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase18:github-public-preview-pack
```
