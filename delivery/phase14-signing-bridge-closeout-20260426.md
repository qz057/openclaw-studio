# Phase 14 Signing Bridge Closeout - 2026-04-26

## Status

dev-signed-untrusted

## Artifact

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| Development signed installer copy | `E:\claucd\界面控制台程序\apps\studio\.packaging\windows-signed-dev\out\OpenClaw-Studio-0.1.0-win-x64-setup.dev-signed.exe` | 102269848 bytes | `F639F734C34B827804135EB6D5E4455B8FF9AEA185893A341B4C0590A1F63CF0` |

## Signature

- Verification status: UnknownError
- Signer: CN=OpenClaw Studio Development Code Signing
- Thumbprint: B0E327B31516453070D8583420201F7FEEBF44DE
- Timestamp attached: no

## Boundaries

- This is a development self-signed signature that proves the local signing path. It is not trusted for public distribution.
- Public release requires a trusted code-signing certificate and a timestamped `Valid` Authenticode signature.

## Installed UI Check

The development-signed installer copy was also installed into a temporary directory and validated with the same 7-page UI parity checker:

| Report | Pages | Console Errors | Page Errors | Failures |
|---|---:|---:|---:|---:|
| `delivery/phase14-dev-signed-installed-ui-full-check-20260426.json` | 7 | 0 | 0 | 0 |

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase14:signing-bridge -- --dev-self-signed
```
