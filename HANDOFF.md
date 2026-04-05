# OpenClaw Studio Alpha Handoff

## Snapshot

- 当前已验证里程碑：**phase40 packaged-app bundle sealing skeleton / installer channel routing / signing-publish promotion handshake + docs / smoke / package / release-plan / UI / shared data closeout**
- 当前主视图：
  - `Dashboard`
  - `Home`
  - `Sessions`
  - `Agents`
  - `Codex`
  - `Skills / Tools / MCP`
  - `Settings`
- 当前核心结论：
  - runtime-backed detail / dry-run / Studio-local controls 已可用
  - host/runtime preview contract 已显式化
  - phase25 focused-slot 页面交互、filter chips、persisted focus 继续保留
  - phase26 delivery 已升级为结构化 alpha-shell release skeleton
  - phase27 已补 route-aware command surface、layout persistence foundation、window intent / workspace view foundation
  - phase35 已把交付层继续下沉成 bundle assembly skeleton、signing-ready metadata、release notes 与 release promotion gating
  - phase37 已把交付层继续下沉成 packaged-app materialization skeleton、installer-target builder skeleton 与 signing-publish pipeline
  - phase39 已把交付层继续下沉成 packaged-app staged output skeleton、installer builder orchestration 与 signing-publish approval bridge
  - phase40 已把交付层继续下沉成 packaged-app bundle sealing skeleton、installer channel routing 与 signing-publish promotion handshake
  - 真实 host-side execution 仍被策略明确阻断

## Validation Baseline

从 repo root 运行：

```bash
npm run typecheck
npm run build
npm run smoke
npm run start:smoke
npm run package:alpha
```

phase40 额外 dry-run：

```bash
npm run release:plan
```

`npm run start` 依赖 workspace 内 Electron optional dependency；Linux / WSL 下可自动尝试推断 WSLg display 环境。

`npm run start:smoke` 是首选桌面启动验证链路：它跑真实 `npm start`，保持一段时间后再清理进程树，验证真实启动 survivability。

在当前这类受限 Linux sandbox 中，如果 Electron 已到达启动路径但 Chromium sandbox host 被容器拦截，`start:smoke` 会以 sandbox-limited fallback 通过并明确标注原因。

`npm run release:plan` 只输出 phase40 release skeleton 汇总，不会写 installer，也不会发布任何 artifact。

## Phase27/28/29/30/31/32/33 Shell Surface

- `Command Palette` + `Quick Actions`
- 安全范围内的导航 / focused-slot scope / inspect / preview 命令动作
- `localStorage` 驱动的 right rail / bottom dock / compact mode / selected tab / workspace view 持久化
- `workspace views` / `window intents` / `detached panel placeholders`
- detached workspace workflow：用户现在能看到 workspace entry / detached candidate / workflow posture / switch path
- window intents 现在具备 staged / focused / preview / shell link 之外，还补齐 workflow step / readiness / handoff posture
- command surface 现在具备 action groups / sequences / contextual flows / keyboard routing
- Dashboard / Home / Skills 会对当前 route / workflow lane / focused slot 给出一致的 recommended next actions
- inspector 与 windowing 现在补齐 route-aware drilldowns、recent command history、以及 Local Orchestration Board
- phase32 进一步补齐 Cross-view Coordination Matrix、Inspector-Command Linkage、Packaging Pipeline Depth
- phase33 进一步补齐 Package Matrix、Channel Manifest、Signing Plan、Publish Plan
- phase35 进一步补齐 Bundle Assembly、Signing Metadata、Notarization Plan、Release Notes、Publish Gates、Promotion Gates
- phase37 进一步补齐 Packaged-app Materialization Skeleton、Installer-target Builder Skeleton、Signing & Publish Pipeline
- phase39 进一步补齐 Packaged-app Staged Output Skeleton、Installer Builder Orchestration、Signing-publish Approval Bridge
- phase40 进一步补齐 Packaged-app Bundle Sealing Skeleton、Installer Channel Routing、Signing-publish Promotion Handshake
- 仍然不做真实外部窗口编排

## Phase25 Boundary Model

当前 boundary contract 已统一进入：

- shell state
- Inspector state
- runtime detail payload
- runtime action result payload
- Dashboard / Inspector / Skills detail UI

### 当前层级

1. `local-only`
   - 允许 `execute-local-root-select`
   - 允许 `execute-local-bridge-stage`
   - 允许 `execute-local-connector-activate`
   - 允许 `execute-local-lane-apply`
   - 所有动作只影响 Studio 内存态与执行历史
2. `preview-host`
   - 允许 `preview-host-root-connect`
   - 允许 `preview-host-bridge-attach`
   - 允许 `preview-host-connector-activate`
   - 允许 `preview-host-lane-apply`
   - 只返回 boundary / blockers / preconditions / future slots，不执行
3. `withheld`
   - 真实 host-side attach / activate / apply 仍被阻断
4. `future-executor`
   - executor slots 已命名，但未接线

### Boundary Summary 当前包含

- `policy`
- `progression`
- `capabilities`
- `blockedReasons`
- `requiredPreconditions`
- `withheldExecutionPlan`
- `futureExecutorSlots`
- `hostExecutor`

### Host Executor Skeleton 当前包含

- typed IPC channel / slot definitions
- default-disabled host bridge state
- slot-level placeholder handlers
- slot-level simulated outcomes
- preview-host → slot handoff placeholder flow
- typed handoff validators
- mutation intent model
- lifecycle stages
- approval request/result shapes
- audit event envelope
- rollback context + rollback stages
- failure taxonomy
- blocked / abort / partial-apply / rollback-required / rollback-incomplete placeholder simulation
- preview → slot → result → rollback disposition trace
- slot-state timeline / staged progression
- per-slot trace roster focus switching
- Dashboard / Home / Skills page-level focus summaries and secondary panels
- filter chips / focus pills / quick slot switching controls
- focused-slot localStorage persistence across refresh and page switches
- Inspector-focused current slot / handler / validator / rollback / audit surfacing
- bottom dock / inspector / trace panel linkage
- dedicated trace panel / slot roster surfacing

## Live Bridge Scope

- `system status/basic shell status`
- `sessions list`
- `dashboard + agents` live summary
- `codex` local session/task summary
- `skills inventory`
- `tools / MCP` local runtime probe

Tools / MCP 当前深度：

- typed read-only detail
- safe `probe / list / rescan`
- `test / validate`
- connector-oriented `test / list`
- `dry-run / preview / simulate`
- Studio-local execute
- preview-host contract surfaces

## Phase40 Delivery Skeleton

- `npm run package:alpha`
- 输出到：`delivery/openclaw-studio-alpha-shell`
- 这是 phase40 结构化 alpha-shell snapshot，不是 installer

### 当前能交付

- `artifacts/renderer` 与 `artifacts/electron` 构建产物快照
- `release/RELEASE-MANIFEST.json`
- `release/BUILD-METADATA.json`
- `release/INSTALLER-PLACEHOLDER.json`
- `release/REVIEW-MANIFEST.json`
- `release/BUNDLE-MATRIX.json`
- `release/BUNDLE-ASSEMBLY.json`
- `release/PACKAGED-APP-DIRECTORY-SKELETON.json`
- `release/PACKAGED-APP-MATERIALIZATION-SKELETON.json`
- `release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json`
- `release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json`
- `release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json`
- `release/INSTALLER-TARGETS.json`
- `release/INSTALLER-TARGET-BUILDER-SKELETON.json`
- `release/INSTALLER-BUILDER-EXECUTION-SKELETON.json`
- `release/INSTALLER-BUILDER-ORCHESTRATION.json`
- `release/INSTALLER-CHANNEL-ROUTING.json`
- `release/SIGNING-METADATA.json`
- `release/NOTARIZATION-PLAN.json`
- `release/SIGNING-PUBLISH-PIPELINE.json`
- `release/SIGNING-PUBLISH-GATING-HANDSHAKE.json`
- `release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json`
- `release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json`
- `release/RELEASE-APPROVAL-WORKFLOW.json`
- `release/RELEASE-NOTES.md`
- `release/PUBLISH-GATES.json`
- `release/PROMOTION-GATES.json`
- `release/RELEASE-SUMMARY.md`
- `release/RELEASE-CHECKLIST.md`
- `scripts/install-placeholder.cjs`
- packaged bundle skeleton / packaged-app materialization skeleton / packaged-app directory materialization / packaged-app bundle sealing skeleton / installer builder execution skeleton / installer channel routing / signing-publish gating handshake / signing-publish promotion handshake / release approval workflow / release notes & publish gating / persisted layout / detached workspace workflows / shell-level workflow UX
- 当前 README / HANDOFF / IMPLEMENTATION-PLAN / PACKAGE-README 文档闭环

### 当前仍未交付

- per-platform packaged app bundle
- 真实 installer
- signing / notarization / upload / channel publish automation
- 真实 host-side execution
- 真实多窗口编排 / detached native window management

### 正式 installer 仍缺

- Electron app directory 实体化、bundle sealing 与 staged output apply 步骤
- Windows / macOS / Linux installer builder execution wiring、channel routing、command/env/output 接线
- artifact signing / checksum / notarization / upload apply
- executable signing-publish gating handshake / signing-publish promotion handshake / release approval handshake / release publish / rollback-aware release pipeline
- approval / lifecycle / rollback 真实闭环后的 host execution enablement 评估

## Current Limitations

- 不写 `~/.openclaw`
- 不做 install / config / service 变更
- 不启动真实 external connector processes
- 不开放真实 host-side execution
- bridge 虽已存在，但仍然 default-disabled 且只返回 placeholder result
- placeholder result 带有 focused-slot page interactions、slot-state timeline、dock / inspector / trace panel 可见性与轻量 persistence，但仍然只是 simulated / traceable outcome，不代表真实 host 执行
- release approval workflow、installer channel routing 与 signing-publish handshakes 现在都存在 metadata contract，但 approval / publish / promotion 仍尚不存在可执行链路
- lifecycle runner 尚不存在
- rollback-aware apply 尚不存在
- package 已具备更清晰的 bundle-assembly + packaged-app materialization + packaged-app-directory materialization + packaged-app bundle sealing + installer builder execution skeleton + installer channel routing，但仍不是 release publish pipeline，也不是 installer
- 当前 multi-window 虽然已具备 detached workspace workflow、intent readiness/handoff 和 shell 联动，但仍然不带真实外部窗口控制

## Recommended Next Step

更自然的后续方向是：

1. 在保持 disabled 的前提下继续提升 validator / observability / command-surface / multi-window coverage
2. 只有在 approval / lifecycle / rollback 真实闭环成型后，才评估任何 live host execution
3. 把 phase40 shell foundations 继续推进成真正的多窗口编排与 packaged-app bundle sealing / installer channel routing / signing-publish promotion handshake / approval pipeline
