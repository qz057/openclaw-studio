# Signing Runbook

## Preconditions

- Phase 12 artifact UI parity has passed.
- Phase 13 handoff exists.
- Trusted code-signing certificate is available through PFX, installed certificate store, token, HSM, or CA cloud key storage.
- Timestamp URL is configured.

## Commands

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase15:trusted-signing-intake
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase14:signing-bridge -- --require-public
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-closeout
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate -- --require-public
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness -- --require-ready
```

## Expected Result

- `phase14` reports `public-signature-valid`.
- `phase9` reports `public-release-ready`.
- `phase10` reports `ready`.
- Installed app UI parity remains passed.
