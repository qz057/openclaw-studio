# Phase 18 GitHub Public Preview Pack Closeout - 2026-04-26

## Status

github-public-preview-pack-ready

## Generated Pack

- root: `E:\claucd\界面控制台程序\delivery\github-public-preview-20260426`
- release notes: `delivery/github-public-preview-20260426/RELEASE_NOTES_v0.1.0-preview.5.md`
- release asset manifest: `delivery/github-public-preview-20260426/GITHUB_RELEASE_ASSETS.json`
- release commands: `delivery/github-public-preview-20260426/GITHUB_RELEASE_COMMANDS.ps1`
- public preview README: `delivery/github-public-preview-20260426/README-PUBLIC-PREVIEW.md`
- security policy draft: `delivery/github-public-preview-20260426/SECURITY.md`
- runtime release closeout: `delivery/phase20-runtime-release-closeout-20260426.md`

## Release Assets

| Asset | Exists | Size | SHA256 |
|---|---:|---:|---|
| Windows NSIS installer | yes | 102277901 | `C65BB0165286D2F6103A973A4D4CAB0E8612B00A27B9D53929E521C7A880A0AF` |
| Windows portable zip | yes | 142897544 | `5F7F1D34CED6CA5315ACF921E07F815C52A4174C7B81ACF9BF95BFA4629C6493` |
| RC Windows zip | yes | 141157276 | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC manifest | yes | 10980 | `6314F97822A75E4AA8242328FEC49B565A4003DD91810030C645BCC72AE3DF83` |
| Public release handoff | yes | 4635 | `260278DB73D2C16D1D9EB1B68EF75A45E73B57897D91E4D1A205A178CED4357D` |
| Signing handoff audit | yes | 1190 | `303ECAA9EC7C452B630BCC4AFCED292EF8176C8DF3F20D210363F9FA18955A08` |
| Runtime release closeout | yes | 3015 | `6BBC753F9A119FC35A19E547875058B14EB2118FDC1C00FDA4CBA4C34092DD71` |

## Public Source Scan

- candidate files: 799
- text files scanned: 549
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
