# OpenClaw Studio - 快速开始指南

## 前置要求

- **Node.js**: 18.x 或更高版本
- **npm**: 8.x 或更高版本
- **操作系统**: Windows 10+, macOS 10.13+, 或 Linux

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

这将安装所有必需的依赖包（约 328 个包）。

### 2. 构建项目

```bash
npm run build
```

这将：
- 编译 TypeScript 类型定义（packages/shared）
- 编译桥接层（packages/bridge）
- 构建前端应用（dist-renderer）
- 构建 Electron 主进程（dist-electron）

构建时间：约 10-15 秒

### 3. 启动应用

```bash
npm run start
```

应用将在 Electron 窗口中启动。

## 开发模式

### 启动开发服务器

```bash
npm run start
```

开发模式特性：
- 热重载（HMR）
- 自动打开开发者工具
- 实时错误提示

### 类型检查

```bash
npm run typecheck
```

检查所有 TypeScript 类型错误。

### 健康检查

```bash
npm run doctor
```

运行完整的项目健康检查，验证：
- Node.js 和 npm 版本
- 依赖安装状态
- 源文件完整性
- 构建产物存在性
- 配置文件正确性

### 烟雾测试

```bash
npm run smoke
```

快速验证构建产物的完整性（20 项检查）。

## 项目结构

```
openclaw-studio/
├── apps/studio/              # 主应用
│   ├── src/                  # React 前端源码
│   │   ├── pages/           # 页面组件（8个）
│   │   ├── components/      # UI 组件
│   │   ├── hooks/           # React Hooks
│   │   └── styles/          # CSS 样式
│   ├── electron/            # Electron 主进程
│   │   ├── main.ts          # 主进程入口
│   │   ├── preload.ts       # 预加载脚本
│   │   └── runtime/         # 运行时实现
│   ├── dist-renderer/       # 前端构建产物
│   └── dist-electron/       # Electron 构建产物
├── packages/
│   ├── shared/              # 共享类型定义
│   └── bridge/              # IPC 桥接层
└── package.json             # 根配置
```

## 页面导航

应用包含以下页面：

1. **Dashboard** (`/dashboard`) - 系统总览和指标
2. **Home** (`/`) - 起始页面
3. **Chat** (`/chat`) - OpenClaw 聊天交互
4. **Hermes** (`/hermes`) - Hermes 会话管理
5. **Sessions** (`/sessions`) - 会话列表
6. **Agents** (`/agents`) - 代理管理和监控
7. **Codex** (`/codex`) - Codex 任务管理
8. **Skills** (`/skills`) - 技能/工具/MCP 目录
9. **Settings** (`/settings`) - 系统设置

## 数据模式

OpenClaw Studio 支持两种数据模式：

### Mock 模式（默认）
- 使用预定义的 Mock 数据
- 无需 OpenClaw 运行时环境
- 适合演示和开发

### Hybrid 模式（自动检测）
- 自动检测本地 OpenClaw 环境
- 混合使用真实数据和 Mock 数据
- 当探测器无法读取数据时自动降级

## 常见问题

### Q: 构建失败怎么办？

```bash
# 清理并重新构建
rm -rf node_modules apps/studio/dist-* packages/*/dist
npm install
npm run build
```

### Q: 应用启动失败？

1. 确认已运行 `npm run build`
2. 检查 Node.js 版本（需要 18.x+）
3. 运行 `npm run doctor` 诊断问题

### Q: 如何查看日志？

开发模式下，日志会显示在：
- Electron 主进程：终端窗口
- 渲染进程：开发者工具控制台（F12）

### Q: 数据从哪里来？

应用会尝试从以下位置读取数据：
- `~/.openclaw/` - OpenClaw 配置和会话
- `~/.codex/` - Codex 任务和配置
- `~/.hermes/` - Hermes 会话数据

如果这些目录不存在，应用会使用 Mock 数据。

## 打包发布

### 开发版本

```bash
npm run package:alpha
```

### Windows 便携版

```bash
npm run package:windows:portable
```

### 本地测试版

```bash
npm run package:windows:local
```

打包产物将生成在 `apps/studio/dist/` 目录。

## 性能优化

### 构建优化
- ✅ 代码分割（按页面和组件）
- ✅ Tree Shaking
- ✅ 压缩和混淆
- ✅ CSS 提取

### 运行时优化
- ✅ 数据缓存（5秒刷新间隔）
- ✅ 懒加载页面组件
- ✅ 条件渲染
- ✅ 防抖刷新

## 安全性

### Electron 安全配置
- ✅ Context Isolation 启用
- ✅ Node Integration 禁用
- ✅ Sandbox 模式（可配置）
- ✅ 安全的 IPC 通信

### 数据安全
- ✅ 只读文件访问
- ✅ 无远程代码执行
- ✅ 本地数据优先
- ✅ 无外部依赖

## 获取帮助

### 文档
- `README.md` - 项目概述
- `PROJECT-STATUS.md` - 详细的项目状态报告
- `FIXES-SUMMARY.md` - 修复历史

### 诊断工具
```bash
npm run doctor    # 健康检查
npm run smoke     # 烟雾测试
npm run typecheck # 类型检查
```

### 调试
1. 启动应用：`npm run start`
2. 打开开发者工具：F12 或 Ctrl+Shift+I
3. 查看控制台和网络面板

## 下一步

1. 探索各个页面的功能
2. 查看 `PROJECT-STATUS.md` 了解详细信息
3. 根据需要配置 OpenClaw 运行时环境
4. 开始使用！

---

**版本**: 0.1.0-alpha  
**最后更新**: 2026-04-20
