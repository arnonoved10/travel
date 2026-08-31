import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// מסכים שמותר להגיע אליהם בלי משתמש מחובר. כל שאר 40 המסכים חסומים.
const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * שומר-הסף של האפליקציה. שתי משימות בבקשה אחת:
 * 1. רענון עוגיות ה-session של Supabase (בלי זה ה-session פג אחרי שעה
 *    והמשתמש נזרק החוצה באמצע שימוש).
 * 2. הפניית מי שלא מחובר ל-/login, ומי שכן מחובר החוצה ממסכי ההתחברות.
 *
 * ב-Next 16 הקובץ נקרא proxy.ts (השם החדש של middleware.ts) והפונקציה
 * חייבת להיקרא proxy.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // בלי מפתחות אין מה לאכוף — עדיף לתת לאפליקציה לעלות מאשר לחסום הכל
  // מאחורי שגיאה. הודעה ברורה בלוג במקום קריסה שקטה.
  if (!url || !key) {
    console.warn("[proxy] משתני Supabase חסרים — שומר-הסף מושבת והמסכים פתוחים.");
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser (ולא getSession) — הוא מאמת את הטוקן מול השרת של Supabase
  // במקום לסמוך על עוגייה שאפשר לזייף.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // שומר לאן המשתמש רצה להגיע, כדי להחזיר אותו לשם אחרי ההתחברות.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // כל בקשה חוץ מקבצים סטטיים, ה-manifest וה-service worker — אלה חייבים
    // להישאר פתוחים אחרת ה-PWA לא נטען כלל במסך ההתחברות.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-|icons/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
