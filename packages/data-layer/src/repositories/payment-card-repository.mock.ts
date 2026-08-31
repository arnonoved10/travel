import { randomUUID } from "node:crypto";
import type { CreatePaymentCardInput, PaymentCard } from "@travel-app/shared-types";
import { createPaymentCardInputSchema } from "@travel-app/shared-types";
import type { PaymentCardRepository } from "./payment-card-repository";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export class MockPaymentCardRepository implements PaymentCardRepository {
  private cards = new Map<string, PaymentCard>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedCards: Array<Omit<PaymentCard, "id">> = [
      { userId: DEMO_USER_ID, cardName: "[דמו] ויזה זהב", defaultCurrencyCode: "ILS" },
    ];

    for (const card of seedCards) {
      const id = randomUUID();
      this.cards.set(id, { ...card, id });
    }
  }

  async list({ userId }: { userId: string }): Promise<PaymentCard[]> {
    return Array.from(this.cards.values()).filter((c) => c.userId === userId);
  }

  async create({ userId, input }: { userId: string; input: CreatePaymentCardInput }): Promise<PaymentCard> {
    const parsed = createPaymentCardInputSchema.parse(input);
    const card: PaymentCard = {
      id: randomUUID(),
      userId,
      cardName: parsed.cardName,
      defaultCurrencyCode: parsed.defaultCurrencyCode ?? null,
    };
    this.cards.set(card.id, card);
    return card;
  }
}

export const mockPaymentCardRepository = new MockPaymentCardRepository();
