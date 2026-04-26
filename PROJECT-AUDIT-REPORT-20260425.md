# OpenClaw Studio 项目审计与修复报告

日期：2026-04-25
范围：全项目审计，重点覆盖 `apps/studio/src`、`apps/studio/electron`、`packages/*`、构建脚本、Electron 启动预检、Hermes/WSL 后台数据读取路径。

## 本轮已执行的真实验证

已执行 TypeScript 类型检查：`npm run typecheck`，结果通过。已执行前端与桥接测试：`npm run test --workspace @openclaw/studio -- --run`，结果为 6 个测试文件、63 个测试全部通过。已执行构建验证：`OPENCLAW_STUDIO_EMPTY_OUTDIR=0 npm run build`，结果通过，renderer 与 electron 产物均成功生成。已执行运行预检：`npm run doctor`，构建产物与 Electron 可用性通过；当前环境没有 `DISPLAY` 或 `WAYLAND_DISPLAY`，因此桌面窗口启动仍被预检阻止，这是运行环境限制，不是代码构建失败。

## 已修复问题

修复了 renderer 构建在当前挂载目录中因清空旧产物失败而中断的问题。原始 `npm run build` 在 Vite 清空 `apps/studio/dist-renderer` 时触发 `EPERM: operation not permitted, unlink ...`，导致构建无法继续。现在 `apps/studio/vite.config.mts` 支持通过 `OPENCLAW_STUDIO_EMPTY_OUTDIR=0` 跳过清空输出目录，用于权限受限或产物被占用的本地验证场景；默认行为仍保持清空输出目录，避免常规构建残留旧文件。

修复了 Electron 预检脚本只检查文件名、不检查二进制平台兼容性的风险。当前依赖中同时存在 app workspace 下的 Windows `electron.exe` 和根目录 Linux `electron`，预检原本可能只依据文件存在性得出误导性结果。现在 `apps/studio/scripts/studio-preflight.cjs` 会读取二进制头，区分 Linux ELF 与 Windows PE，并只选择与当前平台兼容的 Electron；不兼容候选会在错误信息中明确列出。

修复了 Hermes WSL 数据读取器中的硬编码用户路径和 shell 拼接读取。原 `apps/studio/electron/runtime/wsl-hermes-reader.ts` 固定使用 `/home/qz057/.hermes` 并通过 `bash -lc cat ...` 读取 gateway/channel 文件，这会在非该用户名环境失效，也增加 shell 拼接风险。现在读取逻辑改为通过 WSL Python 使用 `Path.home() / '.hermes'` 定位数据文件，避免硬编码用户名，并与现有 session SQLite 读取方式保持一致。

清理了 `wsl-hermes-reader.ts` 中不再使用的 `path` import 与 `execWSL` 方法，避免死代码继续掩盖真实后台数据路径问题。

## 仍需注意的问题

当前 `npm run doctor` 显示 `Display ready: no`，原因是执行环境没有 Linux 图形会话变量，也未检测到 WSLg socket。要真实启动 Electron 窗口，需要在桌面/WSL 环境中设置 `DISPLAY` 或 `WAYLAND_DISPLAY`，或者启动 WSLg/X Server 后再运行 `npm start`。

普通 `npm run build` 默认仍会让 Vite 清空 `dist-renderer`。如果旧产物被 Windows 进程、杀毒、文件同步或挂载权限锁定，仍可能出现 `EPERM unlink`。本轮提供的可验证绕过方式是 `OPENCLAW_STUDIO_EMPTY_OUTDIR=0 npm run build`。如果要彻底避免该类问题，建议后续将构建输出改为临时目录后原子替换，或在 Windows 原生环境运行清理/构建流程。

后台真实连接只验证到本地命令、构建产物、预检与代码路径层面；未启动实际 Hermes/OpenClaw Gateway 进行 WebSocket 交互，因为当前环境没有可用桌面会话，且不应在未确认服务状态时主动写入或启动外部服务。

## 修改文件

本轮修改了 `apps/studio/vite.config.mts`、`apps/studio/scripts/studio-preflight.cjs`、`apps/studio/electron/runtime/wsl-hermes-reader.ts`。

## 建议下一步

在你的实际 Windows/WSL 桌面环境中，先运行 `npm run doctor` 确认 Display ready，然后运行 `npm start` 做 UI 启动验证。如果遇到 `dist-renderer` 清理权限问题，可先用 `OPENCLAW_STUDIO_EMPTY_OUTDIR=0 npm run build` 完成构建验证；如果要做发布构建，建议先确保没有 Electron 或资源管理器占用 `apps/studio/dist-renderer`。
