const testOutput = `[35m[plugins][39m [36m[lcm] Ignoring sessions matching 1 pattern(s): agent:*:cron:**[39m
[35m[plugins][39m [36m[lcm] Stateless session patterns: 1 pattern(s): agent:*:subagent:**[39m
[35m[plugins][39m [36m[lcm] Plugin loaded (enabled=true, db=/home/qz057/.openclaw/lcm-enhanced.db, threshold=0.75)[39m
[35m[plugins][39m [36m[lcm] Compaction summarization model: openai-codex/gpt-5.4 (override)[39m
relay/gpt-5.4
babycookbook/claude-sonnet-4-6
babycookbook/claude-3-7-sonnet-20250219
babycookbook/claude-3-5-haiku-20241022
openai-codex/gpt-5.4
relay/gpt-5.3-codex
anthropic/claude-opus-4-6
self_gateway/chat_default
self_gateway/cheap_default
self_gateway/reasoning_default
self_gateway/local_default
self_gateway/uncensored_default
self_gateway/local_fast
self_gateway/local_uncensored_max
babycookbook/claude-3-5-sonnet-20241022
babycookbook/claude-opus-4-6`;

const modelIdPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

const filtered = testOutput
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  // 排除 ANSI 颜色代码
  .filter((line) => !line.includes("\x1B["))
  // 排除插件日志和其他非模型输出
  .filter((line) => !line.includes("[plugins]") && !line.includes("[lcm]"))
  // 排除以常见日志关键字开头的行
  .filter((line) => !line.match(/^(Loading|Initializing|Starting|Loaded|Error|Warning|Info):/i))
  // 使用正则表达式验证模型 ID 格式
  .filter((line) => modelIdPattern.test(line));

console.log("Filtered models:");
console.log(filtered);
console.log("\nTotal models found:", filtered.length);
