import type { NotificationPreference } from "@travel-app/shared-types";
import {
  DEFAULT_LEAD_TIME_MINUTES,
  NOTIFICATION_EVENT_TYPE_LABELS,
  STATE_BASED_NOTIFICATION_EVENT_TYPES,
  SUPPORTED_NOTIFICATION_EVENT_TYPES,
} from "@/lib/notification-event-type-labels";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { upsertNotificationPreferenceAction } from "./actions";

export function NotificationPreferencesSection({ tripId, preferences }: { tripId: string; preferences: NotificationPreference[] }) {
  const action = upsertNotificationPreferenceAction.bind(null, tripId);
  const byType = new Map(preferences.map((p) => [p.eventType, p]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 }}>
        התראות דפדפן מקומיות (Notification API) בזמן שהדף &quot;עכשיו&quot; פתוח — לא Push אמיתי שמגיע גם כשהאפליקציה סגורה, ראה DECISIONS.md. יש
        להפעיל הרשאת התראות במסך &quot;עכשיו&quot;.
      </p>
      {SUPPORTED_NOTIFICATION_EVENT_TYPES.map((eventType) => {
        const pref = byType.get(eventType);
        return (
          <form key={eventType} action={action} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="eventType" value={eventType} />
            <label style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <input type="checkbox" name="isEnabled" defaultChecked={pref?.isEnabled ?? false} />
              {NOTIFICATION_EVENT_TYPE_LABELS[eventType]}
            </label>
            <label style={{ display: "flex", gap: "0.375rem", alignItems: "center", fontSize: "0.8125rem" }}>
              דקות מראש
              <input
                type="number"
                name="leadTimeMinutes"
                min="1"
                defaultValue={pref?.leadTimeMinutes ?? DEFAULT_LEAD_TIME_MINUTES[eventType]}
                style={{ ...inputStyle, width: "5rem" }}
              />
            </label>
            <button type="submit" className="ui-btn-primary" style={submitButtonStyle(false)}>
              שמור
            </button>
          </form>
        );
      })}

      <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
        התראות-מצב (לא &quot;לפני אירוע&quot; עם שעה מדויקת — נבדקות בכל טעינה של &quot;עכשיו&quot;), כולל הזמנות שלא שולמו במלואן:
      </p>
      {STATE_BASED_NOTIFICATION_EVENT_TYPES.map((eventType) => {
        const pref = byType.get(eventType);
        return (
          <form key={eventType} action={action} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="eventType" value={eventType} />
            <label style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <input type="checkbox" name="isEnabled" defaultChecked={pref?.isEnabled ?? false} />
              {NOTIFICATION_EVENT_TYPE_LABELS[eventType]}
            </label>
            <button type="submit" className="ui-btn-primary" style={submitButtonStyle(false)}>
              שמור
            </button>
          </form>
        );
      })}
    </div>
  );
}
