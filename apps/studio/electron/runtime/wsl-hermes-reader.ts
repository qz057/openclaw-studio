import { execFileSync } from "child_process";

export interface HermesMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  tool_calls?: any[];
  tool_results?: any[];
}

export interface HermesSession {
  id: string;
  name: string;
  messages: HermesMessage[];
  lastModified: Date;
  messageCount?: number;
  model?: string | null;
  source?: string | null;
}

/**
 * WSL Hermes 数据读取器
 * 通过 wsl.exe 访问 Linux 文件系统中的 Hermes 数据
 */
export class WSLHermesReader {
  /**
   * 在 WSL 执行 Python 代码（不通过 shell 进行参数拼接）
   */
  private execWSLPython(script: string, args: string[] = []): string {
    try {
      const result = execFileSync("wsl.exe", ["-e", "python3", "-c", script, ...args], {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });
      return result;
    } catch (error: any) {
      throw new Error(`WSL Python 执行失败: ${error.message}`);
    }
  }

  /**
   * 列出所有会话文件
   */
  async listSessions(): Promise<{ id: string; name: string; lastModified: Date; messageCount: number; model: string | null; source: string | null }[]> {
    try {
      const output = this.execWSLPython(`
import json
import sqlite3
import time
from pathlib import Path

db = Path.home() / '.hermes' / 'state.db'
if not db.exists():
    print('[]')
    raise SystemExit

conn = sqlite3.connect(str(db))
conn.row_factory = sqlite3.Row
rows = conn.execute(
    "SELECT id, source, model, started_at, ended_at, message_count, title FROM sessions WHERE source = ? ORDER BY started_at DESC LIMIT 50",
    ('cli',)
).fetchall()

payload = []
for row in rows:
    ts = row['ended_at'] if row['ended_at'] is not None else row['started_at']
    payload.append(
        {
            'id': row['id'],
            'name': row['title'] or row['id'],
            'timestamp_ms': int((ts or time.time()) * 1000),
            'message_count': int(row['message_count'] or 0),
            'model': row['model'],
            'source': row['source']
        }
    )

print(json.dumps(payload, ensure_ascii=False))
`);

      const parsed = JSON.parse(output || "[]") as Array<{
        id?: string;
        name?: string;
        timestamp_ms?: number;
        message_count?: number;
        model?: string | null;
        source?: string | null;
      }>;

      return parsed
        .filter((session): session is { id: string; name?: string; timestamp_ms?: number; message_count?: number; model?: string | null; source?: string | null } => Boolean(session?.id))
        .map((session) => ({
          id: session.id,
          name: session.name || session.id,
          lastModified: new Date(session.timestamp_ms ?? Date.now()),
          messageCount: session.message_count ?? 0,
          model: session.model ?? null,
          source: session.source ?? null,
        }));
    } catch {
      return [];
    }
  }

  /**
   * 读取会话文件内容
   */
  async readSession(sessionId: string): Promise<HermesSession | null> {
    try {
      const encodedSessionId = Buffer.from(sessionId, "utf8").toString("base64");
      const content = this.execWSLPython(
        `
import base64
import json
import sqlite3
import sys
import time
from pathlib import Path

if len(sys.argv) < 2:
    raise SystemExit

session_id = base64.b64decode(sys.argv[1]).decode('utf-8').strip()
db = Path.home() / '.hermes' / 'state.db'
if not db.exists():
    print('')
    raise SystemExit

conn = sqlite3.connect(str(db))
conn.row_factory = sqlite3.Row
session = conn.execute(
    "SELECT id, source, model, started_at, ended_at, message_count, title FROM sessions WHERE id = ?",
    (session_id,)
).fetchone()
if not session:
    print('')
    raise SystemExit

messages = conn.execute(
    "SELECT role, content, timestamp, tool_calls FROM messages WHERE session_id = ? ORDER BY timestamp ASC, id ASC",
    (session_id,)
).fetchall()
payload = {
    'id': session['id'],
    'name': session['title'] or session['id'],
    'source': session['source'],
    'model': session['model'],
    'message_count': int(session['message_count'] or 0),
    'timestamp_ms': int(((session['ended_at'] if session['ended_at'] is not None else session['started_at']) or time.time()) * 1000),
    'messages': [
        {
            'role': row['role'],
            'content': row['content'] or '',
            'timestamp': row['timestamp'],
            'tool_calls': json.loads(row['tool_calls']) if row['tool_calls'] else None
        }
        for row in messages
    ]
}
print(json.dumps(payload, ensure_ascii=False))
`,
        [encodedSessionId]
      );

      if (!content.trim()) {
        return null;
      }

      const parsed = JSON.parse(content) as {
        id: string;
        name?: string;
        source?: string | null;
        model?: string | null;
        message_count?: number;
        timestamp_ms?: number;
        messages?: HermesMessage[];
      };
      const messages = Array.isArray(parsed.messages) ? parsed.messages : [];

      return {
        id: parsed.id,
        name: parsed.name || parsed.id,
        messages,
        lastModified: new Date(parsed.timestamp_ms ?? Date.now()),
        messageCount: parsed.message_count ?? messages.length,
        model: parsed.model ?? null,
        source: parsed.source ?? null,
      };
    } catch {
      return null;
    }
  }

  async createSession(modelId?: string | null): Promise<{ id: string; name: string; lastModified: Date }> {
    try {
      const encodedModelId = Buffer.from(modelId ?? "", "utf8").toString("base64");
      const output = this.execWSLPython(
        `
import base64
import json
import secrets
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path.home() / '.hermes' / 'hermes-agent'))
from hermes_state import SessionDB

model_id = base64.b64decode(sys.argv[1]).decode('utf-8').strip() if len(sys.argv) > 1 else None
if not model_id:
  model_id = None

session_id = time.strftime('%Y%m%d_%H%M%S') + '_' + secrets.token_hex(3)
db = SessionDB()
db.create_session(
    session_id=session_id,
    source='cli',
    model=model_id,
    model_config={'model': model_id} if model_id else None,
    system_prompt=None,
)

print(json.dumps({'id': session_id, 'name': session_id, 'timestamp_ms': int(time.time() * 1000)}, ensure_ascii=False))
        `,
        [encodedModelId]
      );

      const parsed = JSON.parse(output) as { id?: string; name?: string; timestamp_ms?: number };

      if (!parsed.id) {
        throw new Error("Hermes 会话创建返回无效应答。");
      }

      return {
        id: parsed.id,
        name: parsed.name || parsed.id,
        lastModified: new Date(parsed.timestamp_ms ?? Date.now())
      };
    } catch (error: any) {
      console.error("创建 Hermes 会话失败:", error);
      throw new Error(`创建 Hermes 会话失败: ${error.message ?? "请检查 WSL Hermes 服务是否可用。"}`);
    }
  }

  /**
   * 获取最新的会话
   */
  async getLatestSession(): Promise<HermesSession | null> {
    const sessions = await this.listSessions();
    if (sessions.length === 0) {
      return null;
    }

    // 返回第一个（ls -lt 已按时间排序）
    const firstSession = sessions[0];
    if (!firstSession) {
      return null;
    }
    return this.readSession(firstSession.id);
  }

  /**
   * 读取 Gateway 状态
   */
  async getGatewayState(): Promise<any> {
    try {
      const content = this.execWSLPython(`
import json
from pathlib import Path
state_path = Path.home() / '.hermes' / 'gateway_state.json'
print(state_path.read_text(encoding='utf-8') if state_path.exists() else '{}')
`);
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * 读取频道目录
   */
  async getChannelDirectory(): Promise<any> {
    try {
      const content = this.execWSLPython(`
import json
from pathlib import Path
directory_path = Path.home() / '.hermes' / 'channel_directory.json'
print(directory_path.read_text(encoding='utf-8') if directory_path.exists() else '{}')
`);
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
}

// 单例
export const wslHermesReader = new WSLHermesReader();
