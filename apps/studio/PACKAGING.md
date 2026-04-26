# 打包和分发指南

## 概述

OpenClaw Studio 使用 electron-builder 进行多平台打包和分发。

## 打包命令

### 完整打包（当前平台）
```bash
npm run dist --workspace @openclaw/studio
```

### Windows 打包
```bash
npm run dist:win --workspace @openclaw/studio
```

生成的安装包：
- NSIS 安装程序：`release/OpenClaw Studio-{version}-win-x64.exe`
- 便携版：`release/OpenClaw Studio-{version}-portable.exe`
- ZIP 压缩包：`release/OpenClaw Studio-{version}-win-x64.zip`

### macOS 打包
```bash
npm run dist:mac --workspace @openclaw/studio
```

生成的安装包：
- DMG 镜像：`release/OpenClaw Studio-{version}-mac-{arch}.dmg`
- ZIP 压缩包：`release/OpenClaw Studio-{version}-mac-{arch}.zip`

### Linux 打包
```bash
npm run dist:linux --workspace @openclaw/studio
```

生成的安装包：
- AppImage：`release/OpenClaw Studio-{version}-linux-x64.AppImage`
- DEB 包：`release/openclaw-studio_{version}_amd64.deb`
- RPM 包：`release/openclaw-studio-{version}.x86_64.rpm`

### 仅构建目录（不打包）
```bash
npm run dist:dir --workspace @openclaw/studio
```

用于快速测试，生成未打包的应用目录。

## 构建前准备

### 1. 确保所有依赖已安装
```bash
npm install
```

### 2. 运行类型检查
```bash
npm run typecheck --workspace @openclaw/studio
```

### 3. 运行测试
```bash
npm run test --workspace @openclaw/studio
```

### 4. 准备图标资源

将以下图标文件放入 `apps/studio/build/` 目录：

- **Windows**: `icon.ico` (256x256 或更高)
- **macOS**: `icon.icns` (包含多种尺寸)
- **Linux**: `icons/` 目录，包含多种尺寸的 PNG 文件
  - 16x16.png
  - 32x32.png
  - 48x48.png
  - 64x64.png
  - 128x128.png
  - 256x256.png
  - 512x512.png

## 配置文件

### electron-builder.json

主配置文件，定义了所有平台的打包选项：

- **appId**: 应用唯一标识符
- **productName**: 产品名称
- **files**: 要包含的文件
- **asar**: 是否使用 ASAR 打包
- **compression**: 压缩级别（normal/maximum）

### 平台特定配置

#### Windows (win)
- **target**: nsis, portable, zip
- **icon**: 应用图标
- **publisherName**: 发布者名称

#### macOS (mac)
- **target**: dmg, zip
- **category**: 应用分类
- **hardenedRuntime**: 启用加固运行时
- **entitlements**: 权限配置文件

#### Linux (linux)
- **target**: AppImage, deb, rpm
- **category**: Development
- **maintainer**: 维护者信息

## 自动更新（未启用）

当前配置中 `publish: null`，表示未启用自动更新。

要启用自动更新，需要：

1. 配置发布服务器（GitHub Releases, S3, 等）
2. 更新 electron-builder.json 中的 publish 配置
3. 在应用中集成 electron-updater

示例配置：
```json
{
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "openclaw-studio"
  }
}
```

## 代码签名

### Windows

需要代码签名证书（.pfx 或 .p12）：

```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-password
npm run dist:win
```

### macOS

需要 Apple Developer 证书：

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password
export APPLE_ID=your-apple-id@example.com
export APPLE_ID_PASSWORD=app-specific-password
npm run dist:mac
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run dist --workspace @openclaw/studio
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: release-${{ matrix.os }}
          path: apps/studio/release/*
```

## 故障排除

### 构建失败

1. **依赖问题**：删除 node_modules 和 package-lock.json，重新安装
2. **TypeScript 错误**：运行 `npm run typecheck` 检查类型错误
3. **内存不足**：增加 Node.js 内存限制 `NODE_OPTIONS=--max-old-space-size=4096`

### 打包体积过大

1. 检查 files 配置，排除不必要的文件
2. 启用 asar 打包
3. 使用 maximum 压缩级别
4. 排除开发依赖

### 应用无法启动

1. 检查 main 字段指向正确的入口文件
2. 确保所有运行时依赖都已包含
3. 检查 extraResources 配置

## 版本管理

更新版本号：

```bash
# 在 apps/studio/package.json 中更新 version 字段
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0
```

## 发布检查清单

- [ ] 更新版本号
- [ ] 运行完整测试套件
- [ ] 运行类型检查
- [ ] 更新 CHANGELOG.md
- [ ] 准备发布说明
- [ ] 构建所有平台安装包
- [ ] 测试安装包
- [ ] 创建 Git 标签
- [ ] 上传到发布平台
- [ ] 发布公告

## 参考资源

- [electron-builder 文档](https://www.electron.build/)
- [Electron 打包指南](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [代码签名指南](https://www.electron.build/code-signing)
