# Phase 5 Runtime Gateway Closeout - 2026-04-26

## Scope

Phase 5 continued from the Phase 4 release boundary and closed the runtime gateway risk:

- Reproduced OpenClaw/Hermes WSL gateway status behavior with bounded `timeout` probes.
- Confirmed Hermes systemd gateway is running.
- Confirmed OpenClaw Gateway now reports RPC reachable on `ws://127.0.0.1:18789`.
- Updated OpenClaw gateway probe text so RPC auth/config failures are actionable instead of vague.
- Updated Hermes runtime state to read WSL `~/.hermes` from Windows/Electron instead of the Windows home directory.
- Confirmed Hermes state now sees WSL auth, sessions, events, and gateway filesystem state.

## Changed Files

- `apps/studio/electron/runtime/probes/gateway-services.ts`
- `apps/studio/electron/runtime/probes/hermes.ts`
- `delivery/openclaw-studio-rc-manifest-20260426.md`
- `delivery/phase4-runtime-closeout-20260426.md`
- `delivery/phase5-runtime-gateway-closeout-20260426.md`

## Runtime Evidence

Direct built-runtime probe after the changes:

```json
{
  "openclawGateway": {
    "running": true,
    "statusLabel": "Gateway 已运行",
    "detail": "RPC 可达 · ws://127.0.0.1:18789"
  },
  "hermesGateway": {
    "running": true,
    "statusLabel": "Gateway 已运行"
  },
  "hermesState": {
    "source": "runtime",
    "availability": "disconnected",
    "canConnect": true,
    "disabledReason": null,
    "endpoint": "WSL Hermes gateway",
    "transportLabel": "WSL gateway / filesystem",
    "authLabel": "已检测到认证",
    "events": 3
  },
  "hermesSessions": {
    "success": true,
    "count": 50
  }
}
```

## Verification

```powershell
npm run -C "E:\claucd\界面控制台程序\apps\studio" typecheck
npm run -C "E:\claucd\界面控制台程序\apps\studio" test
npm run -C "E:\claucd\界面控制台程序\apps\studio" build
npm run -C "E:\claucd\界面控制台程序\apps\studio" smoke
node "E:\claucd\界面控制台程序\.tmp\visual-check.mjs"
npm run -C "E:\claucd\界面控制台程序\apps\studio" dist:win
npm run -C "E:\claucd\界面控制台程序\apps\studio" package:smoke
npm run -C "E:\claucd\界面控制台程序\apps\studio" phase4:rc-smoke
```

Results:

- Typecheck: passed.
- Tests: 8 files passed, 74 tests passed.
- Build: passed.
- Smoke: passed; Electron runtime stayed `bridge=hybrid`, `runtime=ready`, `sessions=3`, `codexTasks=6`.
- Visual matrix: 36 checks passed, 0 failures.
- `dist:win`: passed.
- `package:smoke`: passed; packaged app stayed alive for 20000ms.
- `phase4:rc-smoke`: passed; zip extraction, first launch, shutdown, and restart verified.

## Current Artifacts

| Artifact | Path | Size | SHA256 |
|---|---|---:|---|
| Windows zip | `apps/studio/release/OpenClaw Studio-0.1.0-win-x64.zip` | 141182170 bytes | `337330D8DE49DD98E5833B54F39D4BAF34CD14A76CF9C054171FAA9B70D8BB7B` |
| Unpacked exe | `apps/studio/release/win-unpacked/OpenClaw Studio.exe` | 222973952 bytes | `BD316F0BF9DC12DDF592074E000BE68466C950D2164E920AD8F332B8824D4EAB` |
| RC smoke report | `delivery/phase4-rc-smoke-20260426.json` | - | latest generated report |

## Release Decision

Phase 5 removes the current machine's runtime gateway blocker. The next engineering phase can enter installer/signing/portable packaging, with one explicit prerequisite: target machines must have WSL Ubuntu `~/.openclaw` and `~/.hermes` paths available or set `OPENCLAW_STUDIO_HERMES_ROOT` for non-default layouts.
