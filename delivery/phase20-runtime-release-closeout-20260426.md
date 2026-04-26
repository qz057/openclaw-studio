# Phase 20 Runtime Release Closeout - 2026-04-26

## Status

release-candidate-ready-for-github-preview

## Current Build Assets

| Asset | Size | SHA256 | Signing |
|---|---:|---|---|
| `OpenClaw-Studio-0.1.0-win-x64-setup.exe` | 102271599 | `919798396DE786A716B19CE71B240C55E60C44189169A7E4784AD1A363657DD9` | unsigned / Authenticode `NotSigned` |
| `OpenClaw-Studio-0.1.0-alpha-x64-portable.zip` | 142888611 | `90C4D78AE903C72260D6C8BF1C170ED470E9732F85C8F6E4EBFAF72005DF34F0` | unsigned preview zip |

## Runtime UI Verification

- Packaged app full UI check: `passed`
- Pages covered: 7
- Screenshots captured: 7
- Warnings: 0
- Report: `delivery/phase11-ui-full-check-runtime4-20260426.json`
- Screenshot root: `delivery/phase11-ui-screenshots-runtime4-20260426`

## Theme And Viewport Verification

- Status: `passed`
- Matrix: 7 navigation pages x 2 themes x 2 viewport sizes = 28 states
- Failures: 0
- Report: `delivery/phase12-theme-viewport-check-20260426.json`
- Screenshot root: `delivery/phase12-theme-viewport-screenshots-20260426`

## Release Staging

- Phase 18 public preview pack: `github-public-preview-pack-ready`
- Phase 19 GitHub upload staging: `github-release-upload-staged`
- Upload root: `delivery/github-release-upload-20260426`
- Release notes: `delivery/github-release-upload-20260426/RELEASE_NOTES_v0.1.0-preview.1.md`
- Asset checksums: `delivery/github-release-upload-20260426/assets/SHA256SUMS.txt`

## Fixed In This Closeout

- Dashboard default route is now `总览`.
- Removed Codex / Claude standalone navigation entries.
- Dashboard stream headings now show `Codex` and `Claude Code`; old `实时会话` heading text is removed.
- Codex and Claude session streams are backed by local runtime/session probes.
- GPU metrics now use a Windows performance-counter sampler with adapter fallback and non-blocking refresh.
- Runtime resource UI no longer displays raw `NaN`, `[object Object]`, or false CPU spike alerts from sub-second samples.
- Phase 11 UI check now fails on raw `[object Object]`, `NaN`, and removed live-session headings.

## Known Boundary

- This preview remains unsigned until trusted code-signing material is available.
- `Host Executor` is intentionally shown as `受保护`; live host mutation remains disabled by policy.
- GitHub CLI is not authenticated in the current shell. Browser upload or a fresh `gh auth login` is required before creating the GitHub Release through CLI.

## Final Verification Commands

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" typecheck
npm run -C "E:\claucd\界面控制台程序\apps\studio" test
npm run -C "E:\claucd\界面控制台程序\apps\studio" build
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:portable
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:windows:installer
npm run -C "E:\claucd\界面控制台程序\apps\studio" contract:audit
npm run -C "E:\claucd\界面控制台程序\apps\studio" smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase11:ui-full-check
npm run phase18:github-public-preview-pack
npm run phase19:github-release-staging
```
