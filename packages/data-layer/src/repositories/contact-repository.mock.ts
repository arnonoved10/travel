import { randomUUID } from "node:crypto";
import type { Contact, CreateContactInput } from "@travel-app/shared-types";
import { createContactInputSchema } from "@travel-app/shared-types";
import { ContactNotFoundError, type ContactRepository } from "./contact-repository";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export class MockContactRepository implements ContactRepository {
  private contacts = new Map<string, Contact>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedContacts: Array<Omit<Contact, "id">> = [
      {
        userId: DEMO_USER_ID,
        tripId: null,
        name: "[דמו] נהג טוקטוק — סומצ'אי",
        company: null,
        role: "נהג",
        phone: "+66 81 234 5678",
        whatsapp: "+66 81 234 5678",
        email: null,
        website: null,
        category: "driver",
        notes: "נתוני דמה לצורך פיתוח UI בלבד.",
        deletedAt: null,
      },
      {
        userId: DEMO_USER_ID,
        tripId: null,
        name: "[דמו] סוכנות ביטוח נסיעות",
        company: "Demo Travel Insurance",
        role: null,
        phone: "+972 3 1234567",
        whatsapp: null,
        email: "demo@example.com",
        website: null,
        category: "insurance",
        notes: "נתוני דמה לצורך פיתוח UI בלבד.",
        deletedAt: null,
      },
    ];

    for (const contact of seedContacts) {
      const id = randomUUID();
      this.contacts.set(id, { ...contact, id });
    }
  }

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<Contact[]> {
    return Array.from(this.contacts.values())
      .filter((c) => c.userId === userId)
      .filter((c) => includeDeleted || c.deletedAt === null);
  }

  async getById({ userId, contactId }: { userId: string; contactId: string }): Promise<Contact | null> {
    const contact = this.contacts.get(contactId);
    if (!contact || contact.userId !== userId) return null;
    return contact;
  }

  async create({ userId, input }: { userId: string; input: CreateContactInput }): Promise<Contact> {
    const parsed = createContactInputSchema.parse(input);
    const contact: Contact = {
      id: randomUUID(),
      userId,
      tripId: parsed.tripId ?? null,
      name: parsed.name,
      company: parsed.company ?? null,
      role: parsed.role ?? null,
      phone: parsed.phone ?? null,
      whatsapp: parsed.whatsapp ?? null,
      email: parsed.email ?? null,
      website: parsed.website ?? null,
      category: parsed.category ?? null,
      notes: parsed.notes ?? null,
      deletedAt: null,
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async softDelete({ userId, contactId }: { userId: string; contactId: string }): Promise<Contact> {
    const existing = await this.getById({ userId, contactId });
    if (!existing) throw new ContactNotFoundError(contactId);

    const updated: Contact = { ...existing, deletedAt: new Date().toISOString() };
    this.contacts.set(contactId, updated);
    return updated;
  }

  async restore({ userId, contactId }: { userId: string; contactId: string }): Promise<Contact> {
    const existing = await this.getById({ userId, contactId });
    if (!existing) throw new ContactNotFoundError(contactId);

    const updated: Contact = { ...existing, deletedAt: null };
    this.contacts.set(contactId, updated);
    return updated;
  }
}

export const mockContactRepository = new MockContactRepository();
