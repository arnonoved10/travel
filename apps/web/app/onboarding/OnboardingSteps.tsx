"use client";

import { useState, useTransition } from "react";
import { Compass, ListChecks, ChatCircleDots, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { completeOnboardingAction } from "./actions";

const STEPS = [
  {
    icon: Compass,
    title: "פותחים טיול",
    body: "כל דבר במערכת — מקומות, הזמנות, הוצאות — שייך לטיול ספציפי. שם, תאריכים ומטבע-בסיס זה כל מה שצריך כדי להתחיל.",
  },
  {
    icon: ListChecks,
    title: "מתכננים לפני שיוצאים",
    body: "מוסיפים מקומות שרוצים לבקר (עם המלצות אמיתיות), מזמינים מלון/טיסות/הסעות, וטוענים לארנק כמה כסף יש בכל מטבע.",
  },
  {
    icon: ChatCircleDots,
    title: "בזמן הטיול, הכל נשמר מסודר",
    body: "רושמים הוצאות והארנק יורד אוטומטית, עוקבים אחרי המסלול היומי — ואפשר גם פשוט לכתוב לעוזר האישי מה קרה, והוא ירשום את זה בעצמו.",
  },
];

export function OnboardingSteps() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const step = STEPS[stepIndex]!;
  const Icon = step.icon;
  const isLastStep = stepIndex === STEPS.length - 1;

  function finish(): void {
    startTransition(async () => {
      await completeOnboardingAction();
    });
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "2rem 1.5rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "4.5rem",
            height: "4.5rem",
            borderRadius: "50%",
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "var(--glow-brand)",
          }}
        >
          <Icon size={32} weight="fill" aria-hidden />
        </div>

        <div>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>{step.title}</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9375rem", lineHeight: 1.6 }}>{step.body}</p>
        </div>

        <div role="group" aria-label="התקדמות" style={{ display: "flex", gap: "0.375rem" }}>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              style={{
                width: i === stepIndex ? "1.5rem" : "0.5rem",
                height: "0.5rem",
                borderRadius: "var(--radius-full)",
                background: i === stepIndex ? "var(--gradient-brand)" : "var(--color-border)",
                transition: "all var(--duration-base) var(--ease-out)",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "0.5rem" }}>
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: isPending ? "default" : "pointer",
              }}
            >
              <ArrowRight size={16} aria-hidden />
              הקודם
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (isLastStep ? finish() : setStepIndex((i) => i + 1))}
            disabled={isPending}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
              color: isPending ? "var(--color-text-muted)" : "#fff",
              fontWeight: 700,
              cursor: isPending ? "default" : "pointer",
              boxShadow: isPending ? "none" : "var(--glow-brand)",
              transition: "all var(--duration-base) var(--ease-out)",
            }}
          >
            {isLastStep ? "בואו נתחיל" : "הבא"}
            {!isLastStep ? <ArrowLeft size={16} aria-hidden /> : null}
          </button>
        </div>

        {!isLastStep ? (
          <button
            type="button"
            onClick={finish}
            disabled={isPending}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "0.8125rem", cursor: isPending ? "default" : "pointer" }}
          >
            דלג
          </button>
        ) : null}
      </div>
    </main>
  );
}
