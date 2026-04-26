# Repository Codex Instructions

## Long Task Context Hygiene

This repository has repeatedly hit Codex Desktop standalone auto-compaction hangs on long UI/refactor tasks. Keep future turns compact by default.

- Prefer `rg`, `rg --files`, and narrow line windows over full-file dumps.
- Do not use `Get-Content -Raw` on large source, CSS, JSON, report, or log files unless the file is known to be small.
- For large files, inspect with targeted ranges, for example `Get-Content file | Select-Object -Skip 120 -First 80`.
- Do not print screenshot base64, image data URLs, full Playwright traces, or full generated JSON reports into the conversation.
- Save large verification artifacts to files and report only the path plus a short summary.
- When reading validation reports, project only the needed fields instead of round-tripping the whole JSON through `ConvertTo-Json`.
- Keep command output under roughly 200 lines. If more is needed, write it to a workspace report file and summarize.
- Before continuing a thread that is already near compaction, start a fresh continuation thread with a concise handoff summary.
- For long UI work, split by phase: audit, implementation, verification, screenshot review, and closeout. Avoid mixing all evidence into one turn.
- If the estimated context is near 200k tokens or repeated token counts exceed 220k, stop and create a fresh handoff instead of forcing auto-compaction.

