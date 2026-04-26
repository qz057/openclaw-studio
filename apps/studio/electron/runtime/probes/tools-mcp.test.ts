import { describe, expect, it } from "vitest";
import { createToolsMcpLocalControlSession, runToolsMcpAction } from "./tools-mcp";

describe("tools MCP host executor boundary", () => {
  it("blocks preview-host handoffs behind the disabled executor contract", async () => {
    const session = createToolsMcpLocalControlSession();
    const result = await runToolsMcpAction("mcp-adjacent-runtime", "preview-host-lane-apply", session);

    expect(result).not.toBeNull();
    expect(result?.execution).toMatchObject({
      status: "blocked",
      safety: "preview-host",
      detailRefresh: "not-needed"
    });
    expect(result?.hostPreview?.status).toBe("withheld");
    expect(result?.hostHandoff?.simulated).toBe(true);
    expect(result?.hostHandoff?.approval.decision).toBe("withheld");
    expect(result?.boundary?.hostExecutor.mode).toBe("disabled");
    expect(result?.boundary?.hostExecutor.defaultEnabled).toBe(false);
    expect(result?.boundary?.hostExecutor.mutationSlots.every((slot) => slot.state === "withheld" && !slot.defaultEnabled)).toBe(true);
    expect(result?.boundary?.hostExecutor.bridge.mode).toBe("disabled");
    expect(result?.boundary?.hostExecutor.bridge.slotHandlers.every((handler) => handler.state === "registered" && !handler.defaultEnabled)).toBe(true);
    expect(result?.notices?.some((notice) => notice.includes("No host-side state was touched"))).toBe(true);
  });

  it("keeps executable connector controls inside Studio-local session state", async () => {
    const session = createToolsMcpLocalControlSession();
    const localResult = await runToolsMcpAction("mcp-adjacent-runtime", "execute-local-bridge-stage", session);
    const previewResult = await runToolsMcpAction("mcp-adjacent-runtime", "preview-host-bridge-attach", session);

    expect(localResult).not.toBeNull();
    expect(localResult?.execution).toMatchObject({
      status: "completed",
      safety: "local-only",
      detailRefresh: "required"
    });
    expect(session.executionCount).toBe(1);
    expect(session.bridgeStage.executedAt).not.toBeNull();
    expect(previewResult?.execution.status).toBe("blocked");
    expect(previewResult?.boundary?.currentLayer).toBe("preview-host");
    expect(previewResult?.boundary?.hostExecutor.mode).toBe("disabled");
    expect(previewResult?.hostHandoff?.simulated).toBe(true);
  });
});
