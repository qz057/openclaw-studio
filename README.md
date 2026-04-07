# OpenClaw Studio

OpenClaw Studio 是一个基于 Electron + React + TypeScript 的 OpenClaw 桌面工作台。当前仓库已经进入 **phase60 delivery-chain workspace / stage explorer / review flow ladder / acceptance reading queue / reviewer signoff board / signoff readiness queue / final review closeout / final verdict console / acceptance closeout timeline / final review settlement / pack closeout board / delivery coverage matrix / review-deck coverage routing / review-deck orchestration deck / command-surface action-deck coverage / review-surface coverage actions / review-surface navigator / review-surface multi-window coverage / typed companion review-path orchestration / sequence-aware companion review navigation / delivery-gate companion sequence switching / companion route-history memory / route replay board / replay scenario packs / screenshot-driven acceptance review pack / acceptance pass layer / screenshot pass records / capture review flow / proof-linked evidence bundle / acceptance evidence continuity / reviewer brief / proof bundle / product-review console polish / acceptance storyboard / evidence dossier / evidence trace lens / acceptance scoreboard / replay acceptance checklist / command-surface observability linkage / inspector-command linkage / review state continuity / linked review artifacts / blockers / handoff posture / observability mapping / observability closeout / packaged-app materialization contract / packaged-app task-state linkage / release QA closeout readiness / approval-audit-rollback Stage C entry / typed Stage C readiness / withheld-future boundary bridge / staged-output review readout / bundle-sealing review readout / local materialization review packet / validator continuity surface match / review-only delivery chain / operator review loop / local-only multi-window shared-state review surface** 阶段：真实 host-side execution 仍然保持关闭，但在 phase25/26/27/28/29/30/31/32/33 的 focused-slot、preview → slot handoff、slot-level simulated outcomes、release skeleton、command surface、layout persistence、window deepening、workflow lane 与 orchestration board 基础上，shell 现在把 phase55 的 review-only release approval pipeline、phase56 的 cross-window shared-state review surface、phase57 的 operator review board / decision handoff / evidence closeout、以及 phase58 的 reviewer queue / acknowledgement / delivery-chain / observability foundation 继续推进成更明确的 delivery-chain workspace、stage explorer、review flow ladder、acceptance reading queue、reviewer signoff board、signoff readiness queue、final review closeout、final verdict console、acceptance closeout timeline、final review settlement、pack closeout board、delivery coverage matrix、review-deck coverage routing、review-deck orchestration deck、command-surface action-deck coverage、review-surface coverage actions、review-surface navigator、review-surface multi-window coverage、typed companion review-path orchestration、sequence-aware companion review navigation、delivery-gate companion sequence switching、companion route-history memory、route replay board、replay scenario packs、screenshot-driven acceptance review pack、acceptance pass layer、screenshot pass records、capture review flow、proof-linked evidence bundle、acceptance evidence continuity、reviewer brief、proof bundle、product-review console polish、acceptance storyboard、evidence dossier、evidence trace lens、acceptance scoreboard、replay acceptance checklist、artifact coverage、blocker posture、handoff posture、review-surface linkage、跨窗口 observability closeout、以及 packaged-app materialization / task-state evidence / staged-output / bundle-sealing / local materialization review packet / validator continuity surface match / release QA closeout / approval-audit-rollback Stage C entry / typed Stage C readiness / withheld-future boundary bridge 的只读本地审阅合同。

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
  - phase44 已补齐 ATTESTATION-APPLY-AUDIT-PACKS / PROMOTION-EXECUTION-CHECKPOINTS / ROLLBACK-OPERATOR-DRILLBOOKS
  - phase45 已补齐 ATTESTATION-APPLY-EXECUTION-PACKETS / PROMOTION-OPERATOR-HANDOFF-RAILS / ROLLBACK-LIVE-READINESS-CONTRACTS
  - phase46 已补齐 ATTESTATION-OPERATOR-WORKLISTS / PROMOTION-STAGED-APPLY-LEDGERS / ROLLBACK-CUTOVER-READINESS-MAPS
  - phase47 已补齐 ATTESTATION-OPERATOR-DISPATCH-MANIFESTS / PROMOTION-STAGED-APPLY-RUNSHEETS / ROLLBACK-CUTOVER-HANDOFF-PLANS
  - phase48 已补齐 ATTESTATION-OPERATOR-DISPATCH-PACKETS / PROMOTION-STAGED-APPLY-COMMAND-SHEETS / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS
  - phase49 已补齐 ATTESTATION-OPERATOR-DISPATCH-RECEIPTS / PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS / ROLLBACK-CUTOVER-EXECUTION-RECORDS
  - phase50 已补齐 ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS / PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS / ROLLBACK-CUTOVER-OUTCOME-REPORTS
  - phase51 已补齐 ATTESTATION-OPERATOR-SETTLEMENT-PACKS / PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS / ROLLBACK-CUTOVER-PUBLICATION-BUNDLES
  - phase52 已补齐 ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES / PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS / ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS
  - phase53 已补齐 ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS
  - phase54 已补齐 ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT
  - phase55 已把 approval orchestration / staged release decision lifecycle / rollback receipt settlement closeout 串成 Review-only Release Approval Pipeline，并补齐 trace phase stage metadata、linked notes、以及 inspector release-pipeline drilldowns
  - phase56 已把 multi-window foundation 继续推进成 local-only multi-window orchestration / cross-window shared-state review surface，并补齐 window roster、shared-state lanes、ownership / sync health / last handoff、route/workspace intent links、以及 Dashboard / Home / Settings / Inspector / Windows rail 的统一可见性
  - phase57 已把 review-only release approval pipeline 继续推进成更明确的 Operator Review Board / Decision Handoff / Evidence Closeout，并把同一条 local-only review chain 连到 trace、inspector、window roster、shared-state lanes、以及 package/release artifacts
  - phase58 已把同一条 review chain 继续推进成更明确的 reviewer queues、acknowledgement state、delivery-chain stages、promotion / publish / rollback review flow、escalation windows、closeout windows、review-posture ownership maps、以及更深的 cross-window observability，并把这些 review-loop objects 连到 App / pages / inspector / window/shared-state surfaces / package artifacts
  - phase60 slice1 已把 review-only delivery chain 继续推进成更明确的 delivery-chain workspace / stage explorer，并把 stage ownership、artifact groups、blockers、handoff posture、review surfaces、以及 observability mapping 收敛进同一个 shell explorer
  - phase60 slice2 已继续补齐 Review Flow Ladder 与 Delivery Coverage Matrix，让每个 delivery stage 的 queue / baton / closeout / mapped window coverage 不再只散落在 operator board 或 observability cards 里
  - phase60 slice3 已把 review-deck intent / delivery coverage / cross-window observability 接进 command surface，让 Settings / Agents / Codex 在 review-deck posture 下能直接切到 coverage flow，而不是停留在泛化 route flow
  - phase60 slice4 已把 review-deck posture 继续推进成 command-surface action deck，让同一组 local-only orchestration lanes 显式覆盖 promotion readiness / publish / rollback delivery stages，以及对应的 window / shared-state lane / orchestration board / observability row
  - phase60 slice5 已把 review-deck posture 继续推进成 coverage-driven review-surface actions，让 command surface 能直接 focus review packet / reviewer queue / decision handoff / evidence closeout / publish decision gate / rollback closeout window，并把 delivery stage / window / shared-state lane / orchestration board / observability row 一起切到同一条 local-only review surface
  - phase60 slice6 已继续把 review-deck posture 推进成 command-surface multi-window review coverage，让当前 review surface 所在的 action-deck lane 能直接列出 companion window / shared-state lane / orchestration board / observability path，并在同一条 local-only coverage flow 里继续 focus 对应 review surface
  - phase60 slice7 已继续把 review-deck posture 推进成 typed companion review-path orchestration，让当前 review surface 能显式暴露 source -> primary companion -> follow-up review surfaces，并把 route / workspace / window / shared-state lane / orchestration board / observability coherence 保持在同一条 local-only review flow
  - phase60 slice8 已继续把 typed companion review-path orchestration 推进成 sequence-aware companion review navigation，让当前 review surface 显式暴露 ordered companion steps、active sequence step、以及与 route / workspace / window / shared-state lane / orchestration board / observability path 绑定的 sequence context
  - phase60 slice9 已继续把 sequence-aware companion review navigation 推进成 delivery-gate companion sequence switching，让 publish gate / approval queue / rollback shadow 三条 companion 序列可以在同一条 local-only review lane 里显式切换，并把 route / workspace / intent state 一起带入 active / alternate companion coverage
  - phase60 slice10 已继续把 delivery-gate companion sequence switching 推进成 companion route-history memory，让 review-deck lane 能记住最近一次 publish gate / approval queue / rollback shadow / handoff relay 的 companion handoff，并在重新进入同一条 local-only review route 时恢复 route state / sequence / review-surface / multi-window posture
  - phase60 slice11 已继续把 companion route-history memory 推进成 route replay board / replay acceptance checklist，让 delivery workspace 可以直接 restore latest handoff、replay active sequence、以及验收当前 review route 的 review surface / route state / window / lane / board / observability contract
  - phase60 slice13 已继续把 route replay board / replay acceptance checklist 推进成 screenshot-driven acceptance review pack / acceptance scoreboard / pass-status board / screenshot target board，让 delivery workspace 可以把 replay route、scenario review pack、验收检查、reviewer / evidence posture、以及 screenshot targets 收敛成更接近产品验收的单条本地审阅层
  - phase60 slice14 已继续把 screenshot-driven acceptance review pack 推进成 acceptance pass layer / evidence bundle surface / reviewer brief / proof bundle / screenshot target framing，让 delivery workspace 可以把 replay route、reviewer brief、scenario evidence、continuity anchors、proof bundle、以及 screenshot targets 收敛成更完整的本地产品验收链
  - phase60 slice15 已继续把 acceptance pass layer 推进成 Product Review Console / Screenshot Pass Records / Capture Review Flow / Proof-linked Evidence Bundle，让 delivery workspace 可以把 grouped screenshot comparison、linked proof mapping、以及 product-review console polish 收敛成更像真实产品审阅台的本地验收链
  - phase60 slice16 已继续把 Product Review Console 推进成 Acceptance Storyboard / Evidence Dossier / Acceptance Evidence Continuity，让 delivery workspace 可以把 ordered screenshot shots、viewport / framing guidance、owner-tagged proof bundles、review-pack scenario handoff、proof anchors、以及 screenshot capture lineage 收敛成更完整的本地验收证据链
  - phase60 slice17 已继续把 Acceptance Storyboard / Evidence Dossier / Acceptance Evidence Continuity 推进成 Evidence Trace Lens，让 delivery workspace 可以把 focused proof trails、storyboard shots、dossier proof items、以及 continuity handoffs 收敛成更易读的本地产品审阅链
  - phase60 slice18 已继续把 Evidence Trace Lens 推进成 acceptance-area Reviewer Flow Ladder / Acceptance Reading Queue，让 delivery workspace 可以把 replay route restore、acceptance checks、capture review、proof dossier、以及 continuity handoff 收敛成 typed reviewer walkthrough，并保持 pass records / trace lens / dossier / continuity surfaces 在同一条本地产品审阅链里
  - phase60 slice19 已继续把 acceptance-area Reviewer Flow Ladder 推进成 Reviewer Signoff Board，让 delivery workspace 可以把 walkthrough readiness、open blockers、next reviewer handoff、以及 scenario-level signoff verdict 收敛成显式本地验收结论，并保持 roster / capture flow / continuity posture 在同一条产品审阅链里
  - phase60 slice20 已继续把 Reviewer Signoff Board 推进成 Signoff Readiness Queue，让 delivery workspace 可以把 replay pack 的 scenario-level signoff verdict、next pack handoff、ordered closure queue、以及 pack-level blocker posture 收敛成更完整的本地产品审阅收口
  - phase60 slice21 已继续把 Signoff Readiness Queue / Acceptance Reading Queue / Evidence Trace Lens 推进成 Final Review Closeout，让 delivery workspace 可以把 queue order、trace focus、storyboard + dossier linkage、以及 reviewer verdict 收敛成更明确的 acceptance closeout console，并保持 local-only / review-only posture
  - phase60 slice22 已继续把 Final Review Closeout / Signoff Readiness Queue 推进成 Pack Closeout Board，让 delivery workspace 可以把 signoff ordering、acceptance pack coverage、evidence continuity、以及 final reviewer handoff 收敛成更明确的 pack-level review settlement console，并保持 local-only / review-only posture
  - phase60 slice23 已继续把 Pack Closeout Board / Final Review Closeout / Reviewer Signoff Board / Acceptance Storyboard / Evidence Dossier / Evidence Trace Lens 推进成 Final Review Settlement，让 delivery workspace 可以把 verdict progression、signoff settlement、pack closeout framing、以及 reading queue / trace / storyboard / dossier / signoff / pack linkage 收敛成更明确的 interface-review console，并保持 local-only / review-only posture
  - phase60 slice24 已继续把 Final Review Settlement / Pack Closeout Board / Reviewer Signoff Board 推进成 Final Verdict Console，让最终 reviewer decision context、settlement route anchor、evidence chain、以及 pack settlement lane 作为同一张 reviewer-facing judgement card 更易读
  - phase60 slice25 已继续把 Final Verdict Console / Final Review Closeout / Signoff Readiness Queue 推进成 Acceptance Closeout Timeline，让 replay route restore、reading queue、trace、storyboard / dossier linkage、signoff、queue ordering、以及 pack closeout 作为同一条显式 closeout path 更容易跟随
  - phase60 slice26 已继续把 command surface / inspector 推进成更实用的 reviewer navigation layer，让 command palette 支持 richer preview / cross-section filtering / multi-window coverage entry，同时让 inspector 直接暴露 replay pack、reviewer decision context、route anchor、evidence chain、以及关键 jump actions
  - phase60 slice27 已继续把 multi-window review coverage / observability mapping 推进成更完整的 observability closeout，让 active review surface、window / lane / board spine、reviewer queue、closeout timing、以及 mapped review path 作为同一条 review state continuity 在 windows surface 里读起来更像一体化控制台
  - phase60 slice28 已继续把 observability closeout 推进成更明确的 Review State Continuity / cross-window shared-state continuity contract，让 active review surface、window / lane / board spine、reviewer queue、closeout timing、mapped review path、以及 inspector / windows rail 的只读 continuity readouts 收敛成同一条本地审阅链
  - phase60 slice29 已继续把 delivery-chain workspace / release depth readout 推进成更明确的 Packaged-app Materialization Contract，让 per-platform verification manifest、staged output root、seal manifest、integrity manifest、以及 promotion -> publish gate handoff 在同一张 Stage Explorer 里保持只读可见，并继续保持 local-only / review-only posture
  - phase60 slice30 已继续把 packaged-app continuity 推进成更明确的 Release QA Closeout Readiness / Approval-Audit-Rollback Entry，让 installer-signing handshake verification、release checklist proof、delivery closeout posture、以及第一层 Stage C approval / audit / rollback contract 保持同一条 local-only / review-only 审阅链
  - phase60 slice31 已继续把 Packaged-app Materialization Contract 推进成更明确的 task-state linkage，让 per-platform current task、task evidence、delivery-stage linkage、以及 directory / staged-output / bundle-seal readiness 在同一张 Stage Explorer 里保持只读可见，并继续保持 local-only / review-only posture
  - phase60 slice32 已继续把 Approval-Audit-Rollback Entry 推进成更明确的 typed Stage C readiness，让 QA closeout tracks、approval workflow stages、checkpoint-level evidence、rollback live-readiness contracts、以及 withheld / future-executor boundary linkage 在同一张 Stage Explorer / inspector / windows surface 里保持只读可见，并继续保持 local-only / review-only posture
  - phase60 slice33 已继续把 Packaged-app Materialization Contract 推进成更明确的 local materialization review packet，让 per-platform directory -> staged-output -> bundle-seal handoff、current review step、packet evidence、以及 rollback anchor 在同一张 Stage Explorer 里保持只读可见，并继续保持 local-only / review-only posture
  - phase60 slice34 已继续把 Packaged-app Materialization Contract 推进成更明确的 validator / observability bridge，让 progression segments、staged-output next step、active bundle-sealing checkpoint、以及 nearby QA / approval / Stage C readiness linkage 在同一张 Stage Explorer / windows surface 里保持只读可见，并继续保持 local-only / review-only posture
  - phase60 slice35 已继续把 validator / observability bridge 推进成更明确的 validator continuity surface match，让 current validator readout、next validator handoff、matched observability row、review-state continuity entry、以及 observability signals / validator checks 在同一张 Stage Explorer / windows surface 里保持只读可见，并继续保持 local-only / review-only posture
  - package snapshot 现在带 per-platform bundle skeleton、packaged-app materialization skeleton、packaged-app directory materialization、packaged-app bundle sealing skeleton、packaged-app local materialization contract、release QA closeout readiness、approval-audit-rollback entry contract、sealed-bundle integrity contract、integrity attestation evidence、attestation verification packs、attestation apply audit packs、attestation apply execution packets、attestation operator worklists、attestation operator dispatch manifests、attestation operator dispatch packets、attestation operator dispatch receipts、attestation operator reconciliation ledgers、attestation operator settlement packs、attestation operator approval routing contracts、attestation operator approval orchestration、review-only delivery chain、operator review board、release decision handoff、review evidence closeout、installer builder execution skeleton、installer channel routing、channel promotion evidence、promotion apply manifests、promotion execution checkpoints、promotion operator handoff rails、promotion staged-apply ledgers、promotion staged-apply runsheets、promotion staged-apply command sheets、promotion staged-apply confirmation ledgers、promotion staged-apply closeout journals、promotion staged-apply signoff sheets、promotion staged-apply release decision enforcement contracts、promotion staged-apply release decision enforcement lifecycle、signing-publish gating handshake、publish rollback handshake、rollback execution rehearsal ledger、rollback operator drillbooks、rollback live-readiness contracts、rollback cutover readiness maps、rollback cutover handoff plans、rollback cutover execution checklists、rollback cutover execution records、rollback cutover outcome reports、rollback cutover publication bundles、rollback cutover publication receipt closeout contracts、rollback cutover publication receipt settlement closeout、release approval workflow、release notes 与 publish gating
  - main shell 里的 Formal Release Readiness 卡片已同步反映 reviewer queues、acknowledgement state、delivery-chain stage、operator review board、decision handoff、evidence closeout、packaged-app current task / task evidence、promotion review flow、publish decision gate、rollback readiness、以及 packaged-app / attestation / promotion / rollback posture
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

phase60 额外提供一个只读 dry-run：

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
- renderer bundle 是否显式包含 phase25 focused-slot markers，以及 phase38 packaged-app directory materialization / installer builder execution / signing-publish gating handshake markers，外加 phase60 delivery-chain workspace / stage explorer / review flow ladder / Acceptance Reading Queue / Reviewer Signoff Board / Signoff Readiness Queue / Final Review Closeout / Final Verdict Console / Acceptance Closeout Timeline / Final Review Settlement / Pack Closeout Board / delivery coverage matrix / review coverage flow / review-surface navigator / multi-window review coverage / companion review-path orchestration / sequence-aware companion review navigation / delivery-gate companion sequence switching / companion route-history memory / route replay board / acceptance scoreboard / Product Review Console / Screenshot Pass Records / Acceptance Storyboard / Capture Review Flow / Acceptance Evidence Continuity / Evidence Trace Lens / Proof-linked Evidence Bundle / Evidence Dossier / Verdict progression / Reviewer decision context / Settlement route anchor / Evidence chain / Linked review surfaces / Pack settlement lane / Review State Continuity / Observability closeout / Mapped review path / Command preview / Viewport / Framing / Dossier section / review pack scenarios / command-surface observability linkage / artifact coverage / blockers / handoff posture markers，以及 cross-window coordination board / shared-state lane / window roster / sync health / local-only blockers markers，以及 operator review board / active review packet / reviewer queue / acknowledgement / escalation window / decision handoff / evidence closeout / closeout window / attestation intake / approval orchestration / final release decision board / rollback settlement closeout markers
- host preview action 是否显式暴露 focus / slot-state / disposition / slot roster / timeline section
- local connector controls 是否仍保持 local-only 行为
- startup preflight 是否 ready
- phase60 release skeleton contract 是否完整（layout / docs / manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged-app directory materialization / packaged-app materialization skeleton / packaged-app staged output skeleton / packaged-app bundle sealing skeleton / packaged-app local materialization contract / release QA closeout readiness / approval-audit-rollback entry contract / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / attestation apply audit packs / attestation apply execution packets / attestation operator worklists / attestation operator dispatch manifests / attestation operator dispatch packets / attestation operator dispatch receipts / attestation operator reconciliation ledgers / attestation operator settlement packs / attestation operator approval routing contracts / attestation operator approval orchestration / operator review board / release decision handoff / review evidence closeout / installer targets / installer builder execution skeleton / installer-target builder skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / promotion execution checkpoints / promotion operator handoff rails / promotion staged-apply ledgers / promotion staged-apply runsheets / promotion staged-apply command sheets / promotion staged-apply confirmation ledgers / promotion staged-apply closeout journals / promotion staged-apply signoff sheets / promotion staged-apply release decision enforcement contracts / promotion staged-apply release decision enforcement lifecycle / signing metadata / notarization plan / signing-publish gating handshake / signing-publish pipeline / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / rollback operator drillbooks / rollback live-readiness contracts / rollback cutover readiness maps / rollback cutover handoff plans / rollback cutover execution checklists / rollback cutover execution records / rollback cutover outcome reports / rollback cutover publication bundles / rollback cutover publication receipt closeout contracts / rollback cutover publication receipt settlement closeout / release approval workflow / release notes / publish gates / promotion gates / release summary / installer placeholder / release checklist）
- shell state 是否显式包含 action groups / sequences / contextual flows / keyboard routing / action decks / focus-review-coverage actions / companion review sequences / workflow posture / orchestration board / pre-release bundle pipeline contract

### `npm run start:smoke`

- 走真实 `npm start` 链路
- 保持一段时间后主动清理
- 证明真实启动链路存活，而不是只验证源码或静态构建
- 在当前这类受限 Linux sandbox 中，如果 Electron 已到达启动路径但 Chromium sandbox host 被容器拦截，会以 sandbox-limited fallback 通过并明确标注原因

### `npm run release:plan`

- 只做 phase60 release skeleton dry-run 汇总
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
    ATTESTATION-APPLY-AUDIT-PACKS.json
    ATTESTATION-APPLY-EXECUTION-PACKETS.json
    ATTESTATION-OPERATOR-WORKLISTS.json
    ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json
    ATTESTATION-OPERATOR-DISPATCH-PACKETS.json
    ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json
    ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json
    ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json
    ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json
    ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json
    OPERATOR-REVIEW-BOARD.json
    RELEASE-DECISION-HANDOFF.json
    REVIEW-EVIDENCE-CLOSEOUT.json
    INSTALLER-TARGETS.json
    INSTALLER-TARGET-BUILDER-SKELETON.json
    INSTALLER-BUILDER-EXECUTION-SKELETON.json
    INSTALLER-BUILDER-ORCHESTRATION.json
    INSTALLER-CHANNEL-ROUTING.json
    CHANNEL-PROMOTION-EVIDENCE.json
    PROMOTION-APPLY-READINESS.json
    PROMOTION-APPLY-MANIFESTS.json
    PROMOTION-EXECUTION-CHECKPOINTS.json
    PROMOTION-OPERATOR-HANDOFF-RAILS.json
    PROMOTION-STAGED-APPLY-LEDGERS.json
    PROMOTION-STAGED-APPLY-RUNSHEETS.json
    PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json
    PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json
    PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json
    PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json
    PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json
    PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json
    SIGNING-METADATA.json
    NOTARIZATION-PLAN.json
    SIGNING-PUBLISH-PIPELINE.json
    SIGNING-PUBLISH-GATING-HANDSHAKE.json
    SIGNING-PUBLISH-APPROVAL-BRIDGE.json
    SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json
    PUBLISH-ROLLBACK-HANDSHAKE.json
    ROLLBACK-RECOVERY-LEDGER.json
    ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json
    ROLLBACK-OPERATOR-DRILLBOOKS.json
    ROLLBACK-LIVE-READINESS-CONTRACTS.json
    ROLLBACK-CUTOVER-READINESS-MAPS.json
    ROLLBACK-CUTOVER-HANDOFF-PLANS.json
    ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json
    ROLLBACK-CUTOVER-EXECUTION-RECORDS.json
    ROLLBACK-CUTOVER-OUTCOME-REPORTS.json
    ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json
    ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json
    ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json
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

这是一个 **phase57 alpha-shell release skeleton**，不是正式 installer。

它用于：

- artifact review
- handoff
- release contract 审阅
- 交付快照归档

## 当前能交付什么

- 可运行的 Electron + renderer 构建产物快照
- 当前 README / HANDOFF / IMPLEMENTATION-PLAN 文档闭环
- release manifest / build metadata / review manifest / bundle matrix / bundle assembly / packaged app directory skeleton / packaged-app directory materialization / packaged-app materialization skeleton / packaged-app staged output skeleton / packaged-app bundle sealing skeleton / packaged-app local materialization contract / release QA closeout readiness / approval-audit-rollback entry contract / sealed-bundle integrity contract / integrity attestation evidence / attestation verification packs / attestation apply audit packs / attestation apply execution packets / attestation operator worklists / attestation operator dispatch manifests / attestation operator dispatch packets / attestation operator dispatch receipts / attestation operator reconciliation ledgers / attestation operator settlement packs / attestation operator approval routing contracts / attestation operator approval orchestration / operator review board / release decision handoff / review evidence closeout / installer targets / installer builder execution skeleton / installer-target builder skeleton / installer builder orchestration / installer channel routing / channel promotion evidence / promotion apply readiness / promotion apply manifests / promotion execution checkpoints / promotion operator handoff rails / promotion staged-apply ledgers / promotion staged-apply runsheets / promotion staged-apply command sheets / promotion staged-apply confirmation ledgers / promotion staged-apply closeout journals / promotion staged-apply signoff sheets / promotion staged-apply release decision enforcement contracts / promotion staged-apply release decision enforcement lifecycle / signing metadata / notarization plan / signing-publish gating handshake / signing-publish pipeline / signing-publish approval bridge / signing-publish promotion handshake / publish rollback handshake / rollback recovery ledger / rollback execution rehearsal ledger / rollback operator drillbooks / rollback live-readiness contracts / rollback cutover readiness maps / rollback cutover handoff plans / rollback cutover execution checklists / rollback cutover execution records / rollback cutover outcome reports / rollback cutover publication bundles / rollback cutover publication receipt closeout contracts / rollback cutover publication receipt settlement closeout / release approval workflow / release notes / publish gates / promotion gates / release summary / installer placeholder / checklist
- disabled host bridge + focused-slot UI + deeper trace surface + phase38 packaged-app directory materialization / installer builder execution skeleton / signing-publish gating handshake，以及 phase57 local-only multi-window orchestration / cross-window shared-state review surface / operator review board / decision handoff / evidence closeout 的验证后快照

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
- operator review board、release decision handoff、review evidence closeout、release approval workflow、installer channel routing、attestation operator approval orchestration、promotion staged-apply release decision enforcement lifecycle、rollback cutover publication receipt settlement closeout、publish rollback handshake 与 signing-publish handshakes 现在都已具备 metadata contract，但仍然不会触发真实审批、签名、发布、回滚、路由或安装
- live approval handshake / lifecycle runner / rollback-aware apply 仍未落地为可执行能力
- 当前 package 已具备更正式的 release skeleton，但仍然不是正式安装器，也不会执行任何安装动作
- Codex 任务状态仍然是基于本地日志的启发式读取，不是正式 task API
- Session 标题仍然有启发式成分
- focused slot 现已能驱动 Dashboard / Home / Skills 的页面级摘要、quick filters 与轻量 persistence，但仍然只是 simulated / placeholder / disabled flow
- 当前多窗口虽然已具备 detached workspace behavior / staged intent / posture 联动，但仍然不包含真实窗口编排、系统级窗口操作或 host 级控制

## 下一步更自然的方向

- 在保持 disabled 的前提下继续加深 bridge observability / validator coverage / failure-path coverage / command-surface depth
- 在 approval / lifecycle / rollback 具备真实能力前，仍然不要开启 host-side execution
- 把当前 release skeleton 继续推进成真正的 attestation apply execution / promotion operator handoff / rollback live-readiness，同时保持 operator review board / decision handoff / evidence closeout 仍然停留在 local-only review-only posture
- 在当前 shell contract 基础上再推进真实多窗口编排与跨窗口共享状态
