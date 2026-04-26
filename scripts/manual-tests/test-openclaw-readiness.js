const { spawn } = require("child_process");

async function testAvailability() {
  console.log("测试 OpenClaw 可用性检查...\n");

  const code = await new Promise((resolve, reject) => {
    const proc = spawn("wsl.exe", ["-e", "bash", "-lc", "command -v openclaw >/dev/null 2>&1"]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", reject);

    proc.on("close", (nextCode) => {
      console.log(`退出码: ${nextCode}`);
      console.log(`stdout: "${stdout}"`);
      console.log(`stderr: "${stderr}"`);
      resolve(nextCode ?? 1);
    });
  });

  if (code === 0) {
    console.log("\n✅ OpenClaw 可用性检查通过");
    console.log("应该返回: canSend: true");
    return;
  }

  console.log("\n❌ OpenClaw 可用性检查失败");
  console.log("应该返回: canSend: false");
  process.exitCode = 1;
}

testAvailability().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
