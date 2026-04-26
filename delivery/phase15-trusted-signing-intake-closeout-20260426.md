# Phase 15 Trusted Signing Intake Closeout - 2026-04-26

## Status

trusted-signing-input-blocked

## Inputs

- certificate file input: missing
- certificate thumbprint input: missing
- certificate subject input: missing
- password/store selector input: missing
- timestamp URL: present
- store code-signing certificates detected: 1

## Blockers

- trusted-certificate-input-missing: Set WINDOWS_CODESIGN_CERT_FILE, WIN_CSC_LINK, CSC_LINK, WINDOWS_CODESIGN_CERT_THUMBPRINT, or WINDOWS_CODESIGN_CERT_SUBJECT.
- certificate-password-or-store-selector-missing: Set certificate password env var for PFX input, or select an installed certificate by thumbprint/subject.

## Template

Private signing environment template: `delivery/phase15-signing-env.template.ps1`
