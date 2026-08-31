/** JS-side companions to the CSS design tokens in app/globals.css — for props that can't
 * be expressed as CSS (Lucide's numeric `size`). Keep in sync with the CSS scale by hand;
 * there's no build-time bridge between the two in this project. */
export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const ICON_STROKE_WIDTH = 1.75;
