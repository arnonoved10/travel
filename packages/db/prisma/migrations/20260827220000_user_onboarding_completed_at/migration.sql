-- User.onboardingCompletedAt — מתי המשתמש סיים/דילג על מסך ההדרכה הראשוני,
-- אותה סמנטיקה בדיוק כמו legalConsentAcceptedAt (null = טרם).
ALTER TABLE "users" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
