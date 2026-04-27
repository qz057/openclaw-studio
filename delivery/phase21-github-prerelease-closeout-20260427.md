# Phase 21 GitHub Prerelease Closeout - 2026-04-27

## Status

github-prerelease-closeout-blocked

## Release

- repo: `qz057/openclaw-studio`
- tag: `v0.1.0-preview.5`
- url: missing
- prerelease: no
- assets: 0

## Asset Checks

| Asset | Exists | Expected Size | Release Size |
|---|---:|---:|---:|
| OpenClaw-Studio-0.1.0-win-x64-setup.exe | no | 102277901 |  |
| OpenClaw-Studio-0.1.0-alpha-x64-portable.zip | no | 142897544 |  |
| openclaw-studio-rc-manifest-20260426.md | no | 10980 |  |
| phase13-public-release-handoff-20260426.md | no | 4635 |  |
| phase17-signing-handoff-audit-closeout-20260426.md | no | 1190 |  |
| phase20-runtime-release-closeout-20260426.md | no | 2922 |  |
| SHA256SUMS.txt | no | 660 |  |

## Blockers

- github-release-view-failed: To get started with GitHub CLI, please run:  gh auth login
Alternatively, populate the GH_TOKEN environment variable with a GitHub API authentication token. GitHub API fallback: GitHub API release lookup returned 404.
- github-release-missing: v0.1.0-preview.5 is not visible as a GitHub release for qz057/openclaw-studio.
- github-release-asset-missing: OpenClaw-Studio-0.1.0-win-x64-setup.exe is missing from the GitHub release.
- github-release-asset-missing: OpenClaw-Studio-0.1.0-alpha-x64-portable.zip is missing from the GitHub release.
- github-release-asset-missing: openclaw-studio-rc-manifest-20260426.md is missing from the GitHub release.
- github-release-asset-missing: phase13-public-release-handoff-20260426.md is missing from the GitHub release.
- github-release-asset-missing: phase17-signing-handoff-audit-closeout-20260426.md is missing from the GitHub release.
- github-release-asset-missing: phase20-runtime-release-closeout-20260426.md is missing from the GitHub release.
- github-release-asset-missing: SHA256SUMS.txt is missing from the GitHub release.

## Warnings

- none

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase21:github-prerelease-closeout
```
