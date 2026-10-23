"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Override Ponti's built-in control labels without wrapping every component. */
export type UiMessages = Partial<Record<UiMessageKey, string>>;
export type UiMessageKey =
  | "button.loading"
  | "bottomSheet.label"
  | "datePicker.open"
  | "filterSelect.empty"
  | "filterChip.remove"
  | "filters.clearAll"
  | "pagination.previous"
  | "pagination.next"
  | "dialog.close"
  | "sheet.close";

const UiMessagesContext = createContext<UiMessages>({});

export function UiTextProvider({ children, messages }: { children: ReactNode; messages: UiMessages }) {
  return <UiMessagesContext.Provider value={messages}>{children}</UiMessagesContext.Provider>;
}

export function useUiText(key: UiMessageKey, fallback: string) {
  const messages = useContext(UiMessagesContext);
  return messages[key] ?? fallback;
}
