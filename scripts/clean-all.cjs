#!/usr/bin/env node

/**
 * OpenClaw Studio - 完整清理脚本
 * 清理所有构建产物、缓存和依赖
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

console.log('🧹 OpenClaw Studio - 完整清理\n');

const pathsToRemove = [
  // 根目录
  'node_modules',
  'package-lock.json',

  // Studio 应用
  'apps/studio/node_modules',
  'apps/studio/dist-renderer',
  'apps/studio/dist-electron',
  'apps/studio/.packaging',

  // Shared 包
  'packages/shared/node_modules',
  'packages/shared/dist',

  // Bridge 包
  'packages/bridge/node_modules',
  'packages/bridge/dist',

  // 缓存
  '.vite',
  'apps/studio/.vite',
];

let removedCount = 0;
let skippedCount = 0;

pathsToRemove.forEach(relativePath => {
  const fullPath = path.join(projectRoot, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  删除: ${relativePath}`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removedCount++;
    } catch (error) {
      console.error(`❌ 删除失败: ${relativePath}`, error.message);
    }
  } else {
    skippedCount++;
  }
});

console.log(`\n✅ 清理完成！`);
console.log(`   删除: ${removedCount} 项`);
console.log(`   跳过: ${skippedCount} 项（不存在）`);

console.log('\n📦 重新安装依赖...\n');

try {
  execSync('npm install', {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  console.log('\n✅ 依赖安装完成！');
  console.log('\n💡 下一步：运行 npm run build 构建项目');
} catch (error) {
  console.error('\n❌ 依赖安装失败');
  process.exit(1);
}
