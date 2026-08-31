import { randomUUID } from "node:crypto";
import type { CreatePlaceInput, Place } from "@travel-app/shared-types";
import { createPlaceInputSchema } from "@travel-app/shared-types";
import { PlaceNotFoundError, type PlaceRepository } from "./place-repository";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export class MockPlaceRepository implements PlaceRepository {
  private places = new Map<string, Place>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();
    const seedPlaces: Array<Omit<Place, "id" | "createdAt" | "updatedAt">> = [
      {
        userId: DEMO_USER_ID,
        name: "[דמו] מלון באנגקוק",
        category: "hotel",
        address: null,
        country: "תאילנד",
        city: "בנגקוק",
        lat: 13.7563,
        lng: 100.5018,
        officialWebsite: null,
        phone: null,
        whatsapp: null,
        email: null,
        openingHours: null,
        generalNotes: "נתוני דמה לצורך פיתוח UI בלבד.",
        isFavorite: true,
        dontReturn: false,
        personalRating: null,
        mapLink: null,
        deletedAt: null,
      },
      {
        userId: DEMO_USER_ID,
        name: "[דמו] מסעדת סטריט פוד",
        category: "restaurant",
        address: null,
        country: "תאילנד",
        city: "בנגקוק",
        lat: 13.7367,
        lng: 100.5231,
        officialWebsite: null,
        phone: null,
        whatsapp: null,
        email: null,
        openingHours: { sun: null, mon: { open: "10:00", close: "22:00" }, tue: { open: "10:00", close: "22:00" }, wed: { open: "10:00", close: "22:00" }, thu: { open: "10:00", close: "22:00" }, fri: { open: "10:00", close: "22:00" }, sat: { open: "10:00", close: "22:00" } },
        generalNotes: "נתוני דמה לצורך פיתוח UI בלבד.",
        isFavorite: false,
        dontReturn: false,
        personalRating: null,
        mapLink: null,
        deletedAt: null,
      },
      {
        userId: DEMO_USER_ID,
        name: "[דמו] חוף בפאטאיה",
        category: "beach",
        address: null,
        country: "תאילנד",
        city: "פאטאיה",
        lat: 12.9236,
        lng: 100.8825,
        officialWebsite: null,
        phone: null,
        whatsapp: null,
        email: null,
        openingHours: null,
        generalNotes: "נתוני דמה לצורך פיתוח UI בלבד.",
        isFavorite: false,
        dontReturn: false,
        personalRating: null,
        mapLink: null,
        deletedAt: null,
      },
    ];

    for (const place of seedPlaces) {
      const id = randomUUID();
      this.places.set(id, { ...place, id, createdAt: now, updatedAt: now });
    }
  }

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<Place[]> {
    return Array.from(this.places.values())
      .filter((p) => p.userId === userId)
      .filter((p) => includeDeleted || p.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById({ userId, placeId }: { userId: string; placeId: string }): Promise<Place | null> {
    const place = this.places.get(placeId);
    if (!place || place.userId !== userId) return null;
    return place;
  }

  async listByIds({ placeIds }: { placeIds: string[] }): Promise<Place[]> {
    const idSet = new Set(placeIds);
    return Array.from(this.places.values()).filter((p) => idSet.has(p.id));
  }

  async create({ userId, input }: { userId: string; input: CreatePlaceInput }): Promise<Place> {
    const parsed = createPlaceInputSchema.parse(input);
    const now = new Date().toISOString();
    const place: Place = {
      id: randomUUID(),
      userId,
      name: parsed.name,
      category: parsed.category,
      address: parsed.address ?? null,
      country: parsed.country ?? null,
      city: parsed.city ?? null,
      lat: parsed.lat ?? null,
      lng: parsed.lng ?? null,
      officialWebsite: parsed.officialWebsite ?? null,
      phone: parsed.phone ?? null,
      whatsapp: parsed.whatsapp ?? null,
      email: parsed.email ?? null,
      openingHours: parsed.openingHours ?? null,
      generalNotes: parsed.generalNotes ?? null,
      isFavorite: false,
      dontReturn: false,
      personalRating: null,
      mapLink: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.places.set(place.id, place);
    return place;
  }

  async softDelete({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.getById({ userId, placeId });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const updated: Place = { ...existing, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.places.set(placeId, updated);
    return updated;
  }

  async restore({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.getById({ userId, placeId });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const updated: Place = { ...existing, deletedAt: null, updatedAt: new Date().toISOString() };
    this.places.set(placeId, updated);
    return updated;
  }

  async toggleFavorite({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.getById({ userId, placeId });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const updated: Place = { ...existing, isFavorite: !existing.isFavorite, updatedAt: new Date().toISOString() };
    this.places.set(placeId, updated);
    return updated;
  }

  async toggleDontReturn({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.getById({ userId, placeId });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const updated: Place = { ...existing, dontReturn: !existing.dontReturn, updatedAt: new Date().toISOString() };
    this.places.set(placeId, updated);
    return updated;
  }

  async setPersonalRating({
    userId,
    placeId,
    personalRating,
  }: {
    userId: string;
    placeId: string;
    personalRating: number | null;
  }): Promise<Place> {
    const existing = await this.getById({ userId, placeId });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const updated: Place = { ...existing, personalRating, updatedAt: new Date().toISOString() };
    this.places.set(placeId, updated);
    return updated;
  }
}

export const mockPlaceRepository = new MockPlaceRepository();
