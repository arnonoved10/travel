import { describe, expect, it } from "vitest";
import type { TripCountry } from "@travel-app/shared-types";
import { computePreferredCurrencyCodes } from "./preferred-currencies";

function makeCountry(overrides: Partial<TripCountry> = {}): TripCountry {
  return { id: "country-1", tripId: "trip-1", countryName: "תאילנד", orderIndex: 0, ...overrides };
}

describe("computePreferredCurrencyCodes", () => {
  it("puts USD/EUR/ILS first (in that order) even with no countries", () => {
    expect(computePreferredCurrencyCodes([])).toEqual(["USD", "EUR", "ILS"]);
  });

  it("prepends the recognized local currency before the base three", () => {
    const result = computePreferredCurrencyCodes([makeCountry({ countryName: "תאילנד" })]);
    expect(result).toEqual(["THB", "USD", "EUR", "ILS"]);
  });

  it("orders multiple countries by orderIndex, not insertion order", () => {
    const result = computePreferredCurrencyCodes([
      makeCountry({ id: "c2", countryName: "יוון", orderIndex: 1 }),
      makeCountry({ id: "c1", countryName: "תאילנד", orderIndex: 0 }),
    ]);
    expect(result).toEqual(["THB", "EUR", "USD", "ILS"]);
  });

  it("skips unrecognized country names without throwing", () => {
    const result = computePreferredCurrencyCodes([makeCountry({ countryName: "ארץ בדיונית שלא קיימת" })]);
    expect(result).toEqual(["USD", "EUR", "ILS"]);
  });

  it("deduplicates when the local currency is already USD or EUR, keeping it first", () => {
    const result = computePreferredCurrencyCodes([makeCountry({ countryName: "יוון" })]);
    expect(result).toEqual(["EUR", "USD", "ILS"]);
  });
});
