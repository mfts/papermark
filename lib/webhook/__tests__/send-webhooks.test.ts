import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.hoisted ensures the mock fn is available when vi.mock factories run (hoisted above imports)
const { mockPublishJSON } = vi.hoisted(() => ({
  mockPublishJSON: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  qstash: { publishJSON: mockPublishJSON },
}));

// Mock @/lib/id-helper used by transform.ts
vi.mock("@/lib/id-helper", () => ({
  newId: () => "evt_test123",
}));

// Mock the signature module — we don't need real HMAC for this test
vi.mock("../signature", () => ({
  createWebhookSignature: vi.fn().mockResolvedValue("test-signature"),
}));

// Mock the Zod schema to pass through the payload as-is
vi.mock("@/lib/zod/schemas/webhooks", () => ({
  webhookPayloadSchema: {
    parse: (input: unknown) => input,
  },
}));

import { sendWebhooks } from "../send-webhooks";

const makeWebhook = (id: string) => ({
  pId: id,
  url: `https://example.com/webhook/${id}`,
  secret: "whsec_test",
});

const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

describe("sendWebhooks", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://app.papermark.io";
    mockPublishJSON.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    vi.restoreAllMocks();
  });

  it("delivers to all webhooks when all endpoints are healthy", async () => {
    mockPublishJSON.mockResolvedValue({ messageId: "msg_1" });

    const webhooks = [makeWebhook("wh_1"), makeWebhook("wh_2"), makeWebhook("wh_3")];

    const results = await sendWebhooks({
      webhooks,
      trigger: "link.viewed" as any,
      data: { viewId: "view_1" } as any,
    });

    expect(mockPublishJSON).toHaveBeenCalledTimes(3);
    expect(results).toHaveLength(3);
    expect(results!.every((r) => r.messageId === "msg_1")).toBe(true);
  });

  it("delivers remaining webhooks when one endpoint fails", async () => {
    mockPublishJSON
      .mockResolvedValueOnce({ messageId: "msg_1" })
      .mockRejectedValueOnce(new Error("429 Too Many Requests"))
      .mockResolvedValueOnce({ messageId: "msg_3" });

    const webhooks = [makeWebhook("wh_1"), makeWebhook("wh_2"), makeWebhook("wh_3")];

    const results = await sendWebhooks({
      webhooks,
      trigger: "link.viewed" as any,
      data: { viewId: "view_1" } as any,
    });

    // All 3 were attempted
    expect(mockPublishJSON).toHaveBeenCalledTimes(3);
    // Only 2 succeeded — the failed one is filtered out
    expect(results).toHaveLength(2);
    expect(results![0].messageId).toBe("msg_1");
    expect(results![1].messageId).toBe("msg_3");
  });

  it("logs failed deliveries with the webhook ID", async () => {
    const consoleSpy = vi.spyOn(console, "error");
    mockPublishJSON.mockRejectedValueOnce(new Error("rate limited"));

    const webhooks = [makeWebhook("wh_failing")];

    await sendWebhooks({
      webhooks,
      trigger: "link.viewed" as any,
      data: { viewId: "view_1" } as any,
    });

    // publishWebhookEventToQStash logs the error, then sendWebhooks also logs it
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("wh_failing"),
      expect.anything(),
    );
  });

  it("returns early for empty webhook list", async () => {
    const result = await sendWebhooks({
      webhooks: [],
      trigger: "link.viewed" as any,
      data: { viewId: "view_1" } as any,
    });

    expect(mockPublishJSON).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
