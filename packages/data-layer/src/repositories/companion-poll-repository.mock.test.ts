import { beforeEach, describe, expect, it } from "vitest";
import { MockCompanionPollRepository } from "./companion-poll-repository.mock";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const dana = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const yoav = "yyyyyyyy-yyyy-4yyy-8yyy-yyyyyyyyyyyy";

describe("MockCompanionPollRepository", () => {
  let repo: MockCompanionPollRepository;

  beforeEach(() => {
    repo = new MockCompanionPollRepository();
  });

  it("creates a poll with its options in order, no votes yet", async () => {
    const poll = await repo.create({ input: { tripId, question: "איפה אוכלים הערב?", optionTexts: ["סושי", "פיצה", "המבורגר"] } });

    expect(poll.question).toBe("איפה אוכלים הערב?");
    expect(poll.options.map((o) => o.text)).toEqual(["סושי", "פיצה", "המבורגר"]);
    expect(poll.options.every((o) => o.voterCompanionIds.length === 0)).toBe(true);
  });

  it("lists polls scoped to a trip", async () => {
    const created = await repo.create({ input: { tripId, question: "שאלה", optionTexts: ["א", "ב"] } });
    const otherTripPolls = await repo.listForTrip({ tripId: "other-trip" });
    const thisTripPolls = await repo.listForTrip({ tripId });

    expect(otherTripPolls).toEqual([]);
    expect(thisTripPolls.map((p) => p.id)).toEqual([created.id]);
  });

  it("records a vote and reflects it in the option's voter list", async () => {
    const poll = await repo.create({ input: { tripId, question: "שאלה", optionTexts: ["א", "ב"] } });
    const optionA = poll.options[0]!;

    await repo.recordVote({ pollId: poll.id, companionId: dana, optionId: optionA.id });

    const [refreshed] = await repo.listForTrip({ tripId });
    expect(refreshed!.options.find((o) => o.id === optionA.id)?.voterCompanionIds).toEqual([dana]);
  });

  it("changing a vote moves it to the new option without duplicating", async () => {
    const poll = await repo.create({ input: { tripId, question: "שאלה", optionTexts: ["א", "ב"] } });
    const [optionA, optionB] = poll.options;

    await repo.recordVote({ pollId: poll.id, companionId: dana, optionId: optionA!.id });
    await repo.recordVote({ pollId: poll.id, companionId: dana, optionId: optionB!.id });

    const [refreshed] = await repo.listForTrip({ tripId });
    expect(refreshed!.options.find((o) => o.id === optionA!.id)?.voterCompanionIds).toEqual([]);
    expect(refreshed!.options.find((o) => o.id === optionB!.id)?.voterCompanionIds).toEqual([dana]);
  });

  it("counts multiple companions voting for the same option", async () => {
    const poll = await repo.create({ input: { tripId, question: "שאלה", optionTexts: ["א", "ב"] } });
    const optionA = poll.options[0]!;

    await repo.recordVote({ pollId: poll.id, companionId: dana, optionId: optionA.id });
    await repo.recordVote({ pollId: poll.id, companionId: yoav, optionId: optionA.id });

    const [refreshed] = await repo.listForTrip({ tripId });
    expect(refreshed!.options.find((o) => o.id === optionA.id)?.voterCompanionIds.sort()).toEqual([dana, yoav].sort());
  });

  it("removeVote clears a companion's vote", async () => {
    const poll = await repo.create({ input: { tripId, question: "שאלה", optionTexts: ["א", "ב"] } });
    const optionA = poll.options[0]!;

    await repo.recordVote({ pollId: poll.id, companionId: dana, optionId: optionA.id });
    await repo.removeVote({ pollId: poll.id, companionId: dana });

    const [refreshed] = await repo.listForTrip({ tripId });
    expect(refreshed!.options.every((o) => o.voterCompanionIds.length === 0)).toBe(true);
  });

  it("deletePoll removes the poll, its options, and its votes", async () => {
    const poll = await repo.create({ input: { tripId, question: "שאלה", optionTexts: ["א", "ב"] } });
    await repo.recordVote({ pollId: poll.id, companionId: dana, optionId: poll.options[0]!.id });

    await repo.deletePoll({ pollId: poll.id });

    const polls = await repo.listForTrip({ tripId });
    expect(polls).toEqual([]);
  });
});
