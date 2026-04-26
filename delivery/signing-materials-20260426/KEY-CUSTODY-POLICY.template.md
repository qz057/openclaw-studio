# Code Signing Key Custody Policy

## Scope

This policy covers the trusted code-signing key used to sign OpenClaw Studio Windows release artifacts.

## Requirements

- Store the private key only in compliant hardware token, HSM, CA cloud key storage, or an approved Windows certificate store with private-key protections.
- Never commit PFX files, PINs, passwords, recovery codes, or cloud signing tokens to this repository.
- Use a separate development self-signed certificate only for local test signing.
- Limit release-signing access to named custodians and record each signing event.
- Timestamp every public release signature.
- Rotate or revoke immediately if the signing credential is exposed.

## Custodians

| Name | Role | Access Type | Backup? |
|---|---|---|---|
| <primary custodian> | <role> | <token/HSM/cloud/store> | no |
| <backup custodian> | <role> | <token/HSM/cloud/store> | yes |
