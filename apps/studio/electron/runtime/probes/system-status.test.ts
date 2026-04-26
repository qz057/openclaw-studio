import { afterEach, describe, expect, it } from "vitest";
import { collectGatewayCandidateUrls } from "./system-status";

const originalGatewayUrl = process.env.OPENCLAW_STUDIO_GATEWAY_URL;
const originalPlatform = process.platform;

function setPlatform(value: NodeJS.Platform) {
  Object.defineProperty(process, "platform", {
    configurable: true,
    value
  });
}

afterEach(() => {
  if (originalGatewayUrl === undefined) {
    delete process.env.OPENCLAW_STUDIO_GATEWAY_URL;
  } else {
    process.env.OPENCLAW_STUDIO_GATEWAY_URL = originalGatewayUrl;
  }

  setPlatform(originalPlatform);
});

describe("system-status gateway candidates", () => {
  it("prefers an explicit gateway URL while keeping local fallbacks", async () => {
    setPlatform("linux");
    process.env.OPENCLAW_STUDIO_GATEWAY_URL = "http://gateway.example:19999/";

    await expect(collectGatewayCandidateUrls()).resolves.toEqual([
      "http://gateway.example:19999/",
      "http://127.0.0.1:18789/",
      "http://localhost:18789/"
    ]);
  });

  it("checks localhost before WSL-only addresses by default", async () => {
    setPlatform("linux");
    delete process.env.OPENCLAW_STUDIO_GATEWAY_URL;

    await expect(collectGatewayCandidateUrls()).resolves.toEqual([
      "http://127.0.0.1:18789/",
      "http://localhost:18789/"
    ]);
  });
});
