# OpenClaw Studio V1 实施计划

## 项目目标

构建一个独立的 OpenClaw Studio 桌面程序，聚合 OpenClaw 启动与状态、Sessions、Agents、Codex 工作台、Skills / Tools / MCP、Dashboard、Settings，并逐步进入更完整的桌面化操作与审阅工作流。

## 交付目录

- 工作项目目录：`/home/qz057/.openclaw/workspace/openclaw-studio`
- 正式交付目录：`E:\下载\openclaw studio`

## 技术路线

- Electron + React + TypeScript + Vite
- 桌面壳 / Bridge / Runtime / UI 四层结构
- OpenClaw 负责规划、验收、路由、收口
- Codex 负责项目目录内真实实现与最小验证

## 实施原则

1. 先打通主链路，再扩能力层。
2. 每个阶段完成后必须做最小可运行验证。
3. 一旦有报错、构建失败或明显回退，先修再进下一步。
4. host/runtime 边界必须先清晰表达，再考虑任何真实执行能力。
5. 在 approval / rollback / lifecycle 未成型前，不开启真实 host-side execution。

## 已完成阶段

### Phase 1
- Monorepo / workspace 基础结构
- Electron main + preload
- React renderer 壳
- Home / Sessions / Codex 基础页
- packages/shared 与 packages/bridge 基础 contract
- 基础 mock 数据链路

### Phase 2
- Dashboard / Agents / Skills / Settings 主视图补齐
- 关键页面可导航
- 基础 shell contract 成型

### Phase 3
- system / sessions / dashboard / agents / codex / skills / tools & MCP 的最小 live bridge 接入
- hybrid runtime + fallback 路径可用

### Phase 18
- host/runtime boundary layer 首次成型
- `preview-host-*` 预览动作可见
- `execute-local-*` Studio-local 控制链路可用

### Phase 19
- shared boundary types 成型
- shell-level boundary summary 成型
- runtime detail / runtime action result 都携带 boundary payload
- Dashboard / Inspector / Skills detail 共用 boundary summary UI
- policy / blocked reasons / required preconditions / withheld execution plan / future executor slots 显式结构化
- smoke 已提升到验证 boundary contract，不再只看旧 detail/action section

### Phase 20（已完成）
- host executor IPC skeleton 已进入 shared/runtime contract
- `StudioApi` 与 Electron IPC 已补 `hostExecutorState` 通道
- boundary summary 已携带 `hostExecutor`
- host executor skeleton 当前包含：intents / lifecycle / mutation slots / approval / audit / rollback / failure taxonomy
- BoundarySummaryCard 已能看到 host executor skeleton、approval/audit/rollback、slot contract
- smoke 已提升到验证 host executor contract，不再只停在 phase19 boundary collections

### Phase 21（已完成）
- default-disabled host bridge skeleton 已进入 shared/runtime/Electron contract
- `StudioApi` 与 Electron IPC 已补 `hostBridgeState` / `hostPreviewHandoff` 通道
- Electron main 已注册 slot-level placeholder handlers，但仍然只返回 disabled placeholder result
- host preview 现在可映射到 slot / validation / approval / audit / rollback placeholder state
- slot-level placeholder result 现在携带 audit correlation / rollback disposition / failure taxonomy linkage
- richer blocked / abort / partial-apply / rollback-required simulation 已进入 preview-host flow
- smoke 已提升到验证 host bridge skeleton 与 preview → slot handoff placeholder flow

### Phase 22（已完成）
- slot handler placeholder result 已升级为更完整的 simulated outcomes，而不是只停在 summary 追加
- simulated outcome coverage 现在至少包含 `blocked` / `abort` / `partial-apply` / `rollback-required` / `rollback-incomplete`
- preview-host action result 与 direct handoff 现在共用同一套 simulated slot dispatch
- smoke 已提升到验证 richer failure-path、simulated outcomes、trace phase 与 outcome coverage
- Skills detail UI 现在可最小但清晰地看到 `preview → slot → result → rollback disposition` trace
- boundary summary 现在可见 bridge simulated outcome coverage

### Phase 23（已完成）
- slot / preview / result / rollback 现在有更明确的 slot-state timeline 表达，而不是只靠散落 detail lines
- Inspector 右侧现在集中显示 trace focus、current slot / handler / validator state、rollback posture、audit posture
- Skills 动作结果现在有 dedicated trace panel，同时保留 simulated / placeholder / disabled flow 边界
- runtime host boundary result 现在显式带出 `slot-state` / `dispositions` / `slot roster` / `timeline` section
- smoke 已提升到验证 Inspector richer surfacing、slot-linked validator contract、timeline / roster / disposition section 可见性
- package snapshot / README / HANDOFF 已同步反映 phase23 reality

### Phase 24（已完成）
- shell/runtime/shared contract 现在显式带出 `trace.focusSlotId`、slot roster、focused-slot posture，而不只是 timeline 总览
- Inspector、Dedicated Trace Panel、Bottom Dock 现在可以围绕具体 slot 切换 focus，并同步显示 handler / validator / result / rollback posture
- host preview action result 现在显式带出 `host-bridge-focus` section，slot roster 也会标记 active focus slot
- smoke 已提升到验证 per-slot focus / dock-inspector linkage / finer-grained trace contract
- package snapshot / README / HANDOFF 已同步反映 phase24 reality

### Phase 25（已完成）
- focused slot 现在不只驱动 trace panel / inspector / dock，还会驱动 Dashboard / Home / Skills 的页面级摘要、highlight、focus context 与 secondary panels
- renderer 现在提供更清晰的 focused-slot filter chips / focus pills / quick toggle controls，用户可更快看到当前 focus 范围并切到其他 slot
- focused slot 现在通过轻量 localStorage persistence 在页面刷新、页面切换、以及面板来回切换后尽量保持
- smoke 已提升到验证 phase25 focused-slot page interactions / persistence markers / quick-focus controls
- package snapshot / README / HANDOFF 已同步反映 phase25 reality

### Phase 26（已完成）
- 当前 alpha shell packaging 已从平铺 snapshot 升级为更结构化的 phase26 release skeleton
- `package:alpha` 现在输出 `artifacts/renderer`、`artifacts/electron`、`release/`、`scripts/` 结构，而不是只复制平铺 dist
- 新增 `release/RELEASE-MANIFEST.json`
- 新增 `release/BUILD-METADATA.json`
- 新增 `release/INSTALLER-PLACEHOLDER.json`
- 新增 `release/RELEASE-CHECKLIST.md`
- 新增 `scripts/install-placeholder.cjs` explain-only placeholder pipeline
- 新增 `npm run release:plan` dry-run release skeleton script
- smoke 已提升到验证 phase26 packaging / release skeleton contract，不再只看 UI 与 bridge surface
- README / HANDOFF / package snapshot 已同步反映 phase26 reality，并明确写出当前能交付什么、还没交付什么、正式 installer 仍缺什么

### Phase 27（已完成）
- 当前 shell 已补 route-aware `Command Palette` + `Quick Actions`
- 命令面当前只覆盖安全范围内动作：导航、focused-slot scope、inspect、preview posture、layout toggle、window intent staging
- shell 现在通过轻量 `localStorage` 持久化 right rail、bottom dock、compact mode、selected tab、workspace view
- 当前 shell 已显式带出 `workspace views`、`window intents`、`detached panel placeholders`
- multi-window 目前只做产品结构与 contract readiness，不做真实外部窗口编排
- smoke 已提升到验证 phase27 command surface / layout persistence / multi-window foundation contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase27 reality

### Phase 35（当前已完成）
- phase33 的 formal-release skeleton 已继续下沉成更明确的 pre-release bundle layer
- release skeleton 现在补齐 BUNDLE-MATRIX / BUNDLE-ASSEMBLY / SIGNING-METADATA / NOTARIZATION-PLAN / RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES
- shell 现在补齐 Bundle Assembly Skeleton / Signing-ready Metadata / Release Promotion Gating 可见性
- package snapshot 现在具备 bundle / notarization / release-notes / publish-gates skeleton，但仍不做真实 installer / publish
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase35 bundle assembly skeleton / signing-ready metadata / release promotion gating contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase35 reality

### Phase 40（已完成）
- phase39 的 formal-release skeleton 已继续下沉成更明确的 packaged-app bundle sealing / installer channel routing / signing-publish promotion handshake layer
- release skeleton 现在补齐 PACKAGED-APP-BUNDLE-SEALING-SKELETON / INSTALLER-CHANNEL-ROUTING / SIGNING-PUBLISH-PROMOTION-HANDSHAKE
- shell 现在补齐 Packaged-app Bundle Sealing Skeleton / Installer Channel Routing / Signing-publish Promotion Handshake 可见性
- package snapshot 现在具备 packaged-app bundle sealing skeleton / installer channel routing / signing-publish promotion handshake，但仍不做真实 installer / approval / publish
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase40 packaged-app bundle sealing skeleton / installer channel routing / signing-publish promotion handshake contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase40 reality

### Phase 43（当前已完成）
- phase42 的 formal-release skeleton 已继续下沉成更明确的 attestation verification packs / promotion apply manifests / rollback execution rehearsal ledger layer
- release skeleton 现在补齐 ATTESTATION-VERIFICATION-PACKS / PROMOTION-APPLY-MANIFESTS / ROLLBACK-EXECUTION-REHEARSAL-LEDGER
- shell 现在补齐 Attestation Verification Packs / Promotion Apply Manifests / Rollback Execution Rehearsal Ledger 可见性
- package snapshot 现在具备 attestation verification packs / promotion apply manifests / rollback execution rehearsal ledger，但仍不做真实 installer / approval / publish / rollback execution
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase43 attestation verification packs / promotion apply manifests / rollback execution rehearsal ledger contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase43 reality

### Phase 44（当前已完成）
- phase43 的 formal-release skeleton 已继续下沉成更明确的 attestation apply audit packs / promotion execution checkpoints / rollback operator drillbooks layer
- release skeleton 现在补齐 ATTESTATION-APPLY-AUDIT-PACKS / PROMOTION-EXECUTION-CHECKPOINTS / ROLLBACK-OPERATOR-DRILLBOOKS
- shell 现在补齐 Attestation Apply Audit Packs / Promotion Execution Checkpoints / Rollback Operator Drillbooks 可见性
- package snapshot 现在具备 attestation apply audit packs / promotion execution checkpoints / rollback operator drillbooks，但仍不做真实 installer / approval / publish / promotion execution / rollback operator execution
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase44 attestation apply audit packs / promotion execution checkpoints / rollback operator drillbooks contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase44 reality

### Phase 45（当前已完成）
- phase44 的 formal-release skeleton 已继续下沉成更明确的 attestation apply execution packets / promotion operator handoff rails / rollback live-readiness contracts layer
- release skeleton 现在补齐 ATTESTATION-APPLY-EXECUTION-PACKETS / PROMOTION-OPERATOR-HANDOFF-RAILS / ROLLBACK-LIVE-READINESS-CONTRACTS
- shell 现在补齐 Attestation Apply Execution Packets / Promotion Operator Handoff Rails / Rollback Live-readiness Contracts 可见性
- package snapshot 现在具备 attestation apply execution packets / promotion operator handoff rails / rollback live-readiness contracts，但仍不做真实 installer / approval / publish / attestation apply execution / promotion handoff execution / rollback live entry
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase45 attestation apply execution packets / promotion operator handoff rails / rollback live-readiness contracts contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase45 reality

### Phase 46（当前已完成）
- phase45 的 formal-release skeleton 已继续下沉成更明确的 attestation operator worklists / promotion staged-apply ledgers / rollback cutover readiness maps layer
- release skeleton 现在补齐 ATTESTATION-OPERATOR-WORKLISTS / PROMOTION-STAGED-APPLY-LEDGERS / ROLLBACK-CUTOVER-READINESS-MAPS
- shell 现在补齐 Attestation Operator Worklists / Promotion Staged-apply Ledgers / Rollback Cutover Readiness Maps 可见性
- package snapshot 现在具备 attestation operator worklists / promotion staged-apply ledgers / rollback cutover readiness maps，但仍不做真实 installer / approval / publish / operator dispatch / staged apply / rollback cutover
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase46 attestation operator worklists / promotion staged-apply ledgers / rollback cutover readiness maps contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase46 reality

### Phase 47（当前已完成）
- phase46 的 formal-release skeleton 已继续下沉成更明确的 attestation operator dispatch manifests / promotion staged-apply runsheets / rollback cutover handoff plans layer
- release skeleton 现在补齐 ATTESTATION-OPERATOR-DISPATCH-MANIFESTS / PROMOTION-STAGED-APPLY-RUNSHEETS / ROLLBACK-CUTOVER-HANDOFF-PLANS
- shell 现在补齐 Attestation Operator Dispatch Manifests / Promotion Staged-apply Runsheets / Rollback Cutover Handoff Plans 可见性
- package snapshot 现在具备 attestation operator dispatch manifests / promotion staged-apply runsheets / rollback cutover handoff plans，但仍不做真实 installer / approval / publish / operator dispatch execution / staged apply execution / rollback cutover handoff
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase47 attestation operator dispatch manifests / promotion staged-apply runsheets / rollback cutover handoff plans contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase47 reality

### Phase 48（当前已完成）
- phase47 的 formal-release skeleton 已继续下沉成更明确的 attestation operator dispatch packets / promotion staged-apply command sheets / rollback cutover execution checklists layer
- release skeleton 现在补齐 ATTESTATION-OPERATOR-DISPATCH-PACKETS / PROMOTION-STAGED-APPLY-COMMAND-SHEETS / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS
- shell 现在补齐 Attestation Operator Dispatch Packets / Promotion Staged-apply Command Sheets / Rollback Cutover Execution Checklists 可见性
- package snapshot 现在具备 attestation operator dispatch packets / promotion staged-apply command sheets / rollback cutover execution checklists，但仍不做真实 installer / approval / publish / operator packet dispatch / staged command issue / rollback cutover execution
- 全部仍然保持 `local-only`，不做真实 host-side execution 或系统级窗口操作
- smoke 已提升到验证 phase48 attestation operator dispatch packets / promotion staged-apply command sheets / rollback cutover execution checklists contract 与 renderer markers
- README / HANDOFF / package snapshot 已同步反映 phase48 reality

## 当前明确边界

当前只允许：

- runtime-backed read-only inspection
- dry-run / preview / simulate
- Studio-local execute（只改应用内 in-memory state/history）
- phase27 command surface / layout persistence / window intent staging
- phase48 attestation operator dispatch packets / promotion staged-apply command sheets / rollback cutover execution checklists
- phase26/27/28 release skeleton / artifact review / handoff docs / package metadata

当前明确禁止：

- 写入 `~/.openclaw`
- 改 install / config / services
- 启动真实 external connector processes
- 开启真实 host-side attach / activate / apply

## 当前验收标准

以下命令必须通过：

```bash
npm run typecheck
npm run build
npm run smoke
npm run start:smoke
npm run package:alpha
```

phase48 可额外跑：

```bash
npm run release:plan
```

## 下一阶段（建议）

### Phase 49
目标：在不开放危险执行的前提下，继续把 phase48 foundations 推进为更完整的产品能力与交付链路。

范围建议：
- 更深的 Inspector / command depth / trace drill-down
- 更真实的 multi-window orchestration 与跨窗口共享状态
- 把当前 skeleton 继续推进为 executable review-only attestation operator packet issuance / promotion staged-apply confirmation / rollback cutover checklist execution / release approval pipeline
- 在 approval / lifecycle / rollback 真实闭环前继续提升 observability，而不是开启真实 host-side execution

### 后续阶段
- Inspector 深化
- Command Palette depth
- 多窗口编排 / 跨窗口共享状态
- 真正的 installer builder / signing / publish automation

## 当前执行要求

后续继续推进时，默认按这条顺序：

1. 先补 contract
2. 再补 UI 可见性
3. 再补 smoke / doctor / delivery 文档
4. 最后才考虑开启任何新的执行面
