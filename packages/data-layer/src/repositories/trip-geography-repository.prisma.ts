// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateTripCityInput, CreateTripCountryInput, TripCity, TripCountry } from "@travel-app/shared-types";
import { createTripCityInputSchema, createTripCountryInputSchema } from "@travel-app/shared-types";
import type { TripGeographyRepository } from "./trip-geography-repository";

function toTripCountry(row: { id: string; tripId: string; countryName: string; orderIndex: number }): TripCountry {
  return row;
}

function toTripCity(row: { id: string; tripId: string; countryId: string | null; cityName: string; orderIndex: number }): TripCity {
  return row;
}

export class PrismaTripGeographyRepository implements TripGeographyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listCountries({ tripId }: { tripId: string }): Promise<TripCountry[]> {
    const rows = await this.prisma.tripCountry.findMany({ where: { tripId }, orderBy: { orderIndex: "asc" } });
    return rows.map(toTripCountry);
  }

  async listCities({ tripId }: { tripId: string }): Promise<TripCity[]> {
    const rows = await this.prisma.tripCity.findMany({ where: { tripId }, orderBy: { orderIndex: "asc" } });
    return rows.map(toTripCity);
  }

  async addCountry({ input }: { input: CreateTripCountryInput }): Promise<TripCountry> {
    const parsed = createTripCountryInputSchema.parse(input);
    const orderIndex = await this.prisma.tripCountry.count({ where: { tripId: parsed.tripId } });
    const row = await this.prisma.tripCountry.create({ data: { tripId: parsed.tripId, countryName: parsed.countryName, orderIndex } });
    return toTripCountry(row);
  }

  async addCity({ input }: { input: CreateTripCityInput }): Promise<TripCity> {
    const parsed = createTripCityInputSchema.parse(input);
    const orderIndex = await this.prisma.tripCity.count({ where: { tripId: parsed.tripId } });
    const row = await this.prisma.tripCity.create({
      data: { tripId: parsed.tripId, countryId: parsed.countryId, cityName: parsed.cityName, orderIndex },
    });
    return toTripCity(row);
  }

  async deleteCountry({ countryId }: { countryId: string }): Promise<void> {
    await this.prisma.tripCountry.delete({ where: { id: countryId } });
  }

  async deleteCity({ cityId }: { cityId: string }): Promise<void> {
    await this.prisma.tripCity.delete({ where: { id: cityId } });
  }
}
