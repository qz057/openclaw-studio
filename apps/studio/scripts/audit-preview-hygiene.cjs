const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FINDINGS = 40;

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isProbablyText(buffer) {
  if (buffer.includes(0)) {
    return false;
  }

  return true;
}

function collectFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function buildForbiddenPatterns(repoRoot) {
  const userName = process.env.USERNAME || os.userInfo().username;
  const homeDir = os.homedir();
  const repoPath = repoRoot;

  return [
    { id: "current-windows-home", regex: new RegExp(escapeRegExp(homeDir), "i") },
    { id: "current-repo-root", regex: new RegExp(escapeRegExp(repoPath), "i") },
    { id: "current-repo-root-posix", regex: new RegExp(escapeRegExp(toPosix(repoPath)), "i") },
    { id: "wsl-user-home-unc", regex: new RegExp(`\\\\\\\\wsl(?:\\.localhost)?\\\\[^\\\\]+\\\\home\\\\${escapeRegExp(userName)}\\\\`, "i") },
    { id: "mock-hermes-session", regex: /\bmock-session-1\b/i },
    { id: "mock-message-body", regex: /\bHello from mock mode\b|\bThis is a mock response\b/i }
  ];
}

function scanRoot(root, repoRoot, patterns) {
  const findings = [];
  for (const filePath of collectFiles(root)) {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    if (!isProbablyText(buffer)) {
      continue;
    }

    const text = buffer.toString("utf8");
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        findings.push({
          pattern: pattern.id,
          file: path.relative(repoRoot, filePath)
        });
        break;
      }
    }

    if (findings.length >= MAX_FINDINGS) {
      return findings;
    }
  }

  return findings;
}

function main() {
  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const roots = [
    path.join(appRoot, "dist-electron"),
    path.join(appRoot, "dist-renderer"),
    path.join(repoRoot, "packages", "bridge", "dist"),
    path.join(appRoot, ".packaging", "windows-local", "app")
  ];
  const patterns = buildForbiddenPatterns(repoRoot);
  const findings = roots.flatMap((root) => scanRoot(root, repoRoot, patterns));

  if (findings.length > 0) {
    console.error("Preview hygiene audit failed. Packaged app contains local residue:");
    for (const finding of findings) {
      console.error(`- ${finding.pattern}: ${finding.file}`);
    }
    process.exit(1);
  }

  console.log("Preview hygiene audit passed: no local user/repo residue or mock session payloads found in build outputs.");
}

main();
