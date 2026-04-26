// 测试 Hermes 模型加载
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
        reject(new Error(`Exit code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    child.on('error', reject);
  });
}

async function testOpenClawModels() {
  console.log('测试 OpenClaw 模型列表...');
  try {
    const result = await runCommand('wsl.exe', [
      '-e', 'bash', '-lc', 'openclaw models list --plain'
    ]);
    const models = filterModelLines(result.stdout);
    console.log(`✓ 找到 ${models.length} 个 OpenClaw 模型`);
    console.log('前5个模型:', models.slice(0, 5));
    return models;
  } catch (error) {
    console.error('✗ OpenClaw 模型加载失败:', error.message);
    return [];
  }
}

async function testHermesConfig() {
  console.log('\n测试 Hermes 配置...');
  try {
    const result = await runCommand('wsl.exe', [
      '-e', 'bash', '-lc', 'cat ~/.hermes/config.yaml'
    ]);
    const config = result.stdout;
    const modelMatch = config.match(/model:\s*\n\s+default:\s*(\S+)\s*\n\s+provider:\s*(\S+)/);
    if (modelMatch) {
      const model = modelMatch[1];
      const provider = modelMatch[2];
      console.log(`✓ Hermes 默认模型: ${provider}/${model}`);
      return `${provider}/${model}`;
    } else {
      console.log('✗ 无法解析 Hermes 配置');
      return null;
    }
  } catch (error) {
    console.error('✗ Hermes 配置读取失败:', error.message);
    return null;
  }
}

async function testGatewayStatus() {
  console.log('\n测试网关状态...');

  // OpenClaw Gateway
  try {
    const result = await runCommand('wsl.exe', [
      '-e', 'bash', '-lc', 'openclaw gateway status --json'
    ]);
    const status = JSON.parse(result.stdout);
    const running = status.service?.runtime?.status === 'running' || status.rpc?.ok === true;
    console.log(`${running ? '✓' : '✗'} OpenClaw Gateway: ${running ? '运行中' : '未运行'}`);
  } catch (error) {
    console.error('✗ OpenClaw Gateway 状态检查失败');
  }

  // Hermes Gateway
  try {
    const result = await runCommand('wsl.exe', [
      '-e', 'bash', '-lc', 'hermes gateway status'
    ]);
    const running = /active \(running\)|gateway service is running/i.test(result.stdout + result.stderr);
    console.log(`${running ? '✓' : '✗'} Hermes Gateway: ${running ? '运行中' : '未运行'}`);
  } catch (error) {
    console.error('✗ Hermes Gateway 状态检查失败');
  }
}

async function main() {
  console.log('=== Hermes 模型加载诊断 ===\n');

  await testGatewayStatus();
  const openclawModels = await testOpenClawModels();
  const hermesModel = await testHermesConfig();

  console.log('\n=== 诊断总结 ===');
  console.log(`OpenClaw 模型数量: ${openclawModels.length}`);
  console.log(`Hermes 默认模型: ${hermesModel || '未配置'}`);

  if (openclawModels.length > 0 && hermesModel) {
    console.log('\n✓ 模型配置正常，应该能在界面中显示');
  } else {
    console.log('\n✗ 模型配置有问题，需要检查');
  }
}

main().catch(console.error);
