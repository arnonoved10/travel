-- הוספת "river" ו-"entertainment" ל-enum PlaceCategory הקיים — נדרשים
-- להמלצות מקומות אמיתיות (Overpass API): נחלים ומקומות בילוי לא היו
-- ניתנים לייצוג בקטגוריה קיימת בלי לאבד דיוק.
-- Postgres דורש כל ALTER TYPE ... ADD VALUE כמשפט נפרד (לא בתוך טרנזקציה
-- אחת עם משפטים אחרים שמשתמשים בערך החדש).
ALTER TYPE "PlaceCategory" ADD VALUE 'entertainment';
ALTER TYPE "PlaceCategory" ADD VALUE 'river';
