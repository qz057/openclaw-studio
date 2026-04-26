# 模型选项不显示问题诊断指南

## 当前状态

应用已重新构建并打包（包含调试日志），进程 PID: 9144

## 后端验证结果 ✅

已通过测试脚本验证后端功能正常：

```bash
node E:\claucd\test-model-loading.js
```

结果：
- ✅ OpenClaw 模型列表正确加载（16 个模型）
- ✅ 过滤逻辑正确排除插件日志和 ANSI 代码
- ✅ Hermes 配置正确解析（relay/gpt-5.4）

## 前端诊断步骤

### 1. 打开开发者工具

在应用中按 `F12` 或 `Ctrl+Shift+I` 打开开发者工具

### 2. 查看控制台日志

应该看到以下日志：

**Hermes 页面：**
```
[HermesPage] 开始加载模型列表...
[HermesPage] 模型列表加载成功: {
  selectedModelId: "relay/gpt-5.4",
  optionsCount: 16,
  options: [...]
}
```

**OpenClaw 页面（ChatPage）：**
```
[ChatPage] 开始加载模型列表...
[ChatPage] 模型列表加载成功: {
  selectedModelId: "relay/gpt-5.4",
  optionsCount: 16,
  options: [...]
}
```

### 3. 可能的问题场景

#### 场景 A：看到 "开始加载" 但没有 "加载成功"
说明加载过程中出错，查看是否有错误日志：
```
[HermesPage] 模型列表加载失败: Error: ...
```

#### 场景 B：看到 "加载成功" 但 optionsCount 为 0
说明后端返回了空列表，需要检查：
1. WSL 中 OpenClaw 是否正常运行
2. 命令 `wsl.exe -e bash -lc "openclaw models list --plain"` 是否有输出

#### 场景 C：看到 "加载成功" 且 optionsCount > 0，但界面仍无选项
说明前端渲染逻辑有问题，检查：
1. `modelCatalog` 状态是否正确设置
2. 下拉框是否被禁用（disabled 属性）
3. React 组件是否正确重新渲染

#### 场景 D：完全没有任何日志
说明页面组件未正确加载或 useEffect 未执行

### 4. 手动测试后端 API

在控制台中执行：

```javascript
// 测试 Hermes 模型加载
window.bridge.loadHermesModelCatalog().then(catalog => {
  console.log("Hermes 模型目录:", catalog);
}).catch(err => {
  console.error("加载失败:", err);
});

// 测试 OpenClaw 模型加载
window.bridge.loadOpenClawModelCatalog().then(catalog => {
  console.log("OpenClaw 模型目录:", catalog);
}).catch(err => {
  console.error("加载失败:", err);
});
```

### 5. 检查网络和 IPC 通信

在 Network 标签中查看是否有失败的请求，或在控制台查看 IPC 通信日志。

## 已实施的修复

1. ✅ 增强模型 ID 过滤逻辑（正则表达式验证）
2. ✅ 排除 ANSI 颜色代码
3. ✅ 排除插件日志（[plugins], [lcm]）
4. ✅ 添加前端调试日志（HermesPage 和 ChatPage）
5. ✅ WSL IP 自动检测
6. ✅ 缓存机制优化

## 下一步

请在应用中：
1. 打开开发者工具（F12）
2. 切换到 Console 标签
3. 导航到 Hermes 页面
4. 导航到 OpenClaw 页面
5. 截图控制台日志并报告结果

## 相关文件

- 后端模型加载：`apps/studio/electron/runtime/probes/model-config.ts`
- Hermes 前端：`apps/studio/src/pages/HermesPage.tsx`
- OpenClaw 前端：`apps/studio/src/pages/ChatPage.tsx`
- 测试脚本：`E:\claucd\test-model-loading.js`
