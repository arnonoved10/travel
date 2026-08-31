"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import {
  restoreActivityReservationAction,
  restoreCarRentalAction,
  restoreFlightAction,
  restoreHotelStayAction,
  restoreInsuranceAction,
  restoreTransportBookingAction,
} from "@/app/(app)/trash/actions";
import {
  softDeleteActivityReservationAction,
  softDeleteCarRentalAction,
  softDeleteFlightAction,
  softDeleteHotelStayAction,
  softDeleteInsuranceAction,
  softDeleteTransportBookingAction,
} from "./actions";

const buttonStyle: React.CSSProperties = {
  padding: "0.25rem 0.5rem",
  borderRadius: "var(--radius-full)",
  fontSize: "0.75rem",
};

export function DeleteHotelStayButton({ tripId, hotelStayId }: { tripId: string; hotelStayId: string }) {
  return (
    <DeleteWithUndoButton
      style={buttonStyle}
      onDelete={() => softDeleteHotelStayAction(tripId, hotelStayId)}
      onUndo={() => restoreHotelStayAction(hotelStayId)}
      undoMessage="המלון הוסר."
    />
  );
}

export function DeleteFlightButton({ tripId, flightId }: { tripId: string; flightId: string }) {
  return (
    <DeleteWithUndoButton
      style={buttonStyle}
      onDelete={() => softDeleteFlightAction(tripId, flightId)}
      onUndo={() => restoreFlightAction(flightId)}
      undoMessage="הטיסה הוסרה."
    />
  );
}

export function DeleteTransportBookingButton({ tripId, transportBookingId }: { tripId: string; transportBookingId: string }) {
  return (
    <DeleteWithUndoButton
      style={buttonStyle}
      onDelete={() => softDeleteTransportBookingAction(tripId, transportBookingId)}
      onUndo={() => restoreTransportBookingAction(transportBookingId)}
      undoMessage="ההסעה הוסרה."
    />
  );
}

export function DeleteInsuranceButton({ tripId, insuranceId }: { tripId: string; insuranceId: string }) {
  return (
    <DeleteWithUndoButton
      style={buttonStyle}
      onDelete={() => softDeleteInsuranceAction(tripId, insuranceId)}
      onUndo={() => restoreInsuranceAction(insuranceId)}
      undoMessage="הביטוח הוסר."
    />
  );
}

export function DeleteActivityReservationButton({ tripId, activityReservationId }: { tripId: string; activityReservationId: string }) {
  return (
    <DeleteWithUndoButton
      style={buttonStyle}
      onDelete={() => softDeleteActivityReservationAction(tripId, activityReservationId)}
      onUndo={() => restoreActivityReservationAction(activityReservationId)}
      undoMessage="האטרקציה הוסרה."
    />
  );
}

export function DeleteCarRentalButton({ tripId, carRentalId }: { tripId: string; carRentalId: string }) {
  return (
    <DeleteWithUndoButton
      style={buttonStyle}
      onDelete={() => softDeleteCarRentalAction(tripId, carRentalId)}
      onUndo={() => restoreCarRentalAction(carRentalId)}
      undoMessage="ההשכרה הוסרה."
    />
  );
}
