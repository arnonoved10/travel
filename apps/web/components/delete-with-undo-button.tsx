"use client";

import { useRouter } from "next/navigation";
import { useTransition, type CSSProperties } from "react";
import { useToast } from "@/components/toast-provider";

const DEFAULT_STYLE: CSSProperties = {
  minHeight: "2.25rem",
  padding: "0.375rem 0.75rem",
  borderRadius: "var(--radius-full)",
  fontSize: "0.8125rem",
};

export function DeleteWithUndoButton({
  onDelete,
  onUndo,
  undoMessage,
  label = "הסר",
  style,
}: {
  onDelete: () => Promise<unknown>;
  onUndo: () => Promise<unknown>;
  undoMessage: string;
  label?: string;
  style?: CSSProperties;
}) {
  const { pushToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await onDelete();
      router.refresh();
      pushToast(undoMessage, {
        label: "בטל",
        onAction: async () => {
          await onUndo();
          router.refresh();
        },
      });
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="ui-btn-danger"
      style={{
        ...DEFAULT_STYLE,
        ...style,
        border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
        background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
        color: "var(--color-danger)",
        fontWeight: 600,
        cursor: isPending ? "default" : "pointer",
        opacity: isPending ? 0.6 : 1,
        transition: "all var(--duration-base) var(--ease-out)",
      }}
    >
      {label}
    </button>
  );
}
