-- הערות רפואיות אישיות למסך חירום (סעיף 21.3 באפיון) — אופציונלי, המשתמש בוחר אם למלא
ALTER TABLE "trips" ADD COLUMN "medicalNotes" TEXT;

-- עותק דרכון כסוג מסמך ייעודי, כדי שאפשר יהיה לסנן/להציג אותו במסך החירום בנפרד
ALTER TYPE "DocumentType" ADD VALUE 'passport_copy';
