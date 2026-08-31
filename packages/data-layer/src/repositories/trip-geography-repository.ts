import type { CreateTripCityInput, CreateTripCountryInput, TripCity, TripCountry } from "@travel-app/shared-types";

export interface TripGeographyRepository {
  listCountries(params: { tripId: string }): Promise<TripCountry[]>;
  listCities(params: { tripId: string }): Promise<TripCity[]>;
  addCountry(params: { input: CreateTripCountryInput }): Promise<TripCountry>;
  addCity(params: { input: CreateTripCityInput }): Promise<TripCity>;
  deleteCountry(params: { countryId: string }): Promise<void>;
  deleteCity(params: { cityId: string }): Promise<void>;
}
