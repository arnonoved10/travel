// קישורי-חיפוש חיצוניים למלון (Booking.com/Google Hotels/Trivago/Hotels.com) —
// בלי מפתח API, בלי הרשמה, בלי scraping. אותו עיקרון בדיוק כמו navigate-links.ts
// (Google Maps/Waze): בונים URL חיפוש רגיל, לא קוראים נתונים מהאתרים בפועל.
// אלה best-effort deep-links (לא API רשמי) — יתכן שהפורמט המדויק ישתנה אם
// אחד האתרים משנה את מבנה ה-URL שלו; במקרה הגרוע נוחתים בדף חיפוש כללי,
// לא בשגיאה.
export interface HotelSearchLinks {
  bookingComUrl: string;
  googleHotelsUrl: string;
  trivagoUrl: string;
  hotelsComUrl: string;
}

export function buildHotelSearchLinks(params: {
  hotelName: string;
  address?: string | null;
  checkInDate: string;
  checkOutDate: string;
}): HotelSearchLinks {
  const query = [params.hotelName, params.address].filter(Boolean).join(", ");
  const encodedQuery = encodeURIComponent(query);
  const checkin = params.checkInDate;
  const checkout = params.checkOutDate;

  return {
    bookingComUrl: `https://www.booking.com/searchresults.html?ss=${encodedQuery}&checkin=${checkin}&checkout=${checkout}&group_adults=2&no_rooms=1`,
    googleHotelsUrl: `https://www.google.com/travel/search?q=${encodedQuery}&checkin=${checkin}&checkout=${checkout}`,
    trivagoUrl: `https://www.trivago.com/en-US/srl?query=${encodedQuery}&checkin_year_month_day=${checkin}&checkout_year_month_day=${checkout}`,
    hotelsComUrl: `https://www.hotels.com/search.do?destination=${encodedQuery}&startDate=${checkin}&endDate=${checkout}`,
  };
}
