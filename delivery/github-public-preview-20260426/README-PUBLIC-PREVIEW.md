# OpenClaw Studio Public Preview

OpenClaw Studio is an Electron + React + TypeScript desktop control console.

## Current Public Build

- Version: v0.1.0-preview.2
- Channel: unsigned public preview
- Platform artifact focus: Windows installer and Windows portable zip

## Important Windows Notice

The preview installer is unsigned. Windows may display Unknown publisher or SmartScreen warnings. This is expected for the preview channel.

## Build And Verify

```powershell
npm install
npm run -C apps/studio contract:audit
npm run -C apps/studio typecheck
npm run -C apps/studio test
```

## Release Assets

Do not commit generated installers, portable zips, or unpacked Electron app directories to Git. Upload them to GitHub Releases as release assets.

## License

No open-source license has been selected in this repository by this automation step. Until a license is explicitly added by the project owner, all rights are reserved by default.
