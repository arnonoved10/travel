import { beforeEach, describe, expect, it } from "vitest";
import { MockNotificationPreferenceRepository } from "./notification-preference-repository.mock";

const tripA = "11111111-1111-4111-8111-111111111111";
const tripB = "22222222-2222-4222-8222-222222222222";

describe("MockNotificationPreferenceRepository", () => {
  let repo: MockNotificationPreferenceRepository;

  beforeEach(() => {
    repo = new MockNotificationPreferenceRepository();
  });

  it("creates a preference on first upsert", async () => {
    const created = await repo.upsert({
      input: { tripId: tripA, eventType: "flight_approaching", leadTimeMinutes: 120, isEnabled: true },
    });
    expect(created.leadTimeMinutes).toBe(120);
    expect(created.isEnabled).toBe(true);

    const list = await repo.listForTrip({ tripId: tripA });
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(created.id);
  });

  it("updates the same row in place on a second upsert for the same tripId+eventType, keeping the same id", async () => {
    const first = await repo.upsert({
      input: { tripId: tripA, eventType: "taxi_approaching", leadTimeMinutes: 30, isEnabled: true },
    });
    const second = await repo.upsert({
      input: { tripId: tripA, eventType: "taxi_approaching", leadTimeMinutes: 45, isEnabled: false },
    });

    expect(second.id).toBe(first.id);
    expect(second.leadTimeMinutes).toBe(45);
    expect(second.isEnabled).toBe(false);

    const list = await repo.listForTrip({ tripId: tripA });
    expect(list).toHaveLength(1);
  });

  it("isolates preferences between trips", async () => {
    await repo.upsert({ input: { tripId: tripA, eventType: "flight_approaching", leadTimeMinutes: 60, isEnabled: true } });

    const tripBList = await repo.listForTrip({ tripId: tripB });
    expect(tripBList).toHaveLength(0);
  });
});
