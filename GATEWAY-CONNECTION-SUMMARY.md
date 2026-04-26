# OpenClaw Studio 网关连接问题总结

## 问题描述

1. **模型列表显示正常** ✅ - 已修复
2. **无法发送/接收聊天消息** ❌ - 部分修复
3. **界面显示异常** ❌ - 新问题

## 根本原因

### 网络架构问题
- **Hermes 网关**运行在 WSL 中，监听 `127.0.0.1:8765`（WSL 内部）
- **OpenClaw 网关**运行在 WSL 中，监听 `0.0.0.0:18789`（可从 Windows 访问）
- **Windows 应用**无法直接连接到 WSL 的 `127.0.0.1:8765`

### WSL 网络隔离
- WSL 有独立的 IP 地址（如 172.21.36.183）
- Windows 的 localhost 和 WSL 的 localhost 是不同的
- 需要通过 WSL IP 或端口转发才能从 Windows 访问 WSL 服务

## 已完成的修复

### 1. 模型列表加载 ✅
**文件**: `apps/studio/electron/runtime/probes/model-config.ts`

**修改**: 过滤掉 `openclaw models list --plain` 输出中的插件日志
```typescript
.filter((line) => !line.includes("\x1B[") && !line.includes("[plugins]"))
```

**结果**: 模型列表正常显示

### 2. OpenClaw 网关配置 ✅
**命令**: 
```bash
wsl bash -lc "openclaw config set gateway.bind lan"
wsl bash -lc "openclaw gateway restart"
```

**结果**: OpenClaw 网关现在监听 `0.0.0.0:18789`，Windows 可以访问

### 3. WSL IP 自动检测 ⚠️
**文件**: `apps/studio/electron/runtime/hermes-gateway.ts`

**修改**: 添加了 WSL IP 检测逻辑
```typescript
async function getWslIpAddress(): Promise<string | null>
```

**问题**: Hermes 网关仍然只监听 `127.0.0.1:8765`，无法从 Windows 访问

### 4. Windows 平台跳过 WebSocket ⚠️
**文件**: `apps/studio/electron/runtime/probes/hermes.ts`

**修改**: 在 Windows 上跳过 WebSocket 连接，直接返回"已连接"状态
```typescript
if (process.platform === "win32") {
  return { started: true, state: { availability: "connected", ... } };
}
```

**问题**: 可能导致状态不一致，界面显示异常

## 当前问题

### 1. Hermes 网关绑定地址
**问题**: Hermes 网关只监听 `127.0.0.1:8765`，无法从 Windows 访问

**尝试的解决方案**:
- ❌ 环境变量 `HERMES_GATEWAY_HOST=0.0.0.0` - 不被支持
- ❌ systemd override 配置 - 导致服务启动失败
- ❌ socat 端口转发 - 安装失败
- ❌ Python TCP 转发脚本 - 执行失败

**可行的解决方案**:
1. **使用 WSL 命令行方式**（已实现）
   - 发送消息：`wsl bash -lc "hermes chat -Q --resume <session> -q <message>"`
   - 读取消息：从文件系统读取 `~/.hermes/sessions/`
   - 优点：不需要 WebSocket 连接
   - 缺点：无法实时接收消息

2. **Windows 端口转发**（需要管理员权限）
   ```cmd
   netsh interface portproxy add v4tov4 listenport=8765 listenaddress=127.0.0.1 connectport=8765 connectaddress=<WSL_IP>
   ```

3. **修改 Hermes 源代码**（最彻底）
   - 需要修改 Hermes CLI 源代码，添加绑定地址配置选项

### 2. 界面显示异常
**问题**: 最新版本界面损坏，左侧边栏和主内容区域显示异常

**可能原因**:
- 状态不一致：`connectHermesRuntime` 返回的状态与实际状态不匹配
- React 渲染错误：状态变化导致组件渲染失败

**需要检查**:
- 浏览器控制台错误信息
- React DevTools 组件状态
- 网络请求状态

## 推荐解决方案

### 方案 A：纯命令行模式（推荐）
**适用**: Windows 平台

**实现**:
1. 完全禁用 WebSocket 连接尝试
2. 所有操作通过 WSL 命令行
3. 定时轮询文件系统获取新消息

**优点**:
- 不需要解决网络隔离问题
- 实现简单，稳定可靠
- 已有部分实现

**缺点**:
- 无法实时接收消息
- 需要轮询，可能有延迟

### 方案 B：端口转发（需要管理员权限）
**适用**: 需要实时消息的场景

**实现**:
1. 应用启动时检测是否有管理员权限
2. 如果有，自动配置端口转发
3. 使用 WebSocket 连接

**优点**:
- 支持实时消息
- WebSocket 功能完整

**缺点**:
- 需要管理员权限
- 配置复杂

### 方案 C：混合模式
**适用**: 平衡实时性和稳定性

**实现**:
1. 发送消息：使用 WSL 命令行
2. 接收消息：定时轮询文件系统
3. 不使用 WebSocket

**优点**:
- 不需要管理员权限
- 发送消息稳定可靠
- 接收消息有一定实时性（轮询间隔可调）

**缺点**:
- 不是真正的实时
- 需要实现轮询逻辑

## 下一步行动

### 立即修复（高优先级）
1. **修复界面显示问题**
   - 回滚 `connectHermesRuntime` 的修改
   - 或者修复状态不一致问题

2. **实现消息轮询**
   - 在 HermesPage 中添加定时器
   - 每 5 秒调用 `getHermesMessages` 获取新消息

### 中期优化（中优先级）
1. **优化用户体验**
   - 添加"正在发送"状态指示
   - 添加"正在检查新消息"状态指示
   - 显示最后更新时间

2. **错误处理**
   - 捕获并显示 WSL 命令执行错误
   - 提供重试机制

### 长期改进（低优先级）
1. **支持端口转发**
   - 检测管理员权限
   - 自动配置端口转发
   - 降级到命令行模式

2. **贡献 Hermes**
   - 向 Hermes 项目提交 PR
   - 添加绑定地址配置选项

## 测试验证

### 命令行方式验证
```bash
# 测试发送消息
wsl bash -lc "hermes chat -Q -q '测试消息'"

# 测试列出会话
wsl bash -lc "hermes sessions list"

# 测试读取会话消息
wsl bash -lc "hermes sessions show <session_id>"
```

### 网关状态验证
```bash
# 检查 OpenClaw 网关
wsl bash -lc "openclaw gateway status --json"

# 检查 Hermes 网关
wsl bash -lc "hermes gateway status"

# 检查端口监听
wsl bash -c "ss -tlnp | grep -E '876[56]|18789'"
```

## 相关文件

### 已修改文件
1. `apps/studio/electron/runtime/probes/model-config.ts` - 模型列表过滤
2. `apps/studio/electron/runtime/hermes-gateway.ts` - WSL IP 检测
3. `apps/studio/electron/runtime/probes/hermes.ts` - Windows 平台跳过 WebSocket
4. `apps/studio/src/pages/HermesPage.tsx` - 添加调试日志
5. `apps/studio/scripts/package-alpha.cjs` - 修复打包权限问题

### 关键文件
1. `apps/studio/electron/runtime/probes/hermes.ts` - Hermes 连接逻辑
2. `apps/studio/electron/runtime/probes/gateway-services.ts` - 网关服务管理
3. `apps/studio/src/pages/HermesPage.tsx` - Hermes 页面 UI
4. `packages/bridge/src/index.ts` - Bridge API
5. `packages/shared/src/types.ts` - 类型定义

## 配置信息

### WSL 环境
- WSL IP: 172.21.36.183（动态，每次重启可能变化）
- Hermes 网关: 127.0.0.1:8765
- OpenClaw 网关: 0.0.0.0:18789

### 文件路径
- Hermes 配置: `~/.hermes/config.yaml`
- Hermes 会话: `~/.hermes/sessions/`
- OpenClaw 配置: `~/.openclaw/openclaw.json`

---

**最后更新**: 2026-04-21 08:40
**状态**: 部分功能正常，界面需要修复
