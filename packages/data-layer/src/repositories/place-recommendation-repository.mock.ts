import { randomUUID } from "node:crypto";
import type { PlaceRecommendation, PlaceRecommendationItemInput } from "@travel-app/shared-types";
import type { PlaceRecommendationRepository } from "./place-recommendation-repository";

export class MockPlaceRecommendationRepository implements PlaceRecommendationRepository {
  private recommendations = new Map<string, PlaceRecommendation>();

  async listForTrip({ tripId }: { tripId: string }): Promise<PlaceRecommendation[]> {
    return Array.from(this.recommendations.values())
      .filter((r) => r.tripId === tripId)
      .sort((a, b) => a.scopeLabel.localeCompare(b.scopeLabel) || b.createdAt.localeCompare(a.createdAt));
  }

  async replaceForTrip({
    tripId,
    scopeLabel,
    items,
  }: {
    tripId: string;
    scopeLabel: string;
    items: PlaceRecommendationItemInput[];
  }): Promise<PlaceRecommendation[]> {
    for (const existing of Array.from(this.recommendations.values())) {
      if (existing.tripId === tripId && existing.scopeLabel === scopeLabel) this.recommendations.delete(existing.id);
    }

    const created = items.map((item) => {
      const recommendation: PlaceRecommendation = {
        id: randomUUID(),
        tripId,
        scopeLabel,
        category: item.category,
        name: item.name,
        address: item.address,
        rating: item.rating,
        userRatingsTotal: item.userRatingsTotal,
        mapsUrl: item.mapsUrl,
        photoUrl: item.photoUrl,
        createdAt: new Date().toISOString(),
      };
      this.recommendations.set(recommendation.id, recommendation);
      return recommendation;
    });

    return created;
  }

  async clearForTrip({ tripId }: { tripId: string }): Promise<void> {
    for (const existing of Array.from(this.recommendations.values())) {
      if (existing.tripId === tripId) this.recommendations.delete(existing.id);
    }
  }
}

export const mockPlaceRecommendationRepository = new MockPlaceRecommendationRepository();
