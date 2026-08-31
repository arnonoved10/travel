// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateRouteStopInput, RouteStop } from "@travel-app/shared-types";
import { createRouteStopInputSchema } from "@travel-app/shared-types";
import { RouteStopNotFoundError, type RouteRepository } from "./route-repository";

function toDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function toRouteStop(
  row: {
    id: string;
    placeId: string | null;
    orderIndex: number;
    plannedArrivalAt: Date | null;
    plannedDepartureAt: Date | null;
    distanceKm: unknown;
    travelTimeMinutes: number | null;
    travelMode: string | null;
  },
  tripId: string,
  date: string,
): RouteStop {
  return {
    id: row.id,
    tripId,
    date,
    placeId: row.placeId,
    orderIndex: row.orderIndex,
    plannedArrivalAt: row.plannedArrivalAt ? row.plannedArrivalAt.toISOString() : null,
    plannedDepartureAt: row.plannedDepartureAt ? row.plannedDepartureAt.toISOString() : null,
    distanceKm: row.distanceKm === null ? null : Number(row.distanceKm),
    travelTimeMinutes: row.travelTimeMinutes,
    travelMode: row.travelMode as RouteStop["travelMode"],
  };
}

export class PrismaRouteRepository implements RouteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForDay({ tripId, date }: { tripId: string; date: string }): Promise<RouteStop[]> {
    const tripDay = await this.prisma.tripDay.findUnique({
      where: { tripId_calendarDate: { tripId, calendarDate: toDateOnly(date) } },
      include: { route: { include: { stops: { orderBy: { orderIndex: "asc" } } } } },
    });
    if (!tripDay?.route) return [];
    return tripDay.route.stops.map((s) => toRouteStop(s, tripId, date));
  }

  async addStop({ input }: { input: CreateRouteStopInput }): Promise<RouteStop> {
    const parsed = createRouteStopInputSchema.parse(input);
    const calendarDate = toDateOnly(parsed.date);

    const tripDay = await this.prisma.tripDay.upsert({
      where: { tripId_calendarDate: { tripId: parsed.tripId, calendarDate } },
      create: { tripId: parsed.tripId, calendarDate },
      update: {},
    });
    const route = await this.prisma.route.upsert({
      where: { tripDayId: tripDay.id },
      create: { tripDayId: tripDay.id },
      update: {},
    });

    const lastStop = await this.prisma.routeStop.findFirst({
      where: { routeId: route.id },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrderIndex = lastStop ? lastStop.orderIndex + 1 : 0;

    const stop = await this.prisma.routeStop.create({
      data: {
        routeId: route.id,
        placeId: parsed.placeId,
        orderIndex: nextOrderIndex,
        plannedArrivalAt: parsed.plannedArrivalAt ? new Date(parsed.plannedArrivalAt) : undefined,
        plannedDepartureAt: parsed.plannedDepartureAt ? new Date(parsed.plannedDepartureAt) : undefined,
        distanceKm: parsed.distanceKm,
        travelTimeMinutes: parsed.travelTimeMinutes,
        travelMode: parsed.travelMode,
      },
    });
    return toRouteStop(stop, parsed.tripId, parsed.date);
  }

  async moveStop({ routeStopId, direction }: { routeStopId: string; direction: "up" | "down" }): Promise<RouteStop[]> {
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: routeStopId },
      include: { route: { include: { tripDay: true, stops: { orderBy: { orderIndex: "asc" } } } } },
    });
    if (!stop) throw new RouteStopNotFoundError(routeStopId);

    const tripId = stop.route.tripDay.tripId;
    const date = stop.route.tripDay.calendarDate.toISOString().slice(0, 10);
    const dayStops = stop.route.stops;
    const index = dayStops.findIndex((s) => s.id === routeStopId);
    const swapWithIndex = direction === "up" ? index - 1 : index + 1;

    if (swapWithIndex < 0 || swapWithIndex >= dayStops.length) {
      return dayStops.map((s) => toRouteStop(s, tripId, date));
    }

    const other = dayStops[swapWithIndex]!;
    const current = dayStops[index]!;
    await this.prisma.$transaction([
      this.prisma.routeStop.update({ where: { id: current.id }, data: { orderIndex: other.orderIndex } }),
      this.prisma.routeStop.update({ where: { id: other.id }, data: { orderIndex: current.orderIndex } }),
    ]);

    return this.listForDay({ tripId, date });
  }

  async removeStop({ routeStopId }: { routeStopId: string }): Promise<void> {
    const existing = await this.prisma.routeStop.findUnique({ where: { id: routeStopId } });
    if (!existing) throw new RouteStopNotFoundError(routeStopId);
    await this.prisma.routeStop.delete({ where: { id: routeStopId } });
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
    await this.prisma.$transaction(
      stops.map((entry, index) =>
        this.prisma.routeStop.update({
          where: { id: entry.routeStopId },
          data: {
            orderIndex: index,
            ...(entry.distanceKm !== undefined ? { distanceKm: entry.distanceKm } : {}),
            ...(entry.travelTimeMinutes !== undefined ? { travelTimeMinutes: entry.travelTimeMinutes } : {}),
          },
        }),
      ),
    );

    return this.listForDay({ tripId, date });
  }
}
