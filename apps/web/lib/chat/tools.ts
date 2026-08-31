/** מרשם-הכלים (tool registry) של עוזר-הצ'אט — פורמט `tools` האמיתי של Anthropic
 * Messages API (function-calling), לא פרומפט "תחזיר JSON" כמו ב-lib/ocr. `tripId`
 * במכוון לא מופיע באף סכימה — מוזרק בצד-שרת מההקשר (הטיול הפעיל), לא מנוחש
 * ע"י המודל. הוספת סוג-פעולה חדש בעתיד (השכרת-רכב, ביטוח וכו') = אובייקט נוסף
 * כאן + branch מקביל ב-execute-tool-call.ts, לא שינוי-ארכיטקטורה. */

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const CHAT_TOOLS: AnthropicTool[] = [
  {
    name: "create_expense",
    description:
      "רישום הוצאה בפועל ששולמה במזומן/כרטיס על ידי המשתמש בטיול — למשל ארוחה, תחבורה, קניות, כניסה לאטרקציה. מנכה אוטומטית מהארנק במטבע המדויק שצוין (יוצר ארנק חדש בטיול הפעיל אם עוד אין בו ארנק במטבע הזה — לעולם לא מנכה ממטבע אחר).",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", description: 'קטגוריה קצרה בעברית, למשל "אוכל", "תחבורה", "בילויים", "קניות".' },
        description: { type: "string", description: "תיאור חופשי — שם המסעדה/העסק/הפריט, אם צוין." },
        amount: { type: "number", description: "הסכום ששולם, מספר חיובי." },
        currencyCode: { type: "string", description: 'קוד מטבע ISO-4217 בן 3 אותיות (למשל "ILS", "THB", "USD"), אחרי נרמול מהשפה הטבעית שהמשתמש כתב.' },
      },
      required: ["category", "amount", "currencyCode"],
    },
  },
  {
    name: "receive_money",
    description:
      "רישום כסף שהתקבל/הופקד (מתנה, משיכה מכספומט, החזר וכו') — טוען/מגדיל את יתרת הארנק בטיול הפעיל במטבע שצוין. יוצר ארנק חדש במטבע הזה אם עוד אין.",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "הסכום שהתקבל, מספר חיובי." },
        currencyCode: { type: "string", description: "קוד מטבע ISO-4217 בן 3 אותיות, אחרי נרמול." },
        note: { type: "string", description: "הערה קצרה על מקור הכסף, אם צוין." },
      },
      required: ["amount", "currencyCode"],
    },
  },
  {
    name: "book_hotel",
    description: "יצירת הזמנת-מלון חדשה בטיול הפעיל.",
    input_schema: {
      type: "object",
      properties: {
        hotelName: { type: "string" },
        checkInDate: { type: "string", description: "תאריך בפורמט YYYY-MM-DD." },
        checkOutDate: { type: "string", description: "תאריך בפורמט YYYY-MM-DD, אחרי checkInDate." },
        address: { type: "string" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string", description: "קוד מטבע ISO-4217 בן 3 אותיות, אם צוין מחיר." },
      },
      required: ["hotelName", "checkInDate", "checkOutDate"],
    },
  },
  {
    name: "book_transport",
    description: "יצירת הזמנת-הסעה/תחבורה חדשה בטיול הפעיל (מונית, הסעה פרטית, מעבורת, רכבת, אוטובוס וכו').",
    input_schema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["taxi", "private_transfer", "ferry", "train", "bus", "water_taxi", "other"] },
        pickupText: { type: "string", description: "מקום איסוף, אם צוין." },
        dropoffText: { type: "string", description: "יעד, אם צוין." },
        pickupAt: { type: "string", description: "תאריך+שעת איסוף בפורמט ISO 8601 (YYYY-MM-DDTHH:mm:ss)." },
        pickupTimezone: { type: "string", description: 'אזור-זמן IANA (למשל "Asia/Bangkok") — נחש לפי יעד הטיול אם אפשר, השאר ריק אם לא בטוח.' },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string", description: "קוד מטבע ISO-4217 בן 3 אותיות, אם צוין מחיר." },
      },
      required: ["mode", "pickupAt"],
    },
  },
  {
    name: "book_flight",
    description: "יצירת טיסה חדשה בטיול הפעיל.",
    input_schema: {
      type: "object",
      properties: {
        airline: { type: "string" },
        flightNumber: { type: "string" },
        departureAirport: { type: "string", description: "קוד שדה-תעופה בן 3 אותיות (IATA), למשל TLV." },
        arrivalAirport: { type: "string", description: "קוד שדה-תעופה בן 3 אותיות (IATA)." },
        departureAt: { type: "string", description: "תאריך+שעת המראה בפורמט ISO 8601." },
        departureTimezone: { type: "string", description: 'אזור-זמן IANA של שדה היציאה — נחש אם אפשר, אחרת השאר ריק.' },
        arrivalAt: { type: "string", description: "תאריך+שעת נחיתה בפורמט ISO 8601." },
        arrivalTimezone: { type: "string", description: "אזור-זמן IANA של שדה הנחיתה — נחש אם אפשר, אחרת השאר ריק." },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string", description: "קוד מטבע ISO-4217 בן 3 אותיות, אם צוין מחיר." },
      },
      required: ["airline", "departureAirport", "arrivalAirport", "departureAt", "arrivalAt"],
    },
  },

  // --- עדכון-ישויות קיימות (v2) — entityId נפתר ע"י המודל מרשימת ה"פריטים
  // האחרונים" שמוזרקת ל-system prompt (ר' system-prompt.ts). כל שדה חוץ
  // מ-entityId אופציונלי — משתנה רק מה שהמשתמש ציין בפועל. ---
  {
    name: "update_expense",
    description: "עדכון הוצאה קיימת (למשל תיקון סכום/קטגוריה/תיאור) — לא יוצר הוצאה חדשה.",
    input_schema: {
      type: "object",
      properties: {
        expenseId: { type: "string", description: "מזהה ההוצאה לעדכון, מתוך רשימת ההוצאות האחרונות בהקשר." },
        category: { type: "string" },
        description: { type: "string" },
        amount: { type: "number" },
        currencyCode: { type: "string", description: "קוד מטבע ISO-4217 בן 3 אותיות." },
      },
      required: ["expenseId"],
    },
  },
  {
    name: "update_hotel",
    description: "עדכון הזמנת-מלון קיימת (שם/תאריכים/מחיר) — לא יוצר הזמנה חדשה.",
    input_schema: {
      type: "object",
      properties: {
        hotelStayId: { type: "string", description: "מזהה הזמנת-המלון לעדכון, מתוך ההקשר." },
        hotelName: { type: "string" },
        checkInDate: { type: "string", description: "YYYY-MM-DD" },
        checkOutDate: { type: "string", description: "YYYY-MM-DD" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string" },
      },
      required: ["hotelStayId"],
    },
  },
  {
    name: "update_flight",
    description: "עדכון טיסה קיימת (חברה/שעות/מחיר) — לא יוצר טיסה חדשה.",
    input_schema: {
      type: "object",
      properties: {
        flightId: { type: "string", description: "מזהה הטיסה לעדכון, מתוך ההקשר." },
        airline: { type: "string" },
        departureAt: { type: "string", description: "ISO 8601" },
        arrivalAt: { type: "string", description: "ISO 8601" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string" },
      },
      required: ["flightId"],
    },
  },
  {
    name: "update_transport",
    description: "עדכון הזמנת-הסעה קיימת (מקום/שעה/מחיר) — לא יוצר הסעה חדשה.",
    input_schema: {
      type: "object",
      properties: {
        transportBookingId: { type: "string", description: "מזהה ההסעה לעדכון, מתוך ההקשר." },
        pickupText: { type: "string" },
        dropoffText: { type: "string" },
        pickupAt: { type: "string", description: "ISO 8601" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string" },
      },
      required: ["transportBookingId"],
    },
  },
  {
    name: "update_insurance",
    description: "עדכון ביטוח קיים (חברה/תאריכים/מחיר) — לא יוצר ביטוח חדש.",
    input_schema: {
      type: "object",
      properties: {
        insuranceId: { type: "string", description: "מזהה הביטוח לעדכון, מתוך ההקשר." },
        company: { type: "string" },
        startDate: { type: "string", description: "YYYY-MM-DD" },
        endDate: { type: "string", description: "YYYY-MM-DD" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string" },
      },
      required: ["insuranceId"],
    },
  },
  {
    name: "update_activity_reservation",
    description: "עדכון הזמנת-אטרקציה/כרטיס קיימת (שם/תאריך/מחיר) — לא יוצר הזמנה חדשה.",
    input_schema: {
      type: "object",
      properties: {
        activityReservationId: { type: "string", description: "מזהה ההזמנה לעדכון, מתוך ההקשר." },
        venueName: { type: "string" },
        activityDate: { type: "string", description: "YYYY-MM-DD" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string" },
      },
      required: ["activityReservationId"],
    },
  },
  {
    name: "update_car_rental",
    description: "עדכון השכרת-רכב קיימת (חברה/שעות/מחיר/פיקדון) — לא יוצר השכרה חדשה.",
    input_schema: {
      type: "object",
      properties: {
        carRentalId: { type: "string", description: "מזהה ההשכרה לעדכון, מתוך ההקשר." },
        companyName: { type: "string" },
        pickupAt: { type: "string", description: "ISO 8601" },
        dropoffAt: { type: "string", description: "ISO 8601" },
        agreedPrice: { type: "number" },
        agreedCurrencyCode: { type: "string" },
        depositAmount: { type: "number" },
        depositCurrencyCode: { type: "string" },
      },
      required: ["carRentalId"],
    },
  },

  // --- טיול חדש ותכנון-ימים (v2) ---
  {
    name: "create_trip",
    description: "פתיחת טיול חדש עם שם ותאריכים. אחרי הצלחה, הטיול הזה הופך להיות הטיול שעליו מדברים בהמשך השיחה.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        startDate: { type: "string", description: "YYYY-MM-DD" },
        endDate: { type: "string", description: "YYYY-MM-DD, אחרי startDate." },
        baseCurrencyCode: { type: "string", description: "קוד מטבע ISO-4217 בן 3 אותיות, אם צוין." },
      },
      required: ["name", "startDate", "endDate"],
    },
  },
  {
    name: "plan_day",
    description:
      "הוספת מקום ליום ספציפי במסלול הטיול הפעיל — כשהמשתמש אומר במפורש שהוא רוצה לבקר/לעשות משהו ביום מסוים. אם המקום לא שמור עדיין אצל המשתמש, נוצר עבורו רשומת-מקום חדשה אוטומטית. לא מתאים לשימוש כשהמשתמש רק שואל/מבקש המלצות — רק כשהוא אומר לתכנן/להוסיף בפועל.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "היום בטיול שאליו מוסיפים, YYYY-MM-DD — בתוך טווח תאריכי הטיול הפעיל." },
        placeName: { type: "string" },
        category: {
          type: "string",
          description: "קטגוריית המקום.",
          enum: ["hotel", "restaurant", "cafe", "bar", "mall", "shop", "massage", "attraction", "entertainment", "beach", "nature", "river", "waterfall", "viewpoint", "market", "other"],
        },
        address: { type: "string" },
        plannedArrivalAt: { type: "string", description: "ISO 8601, אם צוינה שעה." },
      },
      required: ["date", "placeName", "category"],
    },
  },

  // --- חיפוש/המלצות — כלי-קריאה בלבד, אף פעם לא כותבים ל-DB ---
  {
    name: "find_nearby_places",
    description:
      "חיפוש מקומות אמיתיים קרובים למיקום הנוכחי של המשתמש (לפי GPS מהדפדפן, לא לפי מה שהמודל מנחש) — לשאלות כמו \"מה יש קרוב אליי\". כלי-קריאה בלבד, לא רושם שום דבר.",
    input_schema: {
      type: "object",
      properties: {
        radiusKm: { type: "number", description: "רדיוס חיפוש בק\"מ, עד 20. ברירת מחדל 2 אם לא צוין." },
        categories: {
          type: "array",
          description: "קטגוריות לחיפוש. אם המשתמש לא ציין, בחר קטגוריות סבירות (attraction, restaurant, cafe).",
          items: {
            type: "string",
            enum: ["hotel", "restaurant", "cafe", "bar", "mall", "shop", "massage", "attraction", "entertainment", "beach", "nature", "river", "waterfall", "viewpoint", "market", "other"],
          },
        },
      },
      required: ["categories"],
    },
  },
  {
    name: "recommend_places",
    description: 'המלצות אמיתיות (Google) על מסעדות/אטרקציות באזור/עיר מסוימת — לשאלות כמו "מה מומלץ לראות בבנגקוק". כלי-קריאה בלבד, לא רושם שום דבר.',
    input_schema: {
      type: "object",
      properties: {
        area: { type: "string", description: 'שם העיר/האזור, למשל "בנגקוק" או "האי פוקט".' },
        category: { type: "string", description: 'סוג ההמלצה, למשל "מסעדות" או "אטרקציות" — אופציונלי.' },
      },
      required: ["area"],
    },
  },
];
