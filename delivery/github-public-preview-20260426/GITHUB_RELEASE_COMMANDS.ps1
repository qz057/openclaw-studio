$ErrorActionPreference = 'Stop'
$Owner = '<github-owner>'
$Repo = '<github-repo>'
$Tag = 'v0.1.0-preview.4'
$Notes = 'E:\claucd\界面控制台程序\delivery\github-public-preview-20260426\RELEASE_NOTES_v0.1.0-preview.4.md'

gh auth status
git status --short
git tag $Tag
git push origin $Tag
gh release create $Tag `
  --repo "$Owner/$Repo" `
  --title "OpenClaw Studio v0.1.0 Preview 4" `
  --notes-file $Notes `
  --prerelease `
  "E:\claucd\界面控制台程序\apps\studio\.packaging\windows-installer\out\OpenClaw-Studio-0.1.0-win-x64-setup.exe" `
  "E:\claucd\界面控制台程序\apps\studio\.packaging\windows-local\out\OpenClaw-Studio-0.1.0-alpha-x64-portable.zip"
