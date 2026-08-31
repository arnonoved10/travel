import { describe, expect, it } from "vitest";
import { wmoCodeToCondition } from "./wmo-codes";

describe("wmoCodeToCondition", () => {
  it("maps 0 to clear sky", () => {
    expect(wmoCodeToCondition(0)).toEqual({ condition: "בהיר", icon: "☀️" });
  });

  it("maps 95 to thunderstorm", () => {
    expect(wmoCodeToCondition(95).condition).toBe("סופת רעמים");
  });

  it("falls back to 'לא ידוע' for an unrecognized code instead of guessing", () => {
    expect(wmoCodeToCondition(9999)).toEqual({ condition: "לא ידוע", icon: "❓" });
  });
});
