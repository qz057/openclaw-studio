# Phase 18 GitHub Public Preview Pack Closeout - 2026-04-26

## Status

github-public-preview-pack-ready

## Generated Pack

- root: `E:\claucd\界面控制台程序\delivery\github-public-preview-20260426`
- release notes: `delivery/github-public-preview-20260426/RELEASE_NOTES_v0.1.0-preview.1.md`
- release asset manifest: `delivery/github-public-preview-20260426/GITHUB_RELEASE_ASSETS.json`
- release commands: `delivery/github-public-preview-20260426/GITHUB_RELEASE_COMMANDS.ps1`
- public preview README: `delivery/github-public-preview-20260426/README-PUBLIC-PREVIEW.md`
- security policy draft: `delivery/github-public-preview-20260426/SECURITY.md`
- runtime release closeout: `delivery/phase20-runtime-release-closeout-20260426.md`

## Release Assets

| Asset | Exists | Size | SHA256 |
|---|---:|---:|---|
| Windows NSIS installer | yes | 102271599 | `919798396DE786A716B19CE71B240C55E60C44189169A7E4784AD1A363657DD9` |
| Windows portable zip | yes | 142888611 | `90C4D78AE903C72260D6C8BF1C170ED470E9732F85C8F6E4EBFAF72005DF34F0` |
| RC Windows zip | yes | 141157276 | `1B22175E8A712938F2AFCE2369EAB445B4AE6BCF5244B2D6A2EF0589468CA56E` |
| RC manifest | yes | 10980 | `6314F97822A75E4AA8242328FEC49B565A4003DD91810030C645BCC72AE3DF83` |
| Public release handoff | yes | 4619 | `3543B2F7A7B9E8B49B28D286EE378684742A02D326397F68E2BEF571434B5356` |
| Signing handoff audit | yes | 1146 | `86B83F9B7054827E7AEAE49BDD30378E184686173920E5ADFB80C93E78CB16FA` |
| Runtime release closeout | yes | 3144 | `8A0DBA6BB0B35B7EB0A454442284DC2E0D6BA92702047DBB2C3FCFC9C85B4DBB` |

## Public Source Scan

- candidate files: 601
- text files scanned: 544
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
