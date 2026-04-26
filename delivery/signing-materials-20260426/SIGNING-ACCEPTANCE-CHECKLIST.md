# Signing Acceptance Checklist

- [ ] Publisher legal name confirmed.
- [ ] CA organization or individual validation completed.
- [ ] Code-signing certificate issued and accessible.
- [ ] Private key stored in approved protected storage.
- [ ] Timestamp URL configured.
- [ ] `phase15:trusted-signing-intake` passed.
- [ ] `phase14:signing-bridge -- --require-public` passed.
- [ ] Signed installer verifies as `Valid`.
- [ ] Signed installer smoke passed.
- [ ] Installed app UI parity passed.
- [ ] `phase9:release-gate -- --require-public` passed.
- [ ] `phase10:signing-readiness -- --require-ready` passed.
