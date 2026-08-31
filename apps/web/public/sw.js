// Service Worker בסיסי — קאשינג app-shell בלבד, לא סנכרון offline אמיתי.
// לעולם לא נוגע בבקשות שאינן GET (Server Actions הם POST) — אין תור סנכרון
// מזויף שמעמיד פנים שפעולה הצליחה כשהיא לא באמת הגיעה לשרת.
const CACHE_NAME = "travel-app-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // נכסי build של Next.js — מסומנים ב-hash בשם הקובץ, אף פעם לא מתיישנים.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              return response;
            }),
        ),
      ),
    );
    return;
  }

  // ניווט בין דפים — network-first, נופל לעותק האחרון מה-cache רק כשאין רשת.
  // הדף עדיין ירונדר עם UI שמציין "לא מקוון" (OfflineBanner) — לא מוצג כ-Live.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
    );
  }
});

// Web Push אמיתי — payload נשלח כ-JSON תקין (ר' lib/push/send-push.ts), לא
// טקסט חופשי. אם הפענוח נכשל (למשל payload ריק), מציגים כותרת גנרית במקום
// לקרוס בשקט — עדיף התראה עמומה על אף התראה.
self.addEventListener("push", (event) => {
  let payload = { title: "Trip Master", body: "יש עדכון חדש", url: "/today" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // נשאר עם ברירת-המחדל למעלה
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.svg",
      data: { url: payload.url ?? "/today" },
    }),
  );
});

// לחיצה על ההתראה — מתמקד בטאב פתוח קיים אם יש, אחרת פותח חלון חדש בנתיב-היעד.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/today";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
