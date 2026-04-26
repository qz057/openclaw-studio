$ErrorActionPreference = 'Stop'
$privateEnv = Join-Path $PSScriptRoot 'SIGNING-ENV.private.ps1'
if (!(Test-Path -LiteralPath $privateEnv)) {
  throw 'Create SIGNING-ENV.private.ps1 from SIGNING-ENV.private.template.ps1 and fill the real signing inputs first.'
}
. $privateEnv
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase15:trusted-signing-intake
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase14:signing-bridge -- --require-public
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase8:installer-closeout
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase9:release-gate -- --require-public
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase10:signing-readiness -- --require-ready
