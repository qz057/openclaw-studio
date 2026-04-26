# Fill these values in a private shell. Do not commit real secrets.
# PFX file mode:
$env:WINDOWS_CODESIGN_CERT_FILE = 'C:\\path\\to\\trusted-code-signing-cert.pfx'
$env:WINDOWS_CODESIGN_CERT_PASSWORD = '<certificate-password>'

# Or installed certificate mode:
# $env:WINDOWS_CODESIGN_CERT_THUMBPRINT = '<thumbprint-from-Cert:\\CurrentUser\\My>'
# $env:WINDOWS_CODESIGN_CERT_SUBJECT = '<subject-fragment>'

$env:WINDOWS_CODESIGN_TIMESTAMP_URL = 'https://timestamp.digicert.com'

npm run -C "E:\claucd\界面控制台程序\apps\studio" phase15:trusted-signing-intake
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase14:signing-bridge -- --require-public
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate -- --require-public
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness -- --require-ready
