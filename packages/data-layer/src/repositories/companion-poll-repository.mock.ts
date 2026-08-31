import { randomUUID } from "node:crypto";
import type { CompanionPoll, CompanionPollOption, CreateCompanionPollInput } from "@travel-app/shared-types";
import { createCompanionPollInputSchema } from "@travel-app/shared-types";
import type { CompanionPollRepository, CompanionPollWithOptions } from "./companion-poll-repository";

interface StoredVote {
  id: string;
  pollId: string;
  optionId: string;
  companionId: string;
}

export class MockCompanionPollRepository implements CompanionPollRepository {
  private polls = new Map<string, CompanionPoll>();
  private options = new Map<string, CompanionPollOption>();
  private votes = new Map<string, StoredVote>();

  private toWithOptions(poll: CompanionPoll): CompanionPollWithOptions {
    const pollOptions = Array.from(this.options.values())
      .filter((o) => o.pollId === poll.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const pollVotes = Array.from(this.votes.values()).filter((v) => v.pollId === poll.id);

    return {
      ...poll,
      options: pollOptions.map((option) => ({
        ...option,
        voterCompanionIds: pollVotes.filter((v) => v.optionId === option.id).map((v) => v.companionId),
      })),
    };
  }

  async listForTrip({ tripId }: { tripId: string }): Promise<CompanionPollWithOptions[]> {
    return Array.from(this.polls.values())
      .filter((p) => p.tripId === tripId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => this.toWithOptions(p));
  }

  async create({ input }: { input: CreateCompanionPollInput }): Promise<CompanionPollWithOptions> {
    const parsed = createCompanionPollInputSchema.parse(input);
    const poll: CompanionPoll = {
      id: randomUUID(),
      tripId: parsed.tripId,
      question: parsed.question,
      createdAt: new Date().toISOString(),
    };
    this.polls.set(poll.id, poll);

    parsed.optionTexts.forEach((text, orderIndex) => {
      const option: CompanionPollOption = { id: randomUUID(), pollId: poll.id, text, orderIndex };
      this.options.set(option.id, option);
    });

    return this.toWithOptions(poll);
  }

  async recordVote({ pollId, companionId, optionId }: { pollId: string; companionId: string; optionId: string }): Promise<void> {
    const existing = Array.from(this.votes.values()).find((v) => v.pollId === pollId && v.companionId === companionId);
    if (existing) {
      this.votes.set(existing.id, { ...existing, optionId });
      return;
    }
    const vote: StoredVote = { id: randomUUID(), pollId, optionId, companionId };
    this.votes.set(vote.id, vote);
  }

  async removeVote({ pollId, companionId }: { pollId: string; companionId: string }): Promise<void> {
    const existing = Array.from(this.votes.values()).find((v) => v.pollId === pollId && v.companionId === companionId);
    if (existing) this.votes.delete(existing.id);
  }

  async deletePoll({ pollId }: { pollId: string }): Promise<void> {
    this.polls.delete(pollId);
    for (const option of Array.from(this.options.values())) {
      if (option.pollId === pollId) this.options.delete(option.id);
    }
    for (const vote of Array.from(this.votes.values())) {
      if (vote.pollId === pollId) this.votes.delete(vote.id);
    }
  }
}

export const mockCompanionPollRepository = new MockCompanionPollRepository();
