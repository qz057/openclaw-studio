# OpenClaw Studio

OpenClaw Studio 是一个基于 Electron + React + TypeScript 的 OpenClaw 桌面工作台。当前仓库已经进入 **phase43 attestation verification packs / promotion apply manifests / rollback execution rehearsal ledger** 阶段：真实 host-side execution 仍然保持关闭，但在 phase25/26/27/28/29/30/31/32/33 的 focused-slot、preview → slot handoff、slot-level simulated outcomes、release skeleton、command surface、layout persistence、window deepening、workflow lane 与 orchestration board 基础上，shell 已在 phase42 的 integrity attestation evidence / promotion apply readiness / rollback recovery ledger 之上，进一步下沉出 attestation verification packs、promotion apply manifests 与 rollback execution rehearsal ledger metadata。

## 当前已验证范围

- Electron 主进程 + preload + renderer 桌面壳
- 主视图：`Dashboard` / `Home` / `Sessions` / `Agents` / `Codex` / `Skills / Tools / MCP` / `Settings`
- `packages/shared` 中的共享 typed contract
- `packages/bridge` 中的 renderer bridge helpers
- 混合运行时（hybrid runtime）能力：
  - live system status probes
  - live sessions / dashboard / agents / codex / skills / tools & MCP probes（可用时）
  - probes 不可用时的 typed fallback
- Tools / MCP 深化能力：
  - runtime-backed detail drill-down
  - no-side-effect `probe / list / rescan`
  - control-adjacent `test / validate`
  - connector-oriented `test / list`
  - `dry-run / preview / simulate`
  - `dry-run` connect / attach / activate / apply 计划链路
  - `execute-local-*` Studio-local 控制动作，仅改应用内 in-memory state/history
  - `preview-host-*` host/runtime 预览动作，只展示被阻断的真实执行路径，不触碰 host
- **phase25 disabled host bridge skeleton + focused-slot surface**：
  - shared boundary types
  - shell-level boundary summary
  - detail/action result boundary payloads
  - Dashboard / Inspector / Skills detail 共用的 boundary UI
  - policy / blocked reasons / required preconditions / withheld execution plan / future executor slots
  - default-disabled host bridge state
  - slot-level bridge placeholder handlers
  - slot-level simulated outcome matrix
  - typed preview-to-slot handoff validators
  - approval request/result shape + placeholder decision linkage
  - audit event envelope + audit correlation linkage
  - rollback context + staged rollback plan + rollback disposition linkage
  - failure taxonomy + lifecycle stages + blocked / abort / partial-apply / rollback-required placeholder simulation
  - rollback-incomplete placeholder follow-up outcome
  - preview → slot → result → rollback disposition trace visibility
  - slot-state timeline / staged progression / slot roster expression
  - per-slot focused state switching（timeline / trace panel / inspector）
  - Inspector richer surfacing for current focus slot / handler / validator / rollback / audit posture
  - bottom dock / inspector / trace panel linkage
  - dedicated trace panel for preview → slot → result → rollback flow
  - Dashboard / Home / Skills page-level focused-slot summaries / highlights / secondary context
  - quick filter chips / focus pills / fast slot switching controls
  - focused-slot localStorage persistence across refresh / page switches / panel switches
  - finer-grained trace focus contract and smoke coverage
- **phase26 delivery / packaging skeleton**：
  - `artifacts/renderer` + `artifacts/electron` 的更清晰 package layout
  - `release/RELEASE-MANIFEST.json`
  - `release/BUILD-METADATA.json`
  - `release/INSTALLER-PLACEHOLDER.json`
  - `release/RELEASE-CHECKLIST.md`
  - `scripts/install-placeholder.cjs` explain-only placeholder pipeline
  - `npm run release:plan` dry-run release surface
  - smoke 对 release skeleton contract 的静态校验
- **phase27 product foundations**：
  - route-aware `Command Palette` + `Quick Actions`
  - 安全范围内的导航 / focus / inspect / preview 命令动作
  - `localStorage` 驱动的 right rail / bottom dock / compact mode / selected tab / workspace view 持久化
  - `workspace views` / `window intents` / `detached panel placeholders`
  - multi-window foundation 只做 shell contract readiness，不做真实外部窗口编排
- **phase35/36 formal-release deepening**：
  - phase35 已补齐 BUNDLE-MATRIX / BUNDLE-ASSEMBLY / SIGNING-METADATA / NOTARIZATION-PLAN / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES
  - phase37 已补齐 PACKAGED-APP-MATERIALIZATION-SKELETON / INSTALLER-TARGET-BUILDER-SKELETON / SIGNING-PUBLISH-PIPELINE
  - phase39 已补齐 PACKAGED-APP-STAGED-OUTPUT-SKELETON / INSTALLER-BUILDER-ORCHESTRATION / SIGNING-PUBLISH-APPROVAL-BRIDGE
  - phase40 已补齐 PACKAGED-APP-BUNDLE-SEALING-SKELETON / INSTALLER-CHANNEL-ROUTING / SIGNING-PUBLISH-PROMOTION-HANDSHAKE
  - phase42 已补齐 INTEGRITY-ATTESTATION-EVIDENCE / PROMOTION-APPLY-READINESS / ROLLBACK-RECOVERY-LEDGER
  - phase43 已补齐 ATTESTATION-VERIFICATION-PACKS / PROMOTION-APPLY-MANIFESTS / ROLLBACK-EXECUTION-REHEARSAL-LEDGER
  - package snapshot 现在带 per-platform bundle skeleton、packaged-app materialization skeleton、packaged-app directory materialization、packaged-app bundle sealing skeleton、sealed-bundle integrity contract、integrity attestation evidence、attestation verification packs、installer builder execution skeleton、installer channel routing、channel promotion evidence、promotion apply manifests、signing-publish gating handshake、publish rollback handshake、rollback execution rehearsal ledger、release approval workflow、release notes 与 publish gating
  - main shell 里的 Formal Release Readiness 卡片已同步反映 packaged-app materialization / packaged-app directory materialization / packaged-app bundle sealing / attestation verification packs / promotion apply manifests / rollback execution rehearsal posture
  - 全部仍然保持 `local-only`，不做真实 host-side execution

## 当前边界结论

当前系统明确分成 4 层：

1. **local-only**
   - 允许 Studio-local root select / bridge stage / connector activate / lane apply
   - 只改应用内内存状态和执行历史
2. **preview-host**
   - 允许展示 host/runtime 真实动作如果将来开放会怎么执行
   - 显示 blocker、policy、preconditions、future slots
3. **withheld**
   - 当前真实 host-side execution 明确阻断
4. **future-executor**
   - 未来真实 executor 所需 contract / slot 已命名，但未接线

当前**禁止**：

- 写入 `~/.openclaw`
- 修改 services / installs / configs
- 启动真实 external connector processes
- 开启真实 host-side attach / activate / apply

## 工作区结构

```text
apps/studio        Electron app, preload, runtime scaffold, renderer UI, packaging scripts
packages/shared    Shared contracts, mock shell state, channel names
packages/bridge    Renderer-facing bridge helpers
delivery           Alpha shell delivery snapshot outputs
```

## 环境要求

- Node.js 20+
- npm 10+ 或 pnpm 10+
- Electron 作为 optional dependency 安装在 workspace 中

## 安装

```bash
npm install
```

也可使用：

```bash
pnpm install
```

## 验证命令

从仓库根目录运行：

```bash
npm run typecheck
npm run build
npm run smoke
npm run start:smoke
npm run package:alpha
```

phase43 额外提供一个只读 dry-run：

```bash
npm run release:plan
```

### `npm run smoke` 当前验证内容

- renderer build 产物与 asset 引用
- bridge fallback snapshot
- Electron runtime shell state
- shell-level boundary contract 是否完整
- host executor contract 是否完整（intents / lifecycle / failure taxonomy / mutation slots / approval/audit/rollback fields）
- host bridge skeleton 是否完整（validators / slot handlers / default-disabled posture / trace focus roster）
- runtime detail/action 的 boundary payload 是否完整
- host preview action 是否包含完整 boundary sections
- host preview → slot handoff placeholder flow 是否完整（preview/handoff mapping、validation、approval、audit、rollback、slot result）
- slot handler simulated outcome coverage 是否包含 blocked / abort / partial-apply / rollback-required / rollback-incomplete
- host handoff trace 是否显式包含 preview / slot / result / rollback phase
- Inspector / dock 是否与当前 focus slot 同步
- renderer bundle 是否显式包含 phase25 focused-slot markers，以及 phase38 packaged-app directory materialization / installer builder execution / signing-publish gating handshake markers，外加 phase43 attestation verification packs / promotion apply manifests / rollback execution rehearsal ledger markers
- host preview action 是否显式暴露 focus / slot-state / disposition / slot roster / timeline section
- local connector controls 是否仍保持 local-only 行为
- startup preflight 是否 ready
- phase43 release skeleton contract 是否完整（layout / docs / manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged-app directory materialization / packaged-app materialization skeleton / packaged-app staged output skeleton / packaged-app bundle sealing skeleton / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / installer targets / installer builder execution skeleton / installer-target builder skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / signing metadata / notarization plan / signing-publish gating handshake / signing-publish pipeline / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / release approval workflow / release notes / publish gates / promotion gates / release summary / installer placeholder / release checklist）
- shell state 是否显式包含 action groups / sequences / contextual flows / keyboard routing / workflow posture / orchestration board / pre-release bundle pipeline contract

### `npm run start:smoke`

- 走真实 `npm start` 链路
- 保持一段时间后主动清理
- 证明真实启动链路存活，而不是只验证源码或静态构建
- 在当前这类受限 Linux sandbox 中，如果 Electron 已到达启动路径但 Chromium sandbox host 被容器拦截，会以 sandbox-limited fallback 通过并明确标注原因

### `npm run release:plan`

- 只做 phase43 release skeleton dry-run 汇总
- 不写安装器
- 不发布 artifact
- 适合先检查 manifest / metadata / installer placeholder 契约是否成型

## 启动

```bash
npm run start
```

说明：

- 会先做 build / Electron / display preflight
- Linux / WSL 下会尽量自动推断 WSLg 环境
- 如果 Electron optional dependency 未装，会明确提示下一步

## 打包快照

```bash
npm run package:alpha
```

输出目录：

- `delivery/openclaw-studio-alpha-shell`

输出结构：

```text
delivery/openclaw-studio-alpha-shell/
  README.md
  HANDOFF.md
  IMPLEMENTATION-PLAN.md
  PACKAGE-README.md
  artifacts/
    renderer/
    electron/
  release/
    BUILD-METADATA.json
    RELEASE-MANIFEST.json
    REVIEW-MANIFEST.json
    BUNDLE-MATRIX.json
    BUNDLE-ASSEMBLY.json
    PACKAGED-APP-DIRECTORY-SKELETON.json
    PACKAGED-APP-MATERIALIZATION-SKELETON.json
    PACKAGED-APP-DIRECTORY-MATERIALIZATION.json
    PACKAGED-APP-STAGED-OUTPUT-SKELETON.json
    PACKAGED-APP-BUNDLE-SEALING-SKELETON.json
    SEALED-BUNDLE-INTEGRITY-CONTRACT.json
    INTEGRITY-ATTESTATION-EVIDENCE.json
    ATTESTATION-VERIFICATION-PACKS.json
    INSTALLER-TARGETS.json
    INSTALLER-TARGET-BUILDER-SKELETON.json
    INSTALLER-BUILDER-EXECUTION-SKELETON.json
    INSTALLER-BUILDER-ORCHESTRATION.json
    INSTALLER-CHANNEL-ROUTING.json
    CHANNEL-PROMOTION-EVIDENCE.json
    PROMOTION-APPLY-READINESS.json
    PROMOTION-APPLY-MANIFESTS.json
    SIGNING-METADATA.json
    NOTARIZATION-PLAN.json
    SIGNING-PUBLISH-PIPELINE.json
    SIGNING-PUBLISH-GATING-HANDSHAKE.json
    SIGNING-PUBLISH-APPROVAL-BRIDGE.json
    SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json
    PUBLISH-ROLLBACK-HANDSHAKE.json
    ROLLBACK-RECOVERY-LEDGER.json
    ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json
    RELEASE-APPROVAL-WORKFLOW.json
    RELEASE-NOTES.md
    PUBLISH-GATES.json
    PROMOTION-GATES.json
    RELEASE-SUMMARY.md
    INSTALLER-PLACEHOLDER.json
    RELEASE-CHECKLIST.md
  scripts/
    install-placeholder.cjs
```

这是一个 **phase43 alpha-shell release skeleton**，不是正式 installer。

它用于：

- artifact review
- handoff
- release contract 审阅
- 交付快照归档

## 当前能交付什么

- 可运行的 Electron + renderer 构建产物快照
- 当前 README / HANDOFF / IMPLEMENTATION-PLAN 文档闭环
- release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged-app directory materialization / packaged-app materialization skeleton / packaged-app staged output skeleton / packaged-app bundle sealing skeleton / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / installer targets / installer builder execution skeleton / installer-target builder skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / signing metadata / notarization plan / signing-publish gating handshake / signing-publish pipeline / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / release approval workflow / release notes / publish gates / promotion gates / release summary / installer placeholder / checklist
- disabled host bridge + focused-slot UI + trace surface + phase38 packaged-app directory materialization / installer builder execution skeleton / signing-publish gating handshake，以及 phase43 attestation verification packs / promotion apply manifests / rollback execution rehearsal ledger 的验证后快照

## 当前还没交付什么

- OS-specific packaged app bundle
- 可安装到系统目录的 installer
- 签名 / notarization / upload / release publish 自动化
- 任何真实 host-side execution 或真实 host mutation
- 真实多窗口编排 / detached native window management

## 正式 installer 仍缺什么

- 每平台 Electron app directory 实体化、bundle sealing 与 staged output apply 步骤
- Windows / macOS / Linux installer builder execution wiring、channel routing、command/env/output 接线与命名规范
- 签名、notarization、checksum、artifact publish 与 upload apply
- executable signing-publish gating handshake / signing-publish promotion handshake / publish rollback handshake / release approval handshake / channel promotion / rollback-ready publish pipeline
- 在 approval / lifecycle / rollback 真正闭环前，仍然不能把 host-side execution 混入 installer 交付

## 当前限制

- 真实 host-side execution 仍然**明确关闭**
- host bridge skeleton 已存在，但仍然是 **default-disabled simulated placeholder flow**，不会执行任何真实 host mutation
- release approval workflow、installer channel routing、channel promotion evidence、publish rollback handshake 与 signing-publish handshakes 现在都已具备 metadata contract，但仍然不会触发真实审批、签名、发布、回滚、路由或安装
- live approval handshake / lifecycle runner / rollback-aware apply 仍未落地为可执行能力
- 当前 package 已具备更正式的 release skeleton，但仍然不是正式安装器，也不会执行任何安装动作
- Codex 任务状态仍然是基于本地日志的启发式读取，不是正式 task API
- Session 标题仍然有启发式成分
- focused slot 现已能驱动 Dashboard / Home / Skills 的页面级摘要、quick filters 与轻量 persistence，但仍然只是 simulated / placeholder / disabled flow
- 当前多窗口虽然已具备 detached workspace behavior / staged intent / posture 联动，但仍然不包含真实窗口编排、系统级窗口操作或 host 级控制

## 下一步更自然的方向

- 在保持 disabled 的前提下继续加深 bridge observability / validator coverage / failure-path coverage / command-surface depth
- 在 approval / lifecycle / rollback 具备真实能力前，仍然不要开启 host-side execution
- 把当前 release skeleton 继续推进成真正的 sealed-bundle integrity attestation / channel promotion evidence apply / publish rollback execution / release approval pipeline
- 在当前 shell contract 基础上再推进真实多窗口编排与跨窗口共享状态
