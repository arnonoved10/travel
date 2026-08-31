import { describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  it("writes info messages to console.log as structured JSON", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.info("trip created", { tripId: "abc-123" });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("trip created");
    expect(parsed.tripId).toBe("abc-123");
    expect(typeof parsed.timestamp).toBe("string");

    spy.mockRestore();
  });

  it("writes error messages to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("db connection failed");

    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
