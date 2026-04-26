#!/usr/bin/env node

/**
 * OpenClaw Studio - 快速重建脚本
 * 清理构建产物并重新构建（保留依赖）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

console.log('🔄 OpenClaw Studio - 快速重建\n');

const pathsToRemove = [
  'apps/studio/dist-renderer',
  'apps/studio/dist-electron',
  'packages/shared/dist',
  'packages/bridge/dist',
  '.vite',
  'apps/studio/.vite',
];

console.log('🧹 清理构建产物...\n');

pathsToRemove.forEach(relativePath => {
  const fullPath = path.join(projectRoot, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log(`   删除: ${relativePath}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('\n🔨 重新构建项目...\n');

try {
  execSync('npm run build', {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  console.log('\n✅ 构建完成！');
  console.log('\n💡 运行 npm run start 启动应用');
} catch (error) {
  console.error('\n❌ 构建失败');
  process.exit(1);
}
