import { describe, expect, it } from "vitest";
import { celsiusToFahrenheit, formatTemperature } from "./temperature-format";

describe("celsiusToFahrenheit", () => {
  it("converts 0°C to 32°F", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  it("converts 100°C to 212°F", () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it("converts a negative value correctly", () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
});

describe("formatTemperature", () => {
  it("formats celsius with rounding and the °C symbol", () => {
    expect(formatTemperature(31.6, "celsius")).toBe("32°C");
  });

  it("formats fahrenheit with rounding and the °F symbol", () => {
    expect(formatTemperature(31.6, "fahrenheit")).toBe("89°F");
  });
});
