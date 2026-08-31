"use client";

import { toggleFavoritePlaceAction } from "./actions";

export function ToggleFavoriteButton({ placeId, isFavorite }: { placeId: string; isFavorite: boolean }) {
  return (
    <form action={toggleFavoritePlaceAction.bind(null, placeId)}>
      <button
        type="submit"
        aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        title={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        style={{
          padding: "0.375rem 0.5rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: isFavorite ? "#f5b700" : "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: "1rem",
          lineHeight: 1,
        }}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </form>
  );
}
