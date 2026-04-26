import fs from "node:fs/promises";
import path from "node:path";
import type { SettingItem } from "@openclaw/shared";
import type { LiveCodexProbe } from "./codex";
import type { LiveSessionProbe } from "./sessions";

export interface ProjectContextProbe {
  source: "live" | "mock";
  summary: string;
  notes: SettingItem[];
}

const contextDocFiles = [
  { id: "readme", label: "README.md", relativePath: "README.md" },
  { id: "handoff", label: "HANDOFF.md", relativePath: "HANDOFF.md" },
  { id: "implementation", label: "IMPLEMENTATION-PLAN.md", relativePath: "IMPLEMENTATION-PLAN.md" }
] as const;

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findRepoRoot(startDirectory: string): Promise<string | null> {
  let current = startDirectory;

  for (;;) {
    const hasReadme = await pathExists(path.join(current, "README.md"));
    const hasStudioApp = await pathExists(path.join(current, "apps", "studio", "package.json"));
    const hasSharedPackage = await pathExists(path.join(current, "packages", "shared", "package.json"));

    if (hasReadme && hasStudioApp && hasSharedPackage) {
      return current;
    }

    const parent = path.dirname(current);

    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function extractDocSnippet(content: string): string {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("```"))
    .filter((line) => !line.startsWith("- "))
    .filter((line) => !line.startsWith("* "));

  const snippet = lines[0] ?? "No concise summary available.";
  return snippet.length > 180 ? `${snippet.slice(0, 177)}...` : snippet;
}

async function readDocSummary(repoRoot: string, relativePath: string): Promise<{ present: boolean; snippet: string }> {
  const filePath = path.join(repoRoot, relativePath);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return {
      present: true,
      snippet: extractDocSnippet(content)
    };
  } catch {
    return {
      present: false,
      snippet: "不可用"
    };
  }
}

async function readGitBranch(repoRoot: string): Promise<string | null> {
  try {
    const headPath = path.join(repoRoot, ".git", "HEAD");
    const rawHead = (await fs.readFile(headPath, "utf8")).trim();

    if (rawHead.startsWith("ref:")) {
      return rawHead.split("/").pop() ?? null;
    }

    return rawHead ? `detached:${rawHead.slice(0, 7)}` : null;
  } catch {
    return null;
  }
}

async function countDirectories(rootPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).length;
  } catch {
    return 0;
  }
}

export async function probeProjectContext(
  sessionProbe: LiveSessionProbe,
  codexProbe: LiveCodexProbe
): Promise<ProjectContextProbe> {
  const repoRoot = await findRepoRoot(process.cwd());

  if (!repoRoot) {
    return {
      source: "mock",
      summary:
        "仓库本地上下文内存不可用，因此 shell 保持在回退上下文注释上，同时保持会话和 Codex 观察分离。",
      notes: [
        {
          id: "codex-context-repo",
          label: "仓库上下文",
          value: "不可用",
          detail: "运行时无法从当前工作目录解析 OpenClaw Studio 仓库根目录。",
          tone: "warning"
        }
      ]
    };
  }

  const [docSummaries, branch, appCount, packageCount] = await Promise.all([
    Promise.all(contextDocFiles.map((entry) => readDocSummary(repoRoot, entry.relativePath))),
    readGitBranch(repoRoot),
    countDirectories(path.join(repoRoot, "apps")),
    countDirectories(path.join(repoRoot, "packages"))
  ]);

  const docsPresentCount = docSummaries.filter((summary) => summary.present).length;
  const latestSession = sessionProbe.sessionRecords[0] ?? null;
  const latestTask = codexProbe.tasks[0] ?? null;

  return {
    source: "live",
    summary:
      `仓库本地上下文组装现在结合了 ${docsPresentCount} 个稳定项目文档、${branch ? `git 分支 ${branch}` : "无 git 分支元数据"}、` +
      `${sessionProbe.sessions.length} 个最近会话和 ${codexProbe.tasks.length} 个最近 Codex 任务，无需引入单独的内存存储。`,
    notes: [
      {
        id: "codex-context-docs",
        label: "文档",
        value: `${docsPresentCount} 个核心文档`,
        detail: contextDocFiles
          .map((entry, index) => `${entry.label}: ${docSummaries[index]?.snippet ?? "不可用"}`)
          .join(" · "),
        tone: docsPresentCount === contextDocFiles.length ? "positive" : "neutral"
      },
      {
        id: "codex-context-git",
        label: "Git / 布局",
        value: branch ? `分支 ${branch}` : "Git 元数据不可用",
        detail: `${repoRoot} · 应用 ${appCount} · 包 ${packageCount}`,
        tone: branch ? "positive" : "neutral"
      },
      {
        id: "codex-context-session",
        label: "会话连续性",
        value: `${sessionProbe.sessions.length} 个会话 · ${codexProbe.tasks.length} 个 Codex 任务`,
        detail:
          latestSession && latestTask
            ? `${latestSession.title} -> ${latestTask.title}`
            : latestSession
              ? latestSession.title
              : latestTask
                ? latestTask.title
                : "No recent session continuity signal was available.",
        tone: latestSession || latestTask ? "positive" : "neutral"
      },
      {
        id: "codex-context-focus",
        label: "Project focus",
        value: latestTask?.target ?? "Context docs",
        detail: docSummaries[1]?.snippet ?? docSummaries[0]?.snippet ?? "No project focus summary available.",
        tone: "neutral"
      }
    ]
  };
}
