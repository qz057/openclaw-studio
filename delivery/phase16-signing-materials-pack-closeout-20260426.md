# Phase 16 Signing Materials Pack Closeout - 2026-04-26

## Status

materials-pack-ready-external-inputs-required

## Materials Root

`E:\claucd\界面控制台程序\delivery\signing-materials-20260426`

## Generated Materials

- `delivery/signing-materials-20260426/.gitignore`
- `delivery/signing-materials-20260426/CERTIFICATE-REQUEST-DATA.template.json`
- `delivery/signing-materials-20260426/KEY-CUSTODY-POLICY.template.md`
- `delivery/signing-materials-20260426/SIGNING-ENV.private.template.ps1`
- `delivery/signing-materials-20260426/SIGNING-RUNBOOK.md`
- `delivery/signing-materials-20260426/SIGNING-ACCEPTANCE-CHECKLIST.md`
- `delivery/signing-materials-20260426/SIGNING-EVIDENCE.template.json`
- `delivery/signing-materials-20260426/TIMESTAMP-POLICY.json`
- `delivery/signing-materials-20260426/PUBLIC-RELEASE-GATE-COMMANDS.ps1`

## External Materials Still Required

- legal-publisher-identity: Legal publisher name exactly as it should appear in Windows signature details.
- organization-validation-record: CA organization or individual validation record, including verified address, phone, and requester contact.
- trusted-code-signing-certificate: OV/EV code-signing certificate provisioned on compliant hardware token, HSM, cloud key storage, or installed certificate store.
- private-key-access: Token PIN, HSM credential, cloud signing credential, PFX password, or certificate-store private-key access. Do not store this in repo.
- timestamp-authority-url: Trusted timestamp URL such as the timestamp service provided by the selected CA.

## Notes

- Trusted CA certificate/private-key material cannot be generated locally without CA identity validation.
- Do not store real certificate passwords or token PINs in this repository.
