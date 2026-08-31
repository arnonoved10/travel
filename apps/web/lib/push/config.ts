/** מפתח-VAPID ציבורי — נחשף ללקוח בכוונה (PushManager.subscribe צריך אותו),
 * בשונה מהמפתח הפרטי שנשאר שרתי בלבד. שני המפתחות נוצרו פעם אחת עם
 * web-push.generateVAPIDKeys() ונשמרים ב-.env.local, לא בקוד. */
export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) && Boolean(process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}
