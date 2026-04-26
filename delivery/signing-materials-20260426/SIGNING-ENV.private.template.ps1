# Fill in a private shell. Do not commit real secrets.

# Option A: PFX file input
$env:WINDOWS_CODESIGN_CERT_FILE = 'C:\\private\\trusted-code-signing-cert.pfx'
$env:WINDOWS_CODESIGN_CERT_PASSWORD = '<private-password>'

# Option B: installed certificate input
# $env:WINDOWS_CODESIGN_CERT_THUMBPRINT = '<trusted-cert-thumbprint>'
# $env:WINDOWS_CODESIGN_CERT_SUBJECT = '<publisher subject fragment>'

# Timestamp authority. Prefer the TSA documented by the selected CA.
$env:WINDOWS_CODESIGN_TIMESTAMP_URL = 'https://timestamp.digicert.com'

# Save a filled private copy as SIGNING-ENV.private.ps1 beside this template.
# Run PUBLIC-RELEASE-GATE-COMMANDS.ps1 after the private copy is complete.
