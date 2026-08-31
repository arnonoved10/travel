"use client";

import { useActionState, useRef } from "react";
import type { TripCompanion } from "@travel-app/shared-types";
import type { CompanionPollWithOptions } from "@travel-app/data-layer";
import { createCompanionPollAction, deleteCompanionPollAction, recordCompanionVoteAction, type CompanionPollFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { Select } from "@/components/ui/Select";

const initialState: CompanionPollFormState = {};

export function CompanionPollsSection({ tripId, polls, companions }: { tripId: string; polls: CompanionPollWithOptions[]; companions: TripCompanion[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {companions.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 }}>צריך קודם להוסיף מלווים כדי ליצור הצבעה.</p>
      ) : (
        <>
          {polls.map((poll) => (
            <PollCard key={poll.id} tripId={tripId} poll={poll} companions={companions} />
          ))}
          {polls.length === 0 ? <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 }}>אין עדיין הצבעות.</p> : null}
          <CreatePollForm tripId={tripId} />
        </>
      )}
    </div>
  );
}

function PollCard({ tripId, poll, companions }: { tripId: string; poll: CompanionPollWithOptions; companions: TripCompanion[] }) {
  const votedCompanionIds = new Set(poll.options.flatMap((o) => o.voterCompanionIds));

  return (
    <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontWeight: 600 }}>{poll.question}</span>
        <form action={deleteCompanionPollAction.bind(null, tripId, poll.id)}>
          <button
            type="submit"
            style={{
              padding: "0.125rem 0.5rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            מחק סקר
          </button>
        </form>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {poll.options.map((option) => (
          <li key={option.id} style={{ fontSize: "0.875rem" }}>
            {option.text} — {option.voterCompanionIds.length} קולות
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {companions.map((companion) => {
          const currentVote = poll.options.find((o) => o.voterCompanionIds.includes(companion.id));
          return (
            <VoteForm
              key={companion.id}
              tripId={tripId}
              pollId={poll.id}
              companionId={companion.id}
              companionName={companion.displayName}
              currentOptionId={currentVote?.id ?? ""}
              options={poll.options}
            />
          );
        })}
      </div>

      {votedCompanionIds.size === 0 ? <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>עדיין אין הצבעות רשומות.</p> : null}
    </div>
  );
}

function VoteForm({
  tripId,
  pollId,
  companionId,
  companionName,
  currentOptionId,
  options,
}: {
  tripId: string;
  pollId: string;
  companionId: string;
  companionName: string;
  currentOptionId: string;
  options: CompanionPollWithOptions["options"];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={recordCompanionVoteAction.bind(null, tripId, pollId, companionId)}
      style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
    >
      <span style={{ fontSize: "0.8125rem", minWidth: "72px" }}>{companionName}</span>
      <Select
        name="optionId"
        defaultValue={currentOptionId}
        onChange={() => formRef.current?.requestSubmit()}
        style={{ ...inputStyle, padding: "0.25rem" }}
        placeholder="לא הצביע/ה"
        options={options.map((option) => ({ value: option.id, label: option.text }))}
      />
    </form>
  );
}

function CreatePollForm({ tripId }: { tripId: string }) {
  const action = createCompanionPollAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        שאלה חדשה
        <input name="question" required style={inputStyle} placeholder="למשל: איפה אוכלים הערב?" />
        {state?.fieldErrors?.question?.map((m) => (
          <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>
            {m}
          </span>
        ))}
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <input key={i} name="optionText" placeholder={`אפשרות ${i}${i <= 2 ? " (חובה)" : " (אופציונלי)"}`} required={i <= 2} style={{ ...inputStyle, minWidth: "140px", flex: 1 }} />
        ))}
      </div>
      {state?.fieldErrors?.optionTexts?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "יוצר..." : "צור הצבעה"}
      </button>
    </form>
  );
}
