// 测试模型列表解析逻辑
const { spawn } = require('child_process');

const MODEL_ID_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

function filterModelLines(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes('\x1B['))
    .filter((line) => !line.includes('[plugins]') && !line.includes('[lcm]'))
    .filter((line) => !/^(Loading|Initializing|Starting|Loaded|Error|Warning|Info|Gateway target|Source|Config|Bind):/i.test(line))
    .filter((line) => MODEL_ID_PATTERN.test(line));
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Exit code ${code}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    child.on('error', reject);
  });
}

async function testModelParsing() {
  console.log('=== 测试 OpenClaw 模型解析 ===\n');

  try {
    const result = await runCommand('wsl.exe', [
      '-e', 'bash', '-lc', 'openclaw models list --plain'
    ]);

    console.log('原始输出:');
    console.log(result.stdout);
    console.log('\n---\n');

    // 模拟 listOpenClawModelIds 的解析逻辑
    const lines = filterModelLines(result.stdout);

    console.log(`解析后的模型列表 (${lines.length} 个):`);
    lines.forEach((line, i) => {
      console.log(`${i + 1}. ${line}`);
    });

    if (lines.length === 0) {
      console.log('\n✗ 警告：没有找到任何模型！');
      process.exitCode = 1;
    } else {
      console.log(`\n✓ 成功解析 ${lines.length} 个模型`);
    }

  } catch (error) {
    console.error('✗ 命令执行失败:', error.message);
    process.exitCode = 1;
  }
}

testModelParsing().catch(console.error);
