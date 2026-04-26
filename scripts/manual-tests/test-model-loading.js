// 测试模型加载功能
const { execSync } = require('child_process');

console.log("=== 测试 OpenClaw 模型列表加载 ===\n");

// 1. 测试命令行输出
console.log("1. 原始命令输出:");
try {
  const rawOutput = execSync('wsl.exe -e bash -lc "openclaw models list --plain"', {
    encoding: 'utf8',
    timeout: 45000
  });
  console.log(rawOutput);
  console.log("\n原始输出行数:", rawOutput.split('\n').length);
} catch (error) {
  console.error("命令执行失败:", error.message);
}

// 2. 测试过滤逻辑
console.log("\n2. 应用过滤逻辑后:");
try {
  const rawOutput = execSync('wsl.exe -e bash -lc "openclaw models list --plain"', {
    encoding: 'utf8',
    timeout: 45000
  });

  const modelIdPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

  const filtered = rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes("\x1B["))
    .filter((line) => !line.includes("[plugins]") && !line.includes("[lcm]"))
    .filter((line) => !line.match(/^(Loading|Initializing|Starting|Loaded|Error|Warning|Info):/i))
    .filter((line) => modelIdPattern.test(line));

  console.log("过滤后的模型列表:");
  filtered.forEach((model, index) => {
    console.log(`  ${index + 1}. ${model}`);
  });
  console.log("\n总计:", filtered.length, "个模型");
} catch (error) {
  console.error("过滤失败:", error.message);
}

// 3. 测试 Hermes 配置读取
console.log("\n3. Hermes 配置:");
try {
  const hermesConfig = execSync('wsl.exe -e bash -lc "cat ~/.hermes/config.yaml"', {
    encoding: 'utf8',
    timeout: 5000
  });

  const modelBlockMatch = hermesConfig.match(/^model:\n((?:^[ \t].*(?:\r?\n|$))*)/m);
  if (modelBlockMatch) {
    console.log("找到 model 配置块:");
    console.log(modelBlockMatch[0]);

    const provider = modelBlockMatch[1].match(/^\s+provider:\s*(.+)\s*$/m)?.[1]?.trim();
    const model = modelBlockMatch[1].match(/^\s+default:\s*(.+)\s*$/m)?.[1]?.trim();

    console.log("\n解析结果:");
    console.log("  Provider:", provider || "(未设置)");
    console.log("  Model:", model || "(未设置)");

    if (model) {
      const fullId = provider && provider !== "''" && provider !== '""'
        ? `${provider}/${model}`
        : model;
      console.log("  完整 ID:", fullId);
    }
  } else {
    console.log("未找到 model 配置块");
  }
} catch (error) {
  console.error("读取 Hermes 配置失败:", error.message);
}

console.log("\n=== 测试完成 ===");
