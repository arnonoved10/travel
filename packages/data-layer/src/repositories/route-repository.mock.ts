import { randomUUID } from "node:crypto";
import type { CreateRouteStopInput, RouteStop } from "@travel-app/shared-types";
import { createRouteStopInputSchema } from "@travel-app/shared-types";
import { RouteStopNotFoundError, type RouteRepository } from "./route-repository";

export class MockRouteRepository implements RouteRepository {
  private stops = new Map<string, RouteStop>();

  async listForDay({ tripId, date }: { tripId: string; date: string }): Promise<RouteStop[]> {
    return Array.from(this.stops.values())
      .filter((s) => s.tripId === tripId && s.date === date)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async addStop({ input }: { input: CreateRouteStopInput }): Promise<RouteStop> {
    const parsed = createRouteStopInputSchema.parse(input);
    const existingForDay = await this.listForDay({ tripId: parsed.tripId, date: parsed.date });
    const nextOrderIndex = existingForDay.length === 0 ? 0 : Math.max(...existingForDay.map((s) => s.orderIndex)) + 1;

    const stop: RouteStop = {
      id: randomUUID(),
      tripId: parsed.tripId,
      date: parsed.date,
      placeId: parsed.placeId,
      orderIndex: nextOrderIndex,
      plannedArrivalAt: parsed.plannedArrivalAt ?? null,
      plannedDepartureAt: parsed.plannedDepartureAt ?? null,
      distanceKm: parsed.distanceKm ?? null,
      travelTimeMinutes: parsed.travelTimeMinutes ?? null,
      travelMode: parsed.travelMode ?? null,
    };
    this.stops.set(stop.id, stop);
    return stop;
  }

  async moveStop({ routeStopId, direction }: { routeStopId: string; direction: "up" | "down" }): Promise<RouteStop[]> {
    const stop = this.stops.get(routeStopId);
    if (!stop) throw new RouteStopNotFoundError(routeStopId);

    const dayStops = await this.listForDay({ tripId: stop.tripId, date: stop.date });
    const index = dayStops.findIndex((s) => s.id === routeStopId);
    const swapWithIndex = direction === "up" ? index - 1 : index + 1;
    if (swapWithIndex < 0 || swapWithIndex >= dayStops.length) return dayStops;

    const other = dayStops[swapWithIndex]!;
    const current = dayStops[index]!;
    const currentOrder = current.orderIndex;
    this.stops.set(current.id, { ...current, orderIndex: other.orderIndex });
    this.stops.set(other.id, { ...other, orderIndex: currentOrder });

    return this.listForDay({ tripId: stop.tripId, date: stop.date });
  }

  async removeStop({ routeStopId }: { routeStopId: string }): Promise<void> {
    if (!this.stops.has(routeStopId)) throw new RouteStopNotFoundError(routeStopId);
    this.stops.delete(routeStopId);
  }

  async reorderStops({
    tripId,
    date,
    stops,
  }: {
    tripId: string;
    date: string;
    stops: { routeStopId: string; distanceKm?: number; travelTimeMinutes?: number }[];
  }): Promise<RouteStop[]> {
    stops.forEach((entry, index) => {
      const existing = this.stops.get(entry.routeStopId);
      if (!existing) throw new RouteStopNotFoundError(entry.routeStopId);
      this.stops.set(entry.routeStopId, {
        ...existing,
        orderIndex: index,
        ...(entry.distanceKm !== undefined ? { distanceKm: entry.distanceKm } : {}),
        ...(entry.travelTimeMinutes !== undefined ? { travelTimeMinutes: entry.travelTimeMinutes } : {}),
      });
    });
    return this.listForDay({ tripId, date });
  }
}

export const mockRouteRepository = new MockRouteRepository();
