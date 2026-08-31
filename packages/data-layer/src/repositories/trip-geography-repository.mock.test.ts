import { beforeEach, describe, expect, it } from "vitest";
import { MockTripGeographyRepository } from "./trip-geography-repository.mock";

const tripId = "77777777-7777-4777-8777-777777777777";

describe("MockTripGeographyRepository", () => {
  let repo: MockTripGeographyRepository;

  beforeEach(() => {
    repo = new MockTripGeographyRepository();
  });

  it("adds a country and lists it for the trip", async () => {
    const country = await repo.addCountry({ input: { tripId, countryName: "יפן" } });
    const countries = await repo.listCountries({ tripId });
    expect(countries.map((c) => c.id)).toContain(country.id);
    expect(countries.map((c) => c.countryName)).toContain("יפן");
  });

  it("adds a city linked to a country and lists it for the trip", async () => {
    const country = await repo.addCountry({ input: { tripId, countryName: "יפן" } });
    const city = await repo.addCity({ input: { tripId, countryId: country.id, cityName: "טוקיו" } });
    const cities = await repo.listCities({ tripId });
    expect(cities.map((c) => c.id)).toContain(city.id);
    expect(cities.find((c) => c.id === city.id)?.countryId).toBe(country.id);
  });

  it("allows a city without a linked country", async () => {
    const city = await repo.addCity({ input: { tripId, cityName: "עיר ללא מדינה" } });
    expect(city.countryId).toBeNull();
  });

  it("deletes a country and a city", async () => {
    const country = await repo.addCountry({ input: { tripId, countryName: "יפן" } });
    const city = await repo.addCity({ input: { tripId, cityName: "טוקיו" } });

    await repo.deleteCountry({ countryId: country.id });
    await repo.deleteCity({ cityId: city.id });

    const countries = await repo.listCountries({ tripId });
    const cities = await repo.listCities({ tripId });
    expect(countries.map((c) => c.id)).not.toContain(country.id);
    expect(cities.map((c) => c.id)).not.toContain(city.id);
  });

  it("isolates countries/cities between trips", async () => {
    const otherTripId = "88888888-8888-4888-8888-888888888888";
    await repo.addCountry({ input: { tripId, countryName: "יפן" } });
    const otherTripCountries = await repo.listCountries({ tripId: otherTripId });
    expect(otherTripCountries).toHaveLength(0);
  });
});
