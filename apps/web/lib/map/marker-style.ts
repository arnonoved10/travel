import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { PlaceCategory, TripPlaceStatus } from "@travel-app/shared-types";
import { PLACE_CATEGORY_ICONS } from "../place-labels";
import { CATEGORY_GRADIENTS } from "./category-colors";
import type { MapMarkerSpec } from "./types";

export { CATEGORY_GRADIENTS };

const STATUS_RING: Partial<Record<TripPlaceStatus, string>> = {
  visited: "#22c55e",
  favorite: "#d4a017",
  not_visited: "#64748b",
};

function iconSvgMarkup(category: PlaceCategory): string {
  const Icon = PLACE_CATEGORY_ICONS[category];
  return renderToStaticMarkup(createElement(Icon, { size: 16, strokeWidth: 2, color: "#fff" }));
}

/** Builds the marker's DOM element — a gradient circular badge (per category) with a
 * pin "tail", a status ring where applicable, and a scale/shadow bump when selected.
 * Rendered as real DOM (not Mapbox's default pin) per the design brief. */
export function markerElementFor(spec: MapMarkerSpec): HTMLElement {
  const [from, to] = CATEGORY_GRADIENTS[spec.category];
  const ring = spec.status ? STATUS_RING[spec.status] : undefined;
  const size = spec.selected ? 40 : 32;

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.cursor = "pointer";
  wrapper.style.transition = "transform 150ms ease";
  if (spec.selected) wrapper.style.transform = "translateY(-2px)";

  const badge = document.createElement("div");
  badge.style.width = `${size}px`;
  badge.style.height = `${size}px`;
  badge.style.borderRadius = "50%";
  badge.style.background = `linear-gradient(135deg, ${from}, ${to})`;
  badge.style.display = "flex";
  badge.style.alignItems = "center";
  badge.style.justifyContent = "center";
  badge.style.boxShadow = spec.selected
    ? `0 4px 14px rgba(0,0,0,0.4), 0 0 0 3px ${ring ?? "#fff"}`
    : `0 2px 8px rgba(0,0,0,0.35)${ring ? `, 0 0 0 2px ${ring}` : ""}`;
  badge.innerHTML = iconSvgMarkup(spec.category);
  badge.style.opacity = spec.status === "not_visited" ? "0.6" : "1";

  const tail = document.createElement("div");
  tail.style.width = "8px";
  tail.style.height = "8px";
  tail.style.marginTop = "-4px";
  tail.style.background = to;
  tail.style.transform = "rotate(45deg)";
  tail.style.borderRadius = "0 0 2px 0";

  wrapper.appendChild(badge);
  wrapper.appendChild(tail);
  return wrapper;
}
