import { describe, expect, it } from "vitest";
import { suggestDocumentChecksForCountries } from "./document-check-suggestions";

describe("suggestDocumentChecksForCountries", () => {
  it("suggests one checklist item per country, with a non-authoritative search link", () => {
    const result = suggestDocumentChecksForCountries(["יפן", "תאילנד"]);

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toContain("יפן");
    expect(result[0]?.reason).toContain("לא מידע רשמי");
    expect(result[0]?.checkUrl).toMatch(/^https:\/\/www\.google\.com\/search\?q=/);
  });

  it("de-duplicates repeated country names", () => {
    const result = suggestDocumentChecksForCountries(["צרפת", "צרפת"]);

    expect(result).toHaveLength(1);
  });

  it("ignores blank entries", () => {
    const result = suggestDocumentChecksForCountries(["", "   "]);

    expect(result).toEqual([]);
  });

  it("returns an empty list when the trip has no countries", () => {
    expect(suggestDocumentChecksForCountries([])).toEqual([]);
  });
});
