#!/usr/bin/env node

/**
 * OpenClaw Studio - 开发环境检查脚本
 * 检查开发环境是否正确配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 OpenClaw Studio - 开发环境检查\n');

let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, condition, details = '', isWarning = false) {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    if (isWarning) {
      console.log(`⚠️  ${name}`);
      if (details) console.log(`   ${details}`);
      warnings++;
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
      failed++;
    }
  }
}

// 检查 Node.js 版本
console.log('📦 检查运行时环境...\n');

try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  check(
    'Node.js 版本',
    majorVersion >= 18,
    `当前版本: ${nodeVersion} (需要 >= 18.x)`
  );
} catch (error) {
  check('Node.js 版本', false, 'Node.js 未安装');
}

try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  check('npm 版本', true, `当前版本: ${npmVersion}`);
} catch (error) {
  check('npm 版本', false, 'npm 未安装');
}

// 检查 Git
try {
  const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
  check('Git', true, gitVersion, true);
} catch (error) {
  check('Git', false, 'Git 未安装（可选）', true);
}

// 检查项目文件
console.log('\n📁 检查项目文件...\n');

const requiredFiles = [
  'package.json',
  'apps/studio/package.json',
  'apps/studio/src/App.tsx',
  'apps/studio/electron/main.ts',
  'packages/shared/src/index.ts',
  'packages/bridge/src/index.ts',
];

requiredFiles.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  check(file, fs.existsSync(fullPath));
});

// 检查依赖
console.log('\n📦 检查依赖安装...\n');

check(
  'node_modules',
  fs.existsSync(path.join(projectRoot, 'node_modules')),
  '运行 npm install 安装依赖'
);

const criticalDeps = [
  'electron',
  'react',
  'react-dom',
  'vite',
  'typescript',
];

criticalDeps.forEach(dep => {
  const depPath = path.join(projectRoot, 'node_modules', dep);
  check(`依赖: ${dep}`, fs.existsSync(depPath));
});

// 检查构建产物
console.log('\n🔨 检查构建产物...\n');

const buildArtifacts = [
  'apps/studio/dist-renderer',
  'apps/studio/dist-electron',
  'packages/shared/dist',
  'packages/bridge/dist',
];

let hasAllBuilds = true;
buildArtifacts.forEach(artifact => {
  const exists = fs.existsSync(path.join(projectRoot, artifact));
  if (!exists) hasAllBuilds = false;
  check(artifact, exists, exists ? '' : '运行 npm run build 构建', true);
});

// 检查 TypeScript 配置
console.log('\n⚙️  检查配置文件...\n');

const configFiles = [
  'tsconfig.base.json',
  'apps/studio/tsconfig.json',
  'apps/studio/tsconfig.app.json',
  'apps/studio/tsconfig.electron.json',
  'apps/studio/vite.config.mts',
];

configFiles.forEach(file => {
  check(file, fs.existsSync(path.join(projectRoot, file)));
});

// 运行类型检查
console.log('\n🔍 运行类型检查...\n');

try {
  execSync('npm run typecheck', {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  check('TypeScript 类型检查', true, '所有类型检查通过');
} catch (error) {
  check('TypeScript 类型检查', false, '存在类型错误，运行 npm run typecheck 查看详情');
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('📊 检查结果\n');
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`⚠️  警告: ${warnings}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ 开发环境存在问题，请修复后再继续');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  开发环境基本正常，但有一些警告');
  console.log('💡 建议：');
  if (!hasAllBuilds) {
    console.log('   - 运行 npm run build 构建项目');
  }
  console.log('   - 查看上面的警告信息');
} else {
  console.log('\n✅ 开发环境完全正常！');
  console.log('\n💡 下一步：');
  console.log('   - npm run start    # 启动应用');
  console.log('   - npm run build    # 构建项目');
  console.log('   - npm run doctor   # 运行健康检查');
}
