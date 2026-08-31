import type { WeatherUnit } from "@/lib/preferences/types";

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(celsius: number, unit: WeatherUnit): string {
  const value = unit === "fahrenheit" ? celsiusToFahrenheit(celsius) : celsius;
  const symbol = unit === "fahrenheit" ? "°F" : "°C";
  return `${Math.round(value)}${symbol}`;
}
