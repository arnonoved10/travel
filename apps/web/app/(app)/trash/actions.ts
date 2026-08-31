"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getBookingRepository,
  getContactRepository,
  getDocumentRepository,
  getFinanceRepository,
  getIntegrationAccountRepository,
  getLoyaltyProgramRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
} from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export async function restorePlaceAction(placeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  await placeRepository.restore({ userId: user.id, placeId });
  logger.info("place restored from trash", { placeId });

  revalidatePath("/trash");
  revalidatePath("/places");
}

export async function restorePlannedActivityAction(plannedActivityId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plannedActivityRepository = await getPlannedActivityRepository();
  await plannedActivityRepository.restore({ plannedActivityId });
  logger.info("planned activity restored from trash", { plannedActivityId });

  revalidatePath("/trash");
}

export async function restoreHotelStayAction(hotelStayId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingRepository = await getBookingRepository();
  await bookingRepository.restoreHotelStay({ hotelStayId });
  logger.info("hotel stay restored from trash", { hotelStayId });

  revalidatePath("/trash");
}

export async function restoreFlightAction(flightId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingRepository = await getBookingRepository();
  await bookingRepository.restoreFlight({ flightId });
  logger.info("flight restored from trash", { flightId });

  revalidatePath("/trash");
}

export async function restoreTransportBookingAction(transportBookingId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingRepository = await getBookingRepository();
  await bookingRepository.restoreTransportBooking({ transportBookingId });
  logger.info("transport booking restored from trash", { transportBookingId });

  revalidatePath("/trash");
}

export async function restoreInsuranceAction(insuranceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingRepository = await getBookingRepository();
  await bookingRepository.restoreInsurance({ insuranceId });
  logger.info("insurance restored from trash", { insuranceId });

  revalidatePath("/trash");
}

export async function restoreActivityReservationAction(activityReservationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingRepository = await getBookingRepository();
  await bookingRepository.restoreActivityReservation({ activityReservationId });
  logger.info("activity reservation restored from trash", { activityReservationId });

  revalidatePath("/trash");
}

export async function restoreCarRentalAction(carRentalId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingRepository = await getBookingRepository();
  await bookingRepository.restoreCarRental({ carRentalId });
  logger.info("car rental restored from trash", { carRentalId });

  revalidatePath("/trash");
}

export async function restoreExpenseAction(expenseId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const financeRepository = await getFinanceRepository();
  await financeRepository.restoreExpense({ expenseId });
  logger.info("expense restored from trash", { expenseId });

  revalidatePath("/trash");
}

export async function restorePaymentAction(paymentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const financeRepository = await getFinanceRepository();
  await financeRepository.restorePayment({ paymentId });
  logger.info("payment restored from trash", { paymentId });

  revalidatePath("/trash");
}

export async function restoreDocumentAction(documentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const documentRepository = await getDocumentRepository();
  await documentRepository.restore({ documentId });
  logger.info("document restored from trash", { documentId });

  revalidatePath("/trash");
}

export async function restoreContactAction(contactId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const contactRepository = await getContactRepository();
  await contactRepository.restore({ userId: user.id, contactId });
  logger.info("contact restored from trash", { contactId });

  revalidatePath("/trash");
  revalidatePath("/contacts");
}

export async function restoreLoyaltyProgramFromTrashAction(loyaltyProgramId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const loyaltyProgramRepository = await getLoyaltyProgramRepository();
  await loyaltyProgramRepository.restore({ userId: user.id, loyaltyProgramId });
  logger.info("loyalty program restored from trash", { loyaltyProgramId });

  revalidatePath("/trash");
  revalidatePath("/contacts");
}

export async function restoreIntegrationAccountFromTrashAction(integrationAccountId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const integrationAccountRepository = await getIntegrationAccountRepository();
  await integrationAccountRepository.restore({ userId: user.id, integrationAccountId });
  logger.info("integration account restored from trash", { integrationAccountId });

  revalidatePath("/trash");
  revalidatePath("/contacts");
}
