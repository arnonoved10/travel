-- Document.tripId הופך ל-nullable — נדרש כדי לתמוך בתמונות למקומות (Place),
-- שהיא ישות גלובלית ולא שייכת לטיול ספציפי (סעיף 7 באפיון).
ALTER TABLE "documents" ALTER COLUMN "tripId" DROP NOT NULL;
