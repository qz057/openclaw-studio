# OpenClaw Studio

OpenClaw Studio is an Electron + React + TypeScript desktop shell for OpenClaw operations. The current repository is an alpha scaffold focused on the Phase 1 baseline: desktop shell wiring, typed bridge contracts, and a renderer workspace with mock-backed views.

## Current Scope

- Electron main process and preload bridge
- React renderer shell with `Dashboard`, `Home`, `Sessions`, `Agents`, `Codex`, `Skills / Tools / MCP`, and `Settings`
- Shared typed contracts in `packages/shared`
- Renderer bridge helpers in `packages/bridge`
- Hybrid runtime path:
  - live system status probes where available
  - live sessions list from local OpenClaw session files where available
  - mock-safe fallback when runtime access is unavailable

## Workspace Layout

```text
apps/studio        Electron app, preload, runtime scaffold, renderer UI
packages/shared    Shared contracts, mock shell state, channel names
packages/bridge    Renderer-facing bridge helpers
```

## Requirements

- Node.js 20+ recommended
- npm 10+ or pnpm 10+
- Electron is installed as an optional dependency for the desktop start path

## Install

From the project root:

```bash
npm install
```

The repo is also configured as a workspace and declares `pnpm@10.32.1`, so `pnpm install` is also valid if preferred.

## Typecheck

Run all current Studio type checks from the root:

```bash
npm run typecheck
```

This checks:

- `packages/shared`
- `packages/bridge`
- renderer app TypeScript config
- Electron main/preload TypeScript config

## Build

Build packages, renderer, and Electron output from the root:

```bash
npm run build
```

Build output currently lands in:

- `packages/shared/dist`
- `packages/bridge/dist`
- `apps/studio/dist-renderer`
- `apps/studio/dist-electron`

## Start The Alpha Shell

Start the Electron desktop shell from the root:

```bash
npm run start
```

Notes:

- This performs a small preflight check and prints a clear error if the Electron optional dependency is not available in the environment.
- The current alpha primarily targets local smoke validation rather than a polished packaged desktop release.

## Alpha Validation Flow

The smallest practical verification for the current scaffold is:

```bash
npm run typecheck
npm run build
npm run smoke
npm run start
```

`npm run smoke` is an offline validation path for restricted environments. It verifies:

- renderer build output and asset references
- bridge fallback snapshot loading
- Electron mock runtime output loading from built artifacts

If full Electron runtime launch is not practical in the current environment, `typecheck` + `build` + `smoke` is the minimum safe validation baseline for this alpha scaffold.

## Known Limitations

- Electron is still an optional dependency, so `npm run start` requires a local Electron install in the workspace.
- The current live bridge is intentionally small and only covers basic shell status plus sessions list.
- Most non-session operational data is still mock-backed.
- Only the baseline desktop shell is implemented; advanced layout, docking, and inspector workflows are placeholders.
- No packaged installer or release pipeline is included yet.
- Runtime integrations should remain isolated from the renderer and be introduced gradually in later phases.
