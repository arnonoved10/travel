import { randomUUID } from "node:crypto";
import type { TripPlace, TripPlaceStatus } from "@travel-app/shared-types";
import type { TripPlaceRepository, TripPlaceWithPlace } from "./trip-place-repository";
import { mockPlaceRepository } from "./place-repository.mock";

export class MockTripPlaceRepository implements TripPlaceRepository {
  private tripPlaces = new Map<string, TripPlace>();

  async listForTrip({ userId, tripId }: { userId: string; tripId: string }): Promise<TripPlaceWithPlace[]> {
    const links = Array.from(this.tripPlaces.values()).filter((tp) => tp.tripId === tripId);
    const results: TripPlaceWithPlace[] = [];
    for (const link of links) {
      const place = await mockPlaceRepository.getById({ userId, placeId: link.placeId });
      if (place) results.push({ ...link, place });
    }
    return results;
  }

  async listForTrips({ userId, tripIds }: { userId: string; tripIds: string[] }): Promise<TripPlaceWithPlace[]> {
    const idSet = new Set(tripIds);
    const links = Array.from(this.tripPlaces.values()).filter((tp) => idSet.has(tp.tripId));
    const results: TripPlaceWithPlace[] = [];
    for (const link of links) {
      const place = await mockPlaceRepository.getById({ userId, placeId: link.placeId });
      if (place) results.push({ ...link, place });
    }
    return results;
  }

  async linkPlaceToTrip({
    userId,
    tripId,
    placeId,
    status,
  }: {
    userId: string;
    tripId: string;
    placeId: string;
    status: TripPlaceStatus;
  }): Promise<TripPlace> {
    const place = await mockPlaceRepository.getById({ userId, placeId });
    if (!place) {
      throw new Error("place not found or not owned by user");
    }

    const existing = Array.from(this.tripPlaces.values()).find((tp) => tp.tripId === tripId && tp.placeId === placeId);
    if (existing) {
      const updated: TripPlace = { ...existing, status };
      this.tripPlaces.set(existing.id, updated);
      return updated;
    }

    const tripPlace: TripPlace = { id: randomUUID(), tripId, placeId, status, notes: null };
    this.tripPlaces.set(tripPlace.id, tripPlace);
    return tripPlace;
  }
}

export const mockTripPlaceRepository = new MockTripPlaceRepository();
