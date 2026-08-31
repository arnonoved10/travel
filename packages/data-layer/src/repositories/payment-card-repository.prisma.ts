// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreatePaymentCardInput, PaymentCard } from "@travel-app/shared-types";
import { createPaymentCardInputSchema } from "@travel-app/shared-types";
import type { PaymentCardRepository } from "./payment-card-repository";

function toPaymentCard(row: { id: string; userId: string; cardName: string; defaultCurrencyCode: string | null }): PaymentCard {
  return { ...row };
}

export class PrismaPaymentCardRepository implements PaymentCardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ userId }: { userId: string }): Promise<PaymentCard[]> {
    const rows = await this.prisma.paymentCard.findMany({ where: { userId } });
    return rows.map(toPaymentCard);
  }

  async create({ userId, input }: { userId: string; input: CreatePaymentCardInput }): Promise<PaymentCard> {
    const parsed = createPaymentCardInputSchema.parse(input);
    const row = await this.prisma.paymentCard.create({
      data: { userId, cardName: parsed.cardName, defaultCurrencyCode: parsed.defaultCurrencyCode ?? null },
    });
    return toPaymentCard(row);
  }
}
