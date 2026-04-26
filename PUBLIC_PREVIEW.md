# OpenClaw Studio Public Preview

This repository can be published as a GitHub public preview without code signing.

## Current Release Mode

- Channel: unsigned public preview
- Version tag: `v0.1.0-preview.1`
- Binary delivery: GitHub Release assets
- Source delivery: Git repository
- Latest runtime closeout: `delivery/phase20-runtime-release-closeout-20260426.md`

## Windows Notice

The preview Windows installer is unsigned. Windows may show an Unknown publisher or SmartScreen warning when launching it. This is expected for the preview channel.

The trusted signing track is prepared separately under the Phase 14-17 signing reports and can be enabled later when a trusted code-signing certificate is available.

## What To Upload To GitHub Release

Upload generated binaries as release assets. Do not commit them into Git.

- `apps/studio/.packaging/windows-installer/out/OpenClaw-Studio-0.1.0-win-x64-setup.exe`
- `apps/studio/.packaging/windows-local/out/OpenClaw-Studio-0.1.0-alpha-x64-portable.zip`
- `delivery/openclaw-studio-rc-manifest-20260426.md`
- `delivery/phase13-public-release-handoff-20260426.md`
- `delivery/phase17-signing-handoff-audit-closeout-20260426.md`
- `delivery/phase20-runtime-release-closeout-20260426.md`

Current SHA256 values are recorded in:

- `delivery/github-release-upload-20260426/assets/SHA256SUMS.txt`
- `delivery/phase20-runtime-release-closeout-20260426.json`

## Generated Release Pack

Phase 18 generates the GitHub release notes, asset manifest, and release command template:

```powershell
npm run phase18:github-public-preview-pack
```

Output:

- `delivery/github-public-preview-20260426/RELEASE_NOTES_v0.1.0-preview.1.md`
- `delivery/github-public-preview-20260426/GITHUB_RELEASE_ASSETS.json`
- `delivery/github-public-preview-20260426/GITHUB_RELEASE_COMMANDS.ps1`
- `delivery/github-public-preview-20260426/README-PUBLIC-PREVIEW.md`
- `delivery/github-public-preview-20260426/SECURITY.md`

Phase 19 stages the upload-ready release folder:

```powershell
npm run phase19:github-release-staging
```

Output:

- `delivery/github-release-upload-20260426/RELEASE_NOTES_v0.1.0-preview.1.md`
- `delivery/github-release-upload-20260426/assets/SHA256SUMS.txt`
- `delivery/github-release-upload-20260426/BROWSER_UPLOAD_STEPS.md`
- `delivery/github-release-upload-20260426/PUBLISH_WITH_GH.ps1`

## Public Repo Boundary

Do not commit:

- `node_modules/`
- `apps/studio/.packaging/`
- `apps/studio/release/`
- generated installers/zips
- private signing env files
- certificate/private-key material

## License

No open-source license has been selected by this automation step. Until the project owner adds a license, all rights are reserved by default.
