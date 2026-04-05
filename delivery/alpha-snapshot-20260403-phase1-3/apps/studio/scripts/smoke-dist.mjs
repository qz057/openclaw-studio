import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const rendererRoot = path.join(appRoot, "dist-renderer");
const electronRuntimePath = path.join(appRoot, "dist-electron", "electron", "runtime", "studio-runtime.js");
const sharedDistPath = path.join(repoRoot, "packages", "shared", "dist", "index.js");
const bridgeDistPath = path.join(repoRoot, "packages", "bridge", "dist", "index.js");

async function ensureFile(filePath) {
  await fs.access(filePath);
}

async function verifyRendererBuild() {
  const indexHtmlPath = path.join(rendererRoot, "index.html");
  await ensureFile(indexHtmlPath);

  const html = await fs.readFile(indexHtmlPath, "utf8");
  const assetReferences = Array.from(html.matchAll(/(?:src|href)="(.+?)"/g), (match) => match[1])
    .map((reference) => reference.replace(/^\//, ""))
    .filter((reference) => reference.startsWith("./") || reference.startsWith("assets/"));

  if (assetReferences.length === 0) {
    throw new Error("Renderer build is missing asset references in dist-renderer/index.html.");
  }

  for (const reference of assetReferences) {
    await ensureFile(path.join(rendererRoot, reference));
  }

  return {
    indexHtmlPath,
    assetCount: assetReferences.length
  };
}

async function verifyBridgeFallback() {
  await ensureFile(sharedDistPath);
  await ensureFile(bridgeDistPath);

  const bridgeModule = await import(pathToFileURL(bridgeDistPath).href);
  const snapshot = await bridgeModule.loadStudioSnapshot();

  if (!snapshot?.pages?.length) {
    throw new Error("Bridge fallback returned an empty shell state.");
  }

  return {
    appName: snapshot.appName,
    pageCount: snapshot.pages.length
  };
}

async function verifyElectronRuntime() {
  await ensureFile(electronRuntimePath);

  const { createStudioRuntime } = require(electronRuntimePath);
  const runtime = createStudioRuntime();
  const [shellState, sessions, codexTasks] = await Promise.all([
    runtime.getShellState(),
    runtime.listSessions(),
    runtime.listCodexTasks()
  ]);

  if (!shellState?.appName) {
    throw new Error("Electron runtime returned an invalid shell state.");
  }

  return {
    bridge: shellState.status.bridge,
    runtime: shellState.status.runtime,
    sessions: sessions.length,
    codexTasks: codexTasks.length
  };
}

async function main() {
  const renderer = await verifyRendererBuild();
  const bridge = await verifyBridgeFallback();
  const runtime = await verifyElectronRuntime();

  console.log("OpenClaw Studio alpha smoke passed.");
  console.log(`Renderer: ${renderer.indexHtmlPath} (${renderer.assetCount} assets)`);
  console.log(`Bridge fallback: ${bridge.appName} (${bridge.pageCount} pages)`);
  console.log(
    `Electron runtime: bridge=${runtime.bridge}, runtime=${runtime.runtime}, sessions=${runtime.sessions}, codexTasks=${runtime.codexTasks}`
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`OpenClaw Studio alpha smoke failed: ${message}`);
  process.exit(1);
});
