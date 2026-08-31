import type { Contact, CreateContactInput } from "@travel-app/shared-types";

/** אותו עיקרון כמו PlaceRepository — ראה place-repository.ts. tripId אופציונלי (איש קשר גלובלי או פר-טיול). */
export interface ContactRepository {
  list(params: { userId: string; includeDeleted?: boolean }): Promise<Contact[]>;
  getById(params: { userId: string; contactId: string }): Promise<Contact | null>;
  create(params: { userId: string; input: CreateContactInput }): Promise<Contact>;
  softDelete(params: { userId: string; contactId: string }): Promise<Contact>;
  restore(params: { userId: string; contactId: string }): Promise<Contact>;
}

export class ContactNotFoundError extends Error {
  constructor(contactId: string) {
    super(`Contact ${contactId} not found`);
    this.name = "ContactNotFoundError";
  }
}
