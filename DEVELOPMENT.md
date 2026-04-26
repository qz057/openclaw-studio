# OpenClaw Studio - 开发指南

## 开发环境设置

### 必需工具
- **Node.js**: 18.x 或更高
- **npm**: 8.x 或更高
- **Git**: 用于版本控制
- **VS Code**: 推荐的编辑器（可选）

### VS Code 推荐扩展
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Vite

### 初始化开发环境

```bash
# 克隆或进入项目目录
cd E:\claucd

# 安装依赖
npm install

# 构建项目
npm run build

# 启动开发模式
npm run start
```

## 项目架构

### Monorepo 结构

项目使用 npm workspaces 管理 monorepo：

```
openclaw-studio/
├── apps/
│   └── studio/           # 主应用工作区
├── packages/
│   ├── shared/           # 共享类型工作区
│   └── bridge/           # 桥接层工作区
└── package.json          # 根配置
```

### 技术栈

#### 前端
- **React 18.3.1** - UI 框架
- **TypeScript 5.9.3** - 类型系统
- **Vite 5.4.21** - 构建工具
- **CSS Modules** - 样式管理

#### 后端
- **Electron 35.7.5** - 桌面框架
- **Node.js** - 运行时环境

#### 构建工具
- **esbuild 0.21.5** - 快速编译
- **Rollup** - 模块打包
- **electron-builder 24.13.3** - 应用打包

## 开发工作流

### 1. 修改前端代码

```bash
# 编辑 apps/studio/src/ 下的文件
# 保存后 Vite 会自动热重载
```

前端源码位置：
- `apps/studio/src/pages/` - 页面组件
- `apps/studio/src/components/` - UI 组件
- `apps/studio/src/hooks/` - React Hooks
- `apps/studio/src/styles/` - CSS 样式

### 2. 修改 Electron 主进程

```bash
# 编辑 apps/studio/electron/ 下的文件
# 需要重新构建并重启应用

npm run build:electron
npm run start
```

主进程源码位置：
- `apps/studio/electron/main.ts` - 主进程入口
- `apps/studio/electron/preload.ts` - 预加载脚本
- `apps/studio/electron/runtime/` - 运行时实现

### 3. 修改共享类型

```bash
# 编辑 packages/shared/src/index.ts
# 需要重新构建

npm run build:packages
```

### 4. 修改桥接层

```bash
# 编辑 packages/bridge/src/
# 需要重新构建

npm run build:packages
```

## 代码规范

### TypeScript 规范

#### 类型定义
```typescript
// ✅ 好的做法
interface UserData {
  id: string;
  name: string;
  email: string;
}

// ❌ 避免使用 any
function processData(data: any) { }

// ✅ 使用具体类型
function processData(data: UserData) { }
```

#### 严格模式
所有 TypeScript 配置都启用了 strict 模式：
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### React 规范

#### 组件定义
```typescript
// ✅ 使用函数组件和 TypeScript
interface MyComponentProps {
  title: string;
  count: number;
}

export function MyComponent({ title, count }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  );
}
```

#### Hooks 使用
```typescript
// ✅ 自定义 Hook
export function useMyData() {
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // 数据获取逻辑
  }, []);
  
  return { data, loading };
}
```

### 命名规范

- **文件名**: PascalCase for components (`MyComponent.tsx`), camelCase for utilities (`myUtil.ts`)
- **组件**: PascalCase (`MyComponent`)
- **函数**: camelCase (`myFunction`)
- **常量**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **接口**: PascalCase with `I` prefix optional (`UserData` or `IUserData`)
- **类型**: PascalCase (`MyType`)

## 调试技巧

### 前端调试

1. **开发者工具**
   ```bash
   npm run start
   # 应用启动后按 F12 打开开发者工具
   ```

2. **React DevTools**
   - 安装 React DevTools 浏览器扩展
   - 在 Electron 中也可以使用

3. **断点调试**
   ```typescript
   // 在代码中添加 debugger
   function myFunction() {
     debugger; // 执行到这里会暂停
     // ...
   }
   ```

### Electron 主进程调试

1. **控制台日志**
   ```typescript
   // 在 main.ts 或 runtime 中
   console.log('Debug info:', data);
   ```
   日志会显示在启动应用的终端窗口中。

2. **VS Code 调试配置**
   创建 `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Electron Main",
         "type": "node",
         "request": "launch",
         "cwd": "${workspaceFolder}/apps/studio",
         "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
         "args": ["dist-electron/electron/main.js"],
         "outputCapture": "std"
       }
     ]
   }
   ```

### 性能分析

1. **React Profiler**
   ```typescript
   import { Profiler } from 'react';
   
   <Profiler id="MyComponent" onRender={onRenderCallback}>
     <MyComponent />
   </Profiler>
   ```

2. **Chrome Performance Tab**
   - 打开开发者工具
   - 切换到 Performance 标签
   - 录制并分析性能

## 测试

### 类型检查
```bash
npm run typecheck
```

### 烟雾测试
```bash
npm run smoke
```

### 健康检查
```bash
npm run doctor
```

### 手动测试清单

- [ ] 所有页面可以正常导航
- [ ] 数据刷新功能正常
- [ ] 错误处理正确显示
- [ ] 窗口大小调整正常
- [ ] 开发者工具可以打开
- [ ] 构建产物可以运行

## 添加新功能

### 添加新页面

1. **创建页面组件**
   ```typescript
   // apps/studio/src/pages/NewPage.tsx
   export function NewPage() {
     return (
       <section className="page">
         <h1>New Page</h1>
       </section>
     );
   }
   ```

2. **添加路由**
   ```typescript
   // apps/studio/src/App.tsx
   import { NewPage } from './pages/NewPage';
   
   // 在路由配置中添加
   <Route path="/new" element={<NewPage />} />
   ```

3. **更新类型定义**
   ```typescript
   // packages/shared/src/index.ts
   export const studioPageIds = [
     "dashboard", "home", "chat", "hermes", 
     "sessions", "agents", "codex", "skills", 
     "settings", "new"  // 添加新页面
   ] as const;
   ```

### 添加新的运行时探测器

1. **创建探测器文件**
   ```typescript
   // apps/studio/electron/runtime/probes/my-probe.ts
   export async function probeMyData() {
     try {
       // 读取本地数据
       const data = await readLocalData();
       return { source: 'live', data };
     } catch (error) {
       // 降级到 mock 数据
       return { source: 'mock', data: mockData };
     }
   }
   ```

2. **在 runtime 中使用**
   ```typescript
   // apps/studio/electron/runtime/studio-runtime.ts
   import { probeMyData } from './probes/my-probe';
   
   export function createStudioRuntime() {
     return {
       async getMyData() {
         return probeMyData();
       }
     };
   }
   ```

3. **注册 IPC 处理器**
   ```typescript
   // apps/studio/electron/main.ts
   ipcMain.handle('get-my-data', () => runtime.getMyData());
   ```

4. **添加前端调用**
   ```typescript
   // packages/bridge/src/index.ts
   export async function loadMyData() {
     return (await getStudioApi()).getMyData();
   }
   ```

## 构建和发布

### 开发构建
```bash
npm run build
```

### 生产构建
```bash
npm run build
npm run package:alpha
```

### 构建优化

#### 代码分割
Vite 配置已经设置了代码分割：
```typescript
// vite.config.mts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // 按组件分割
        }
      }
    }
  }
});
```

#### 压缩
- JavaScript: esbuild 自动压缩
- CSS: 自动提取和压缩

## 常见问题

### Q: 修改代码后没有生效？

**A**: 检查是否需要重新构建：
- 前端代码：自动热重载
- Electron 主进程：需要 `npm run build:electron`
- 共享包：需要 `npm run build:packages`

### Q: 类型错误？

**A**: 运行类型检查：
```bash
npm run typecheck
```

### Q: 构建很慢？

**A**: 尝试清理缓存：
```bash
rm -rf node_modules/.vite
npm run build
```

### Q: Electron 窗口不显示？

**A**: 检查：
1. 构建产物是否存在：`ls apps/studio/dist-renderer/`
2. 主进程是否有错误：查看终端输出
3. 运行健康检查：`npm run doctor`

## 贡献指南

### 提交代码前

1. **运行检查**
   ```bash
   npm run typecheck
   npm run build
   npm run smoke
   ```

2. **确保代码格式正确**
   - 使用一致的缩进（2 空格）
   - 移除未使用的导入
   - 添加必要的注释

3. **测试功能**
   - 手动测试修改的功能
   - 确保没有破坏现有功能

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/my-feature

# 提交更改
git add .
git commit -m "feat: add my feature"

# 推送到远程
git push origin feature/my-feature
```

### 提交信息规范

使用语义化提交信息：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建或工具相关

## 资源链接

### 官方文档
- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/)

### 工具
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [VS Code](https://code.visualstudio.com/)

---

**版本**: 0.1.0-alpha  
**最后更新**: 2026-04-20
