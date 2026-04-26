# Phase 14 Signing Bridge Closeout - 2026-04-26

## Status

dev-signed-untrusted

## Artifact

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| Development signed installer copy | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-signed-dev\out\OpenClaw-Studio-0.1.0-win-x64-setup.dev-signed.exe` | 102279392 bytes | `A30A803CD7092708B88799CD97D2D3FC72504848427DF99D5FB5EED49DF872E2` |

## Signature

- Verification status: UnknownError
- Signer: CN=OpenClaw Studio Development Code Signing
- Thumbprint: B0E327B31516453070D8583420201F7FEEBF44DE
- Timestamp attached: no

## Boundaries

- This is a development self-signed signature that proves the local signing path. It is not trusted for public distribution.
- Public release requires a trusted code-signing certificate and a timestamped `Valid` Authenticode signature.

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase14:signing-bridge -- --dev-self-signed
```
