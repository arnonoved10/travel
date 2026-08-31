// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateCompanionPollInput } from "@travel-app/shared-types";
import { createCompanionPollInputSchema } from "@travel-app/shared-types";
import type { CompanionPollRepository, CompanionPollWithOptions } from "./companion-poll-repository";

interface PollRow {
  id: string;
  tripId: string;
  question: string;
  createdAt: Date;
  options: Array<{ id: string; pollId: string; text: string; orderIndex: number; votes: Array<{ companionId: string }> }>;
}

function toCompanionPollWithOptions(row: PollRow): CompanionPollWithOptions {
  return {
    id: row.id,
    tripId: row.tripId,
    question: row.question,
    createdAt: row.createdAt.toISOString(),
    options: row.options
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((option) => ({
        id: option.id,
        pollId: option.pollId,
        text: option.text,
        orderIndex: option.orderIndex,
        voterCompanionIds: option.votes.map((v) => v.companionId),
      })),
  };
}

export class PrismaCompanionPollRepository implements CompanionPollRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForTrip({ tripId }: { tripId: string }): Promise<CompanionPollWithOptions[]> {
    const rows = await this.prisma.companionPoll.findMany({
      where: { tripId },
      include: { options: { include: { votes: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCompanionPollWithOptions);
  }

  async create({ input }: { input: CreateCompanionPollInput }): Promise<CompanionPollWithOptions> {
    const parsed = createCompanionPollInputSchema.parse(input);
    const created = await this.prisma.companionPoll.create({
      data: {
        tripId: parsed.tripId,
        question: parsed.question,
        options: { create: parsed.optionTexts.map((text, orderIndex) => ({ text, orderIndex })) },
      },
      include: { options: { include: { votes: true } } },
    });
    return toCompanionPollWithOptions(created);
  }

  async recordVote({ pollId, companionId, optionId }: { pollId: string; companionId: string; optionId: string }): Promise<void> {
    await this.prisma.companionPollVote.upsert({
      where: { pollId_companionId: { pollId, companionId } },
      create: { pollId, companionId, optionId },
      update: { optionId },
    });
  }

  async removeVote({ pollId, companionId }: { pollId: string; companionId: string }): Promise<void> {
    await this.prisma.companionPollVote.deleteMany({ where: { pollId, companionId } });
  }

  async deletePoll({ pollId }: { pollId: string }): Promise<void> {
    await this.prisma.companionPollVote.deleteMany({ where: { pollId } });
    await this.prisma.companionPollOption.deleteMany({ where: { pollId } });
    await this.prisma.companionPoll.delete({ where: { id: pollId } });
  }
}
