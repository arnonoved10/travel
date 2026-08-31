import { randomUUID } from "node:crypto";
import type { CreateTripCityInput, CreateTripCountryInput, TripCity, TripCountry } from "@travel-app/shared-types";
import { createTripCityInputSchema, createTripCountryInputSchema } from "@travel-app/shared-types";
import type { TripGeographyRepository } from "./trip-geography-repository";

const DEMO_TRIP_ID = "00000000-0000-4000-8000-000000000101"; // [דמו] טיול לתאילנד

export class MockTripGeographyRepository implements TripGeographyRepository {
  private countries = new Map<string, TripCountry>();
  private cities = new Map<string, TripCity>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const country: TripCountry = { id: randomUUID(), tripId: DEMO_TRIP_ID, countryName: "תאילנד", orderIndex: 0 };
    this.countries.set(country.id, country);

    const cityNames = ["בנגקוק", "פאטאיה"];
    cityNames.forEach((cityName, index) => {
      const city: TripCity = { id: randomUUID(), tripId: DEMO_TRIP_ID, countryId: country.id, cityName, orderIndex: index };
      this.cities.set(city.id, city);
    });
  }

  async listCountries({ tripId }: { tripId: string }): Promise<TripCountry[]> {
    return Array.from(this.countries.values())
      .filter((c) => c.tripId === tripId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async listCities({ tripId }: { tripId: string }): Promise<TripCity[]> {
    return Array.from(this.cities.values())
      .filter((c) => c.tripId === tripId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async addCountry({ input }: { input: CreateTripCountryInput }): Promise<TripCountry> {
    const parsed = createTripCountryInputSchema.parse(input);
    const orderIndex = Array.from(this.countries.values()).filter((c) => c.tripId === parsed.tripId).length;
    const country: TripCountry = { id: randomUUID(), tripId: parsed.tripId, countryName: parsed.countryName, orderIndex };
    this.countries.set(country.id, country);
    return country;
  }

  async addCity({ input }: { input: CreateTripCityInput }): Promise<TripCity> {
    const parsed = createTripCityInputSchema.parse(input);
    const orderIndex = Array.from(this.cities.values()).filter((c) => c.tripId === parsed.tripId).length;
    const city: TripCity = { id: randomUUID(), tripId: parsed.tripId, countryId: parsed.countryId ?? null, cityName: parsed.cityName, orderIndex };
    this.cities.set(city.id, city);
    return city;
  }

  async deleteCountry({ countryId }: { countryId: string }): Promise<void> {
    this.countries.delete(countryId);
  }

  async deleteCity({ cityId }: { cityId: string }): Promise<void> {
    this.cities.delete(cityId);
  }
}

export const mockTripGeographyRepository = new MockTripGeographyRepository();
