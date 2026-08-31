import { afterEach, describe, expect, it, vi } from "vitest";
import { BoiFrankfurterCurrencyRateProvider } from "./boi-frankfurter-provider";

function stubFetch(handler: (url: string) => { ok: boolean; body: unknown }): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = input.toString();
      const { ok, body } = handler(url);
      return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
    }),
  );
}

describe("BoiFrankfurterCurrencyRateProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves a currency covered by Bank of Israel from the BOI table", async () => {
    stubFetch((url) => {
      if (url.includes("boi.org.il")) {
        return { ok: true, body: { exchangeRates: [{ key: "USD", currentExchangeRate: 3.7, unit: 1, lastUpdate: "2026-08-16" }] } };
      }
      return { ok: false, body: {} };
    });
    const provider = new BoiFrankfurterCurrencyRateProvider();

    const snapshots = await provider.getRatesToILS(["USD"]);

    expect(snapshots).toEqual([{ currencyCode: "USD", rateToILS: 3.7, asOf: "2026-08-16", source: "boi" }]);
  });

  it("normalizes BOI rates quoted per multiple units", async () => {
    stubFetch((url) => {
      if (url.includes("boi.org.il")) {
        return { ok: true, body: { exchangeRates: [{ key: "JPY", currentExchangeRate: 250, unit: 100, lastUpdate: "2026-08-16" }] } };
      }
      return { ok: false, body: {} };
    });
    const provider = new BoiFrankfurterCurrencyRateProvider();

    const snapshots = await provider.getRatesToILS(["JPY"]);

    expect(snapshots[0]?.rateToILS).toBe(2.5);
  });

  it("falls back to Frankfurter for a currency Bank of Israel does not publish (e.g. THB)", async () => {
    stubFetch((url) => {
      if (url.includes("boi.org.il")) {
        return { ok: true, body: { exchangeRates: [{ key: "USD", currentExchangeRate: 3.7, unit: 1, lastUpdate: "2026-08-16" }] } };
      }
      if (url.includes("frankfurter") && url.includes("base=THB")) {
        return { ok: true, body: { date: "2026-08-16", rates: { ILS: 0.106 } } };
      }
      return { ok: false, body: {} };
    });
    const provider = new BoiFrankfurterCurrencyRateProvider();

    const snapshots = await provider.getRatesToILS(["THB"]);

    expect(snapshots).toEqual([{ currencyCode: "THB", rateToILS: 0.106, asOf: "2026-08-16", source: "frankfurter" }]);
  });

  it("never fabricates a rate — a currency both sources fail on is simply omitted", async () => {
    stubFetch(() => ({ ok: false, body: {} }));
    const provider = new BoiFrankfurterCurrencyRateProvider();

    const snapshots = await provider.getRatesToILS(["XYZ"]);

    expect(snapshots).toEqual([]);
  });

  it("returns ILS as rate 1 without making a network request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new BoiFrankfurterCurrencyRateProvider();

    const snapshots = await provider.getRatesToILS(["ILS"]);

    expect(snapshots).toEqual([{ currencyCode: "ILS", rateToILS: 1, asOf: expect.any(String), source: "boi" }]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
