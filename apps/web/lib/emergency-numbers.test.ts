import { describe, expect, it } from "vitest";
import { getEmergencyNumbersForCountry, DEFAULT_EMERGENCY_NUMBERS } from "./emergency-numbers";

describe("getEmergencyNumbersForCountry", () => {
  it("returns known numbers for a country in the table", () => {
    const result = getEmergencyNumbersForCountry("תאילנד");
    expect(result.police).toBe("191");
    expect(result.ambulance).toBe("1669");
  });

  it("falls back to the default 112 reference for an unknown country rather than fabricating one", () => {
    const result = getEmergencyNumbersForCountry("נרניה");
    expect(result).toBe(DEFAULT_EMERGENCY_NUMBERS);
  });

  it("falls back to default when no country is known at all", () => {
    expect(getEmergencyNumbersForCountry(null)).toBe(DEFAULT_EMERGENCY_NUMBERS);
  });

  it("trims whitespace before matching", () => {
    const result = getEmergencyNumbersForCountry("  ישראל  ");
    expect(result.police).toBe("100");
  });
});
