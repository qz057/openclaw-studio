# Phase 22 GitHub Release Retention Closeout - 2026-04-27

## Status

github-release-retention-blocked

## Active Release

- repo: `qz057/openclaw-studio`
- active version: `v0.1.0-preview.5`
- url: missing

## Retired Versions

- v0.1.0-preview.1: release=absent, remoteTag=absent
- v0.1.0-preview.2: release=absent, remoteTag=absent
- v0.1.0-preview.3: release=absent, remoteTag=absent

## Blockers

- active-release-missing: v0.1.0-preview.5 is not present in GitHub releases.
- active-tag-missing: v0.1.0-preview.5 is not present on origin.

## Warnings

- GitHub CLI release list failed, so Phase 22 used the public GitHub API fallback.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase22:github-release-retention
```
