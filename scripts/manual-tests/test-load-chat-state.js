const path = require("path");

// 模拟 Electron 环境
global.process.platform = "win32";

const repoRoot = path.resolve(__dirname, "..", "..");

async function testLoadChatState() {
  console.log("测试 loadOpenClawChatState 函数...\n");

  try {
    // 动态导入编译后的模块
    const modulePath = path.join(repoRoot, "apps/studio/dist-electron/electron/runtime/probes/openclaw-chat.js");
    const { loadOpenClawChatState } = require(modulePath);

    console.log("调用 loadOpenClawChatState(null)...");
    const state = await loadOpenClawChatState(null);

    console.log("\n返回的状态:");
    console.log(JSON.stringify(state, null, 2));

    console.log("\n关键字段:");
    console.log(`  canSend: ${state.canSend}`);
    console.log(`  availability: ${state.availability}`);
    console.log(`  readinessLabel: ${state.readinessLabel}`);
    console.log(`  disabledReason: ${state.disabledReason}`);

    if (state.canSend) {
      console.log("\n✅ 状态正常，应该可以发送消息");
    } else {
      console.log("\n❌ 状态异常，无法发送消息");
      console.log(`   原因: ${state.disabledReason}`);
    }
  } catch (error) {
    console.error("错误:", error.message);
    console.error(error.stack);
    process.exitCode = 1;
  }
}

testLoadChatState();
