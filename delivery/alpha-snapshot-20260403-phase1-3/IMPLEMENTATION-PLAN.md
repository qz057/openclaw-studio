# OpenClaw Studio V1 实施计划

## 项目目标
构建一个独立的 OpenClaw Studio 桌面程序，聚合 OpenClaw 启动与状态、Sessions、Agents、Codex 工作台、Skills/Tools/MCP、Dashboard、Settings，并支持多标签/可拆分窗口工作流。

## 交付目录
- 工作项目目录：`/home/qz057/.openclaw/workspace/openclaw-studio`
- 正式交付目录：`E:\下载\openclaw studio`

## 技术路线
- Electron + React + TypeScript + Vite
- 桌面壳 / Bridge / Runtime / UI 四层结构
- 以 Codex 为主实施，OpenClaw 负责规划、验收、收口

## 实施原则
1. 先搭主链路，再逐步扩展。
2. 每完成一个阶段必须做最小可运行验证。
3. 若出现错误代码、构建失败或明显 BUG，先修再进入下一阶段。
4. 优先保障 Home / Sessions / Codex 三个主页面可运行。
5. 所有桥接逻辑先做清晰骨架，避免一开始耦死。

## Phase 1（优先）
### 目标
搭建可运行的 Studio Alpha 骨架。

### 范围
- Monorepo / workspace 基础结构
- Electron 主进程 + preload
- React renderer 工作台壳
- 左侧导航、顶部栏、底部状态栏
- Home / Sessions / Codex 三页骨架
- packages/shared 与 packages/bridge 基础目录
- 基础 IPC contract 与 mock 数据链路

### 验收
- `npm install` / `pnpm install` 成功
- 类型检查通过
- 构建通过
- 能打开桌面壳或至少 renderer build 成功
- Home / Sessions / Codex 页面可见

## Phase 2
### 目标
补齐 Agent / Dashboard / Skills/Tools/MCP 主视图。

### 验收
- 关键页面可导航
- mock / bridge 数据可显示
- 基础状态卡和列表可渲染

## Phase 3
### 目标
接入真实 OpenClaw bridge：system status、sessions list/history/send、基础 codex task model。

### 验收
- 至少一条真实系统状态链路通
- 至少一条真实 sessions 链路通
- Codex 任务模型能展示状态

## Phase 4
### 目标
增强布局、拆窗、Inspector、Command Palette、设置页、日志/审批 dock。

### 验收
- 布局可保存
- 基础多窗口能力可用
- Command Palette 可触发核心动作

## 本轮开工要求
当前只做 Phase 1，严禁超范围膨胀。先把壳子、目录、主页面、bridge skeleton 和基础构建跑通。
