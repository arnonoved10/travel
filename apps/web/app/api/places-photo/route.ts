import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getGooglePlacesApiKey } from "@/lib/recommendations/config";

// פרוקסי שרת בלבד לתמונות Google Places — כדי ש-GOOGLE_PLACES_API_KEY לעולם
// לא ידלוף ל-URL ציבורי בתגית <img> בדפדפן. "name" מגיע מ-photoUrl שנבנה
// ב-google-places-provider.ts, לא מקלט משתמש חופשי — הבדיקה כאן היא הגנת-עומק
// נגד שימוש כ-open proxy, לא ולידציה עסקית.
const PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/;

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const name = new URL(request.url).searchParams.get("name");
  if (!name || !PHOTO_NAME_PATTERN.test(name)) {
    return new Response("Invalid photo reference", { status: 400 });
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) return new Response("Not configured", { status: 503 });

  const upstream = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=400&key=${apiKey}`);
  if (!upstream.ok || !upstream.body) {
    return new Response("Photo not available", { status: upstream.status || 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // שבוע, לא שעה — תמונת-מקום כמעט לא משתנה, וכל fetch-חוזר-מהדפדפן שנחסך
      // הוא קריאת-API פחות למפתח המשותף (ר' google-places-provider.ts,
      // google-place-search.ts) — תורם ישירות לצמצום 429/Too-Many-Requests.
      "Cache-Control": "private, max-age=604800, immutable",
    },
  });
}
