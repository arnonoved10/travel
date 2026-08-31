-- הוספת "activity_reservation" ל-enum DocumentEntityType הקיים — מאפשר
-- מסמכים/כרטיסים מקושרים לרשומת אטרקציה (ר' 20260823100000_activity_reservations).
ALTER TYPE "DocumentEntityType" ADD VALUE 'activity_reservation';
