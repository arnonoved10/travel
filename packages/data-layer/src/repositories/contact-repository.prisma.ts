// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { Contact, CreateContactInput } from "@travel-app/shared-types";
import { createContactInputSchema } from "@travel-app/shared-types";
import { ContactNotFoundError, type ContactRepository } from "./contact-repository";

function toContact(row: {
  id: string;
  userId: string;
  tripId: string | null;
  name: string;
  company: string | null;
  role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  category: string | null;
  notes: string | null;
  deletedAt: Date | null;
}): Contact {
  return {
    ...row,
    category: row.category as Contact["category"],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<Contact[]> {
    const rows = await this.prisma.contact.findMany({
      where: { userId, ...(includeDeleted ? {} : { deletedAt: null }) },
    });
    return rows.map(toContact);
  }

  async getById({ userId, contactId }: { userId: string; contactId: string }): Promise<Contact | null> {
    const row = await this.prisma.contact.findFirst({ where: { id: contactId, userId } });
    return row ? toContact(row) : null;
  }

  async create({ userId, input }: { userId: string; input: CreateContactInput }): Promise<Contact> {
    const parsed = createContactInputSchema.parse(input);
    const row = await this.prisma.contact.create({ data: { userId, ...parsed } });
    return toContact(row);
  }

  async softDelete({ userId, contactId }: { userId: string; contactId: string }): Promise<Contact> {
    const existing = await this.prisma.contact.findFirst({ where: { id: contactId, userId } });
    if (!existing) throw new ContactNotFoundError(contactId);

    const row = await this.prisma.contact.update({ where: { id: contactId }, data: { deletedAt: new Date() } });
    return toContact(row);
  }

  async restore({ userId, contactId }: { userId: string; contactId: string }): Promise<Contact> {
    const existing = await this.prisma.contact.findFirst({ where: { id: contactId, userId } });
    if (!existing) throw new ContactNotFoundError(contactId);

    const row = await this.prisma.contact.update({ where: { id: contactId }, data: { deletedAt: null } });
    return toContact(row);
  }
}
