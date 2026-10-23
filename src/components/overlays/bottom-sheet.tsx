"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useUiText } from "../../translations/ui-provider";

// Non-modal persistent bottom panel with drag-to-collapse/expand.
// Positioning and sizing are app-owned via className (the kit only sets
// structure + the translateY transform; Tailwind translate utilities compose
// via the independent CSS `translate` property).
//
// Distinct from Sheet: Sheet is a modal dialog; BottomSheet is always
// mounted chrome (maps, players, detail panels).

const FLICK_VELOCITY = 0.4;
const DRAG_THRESHOLD = 0.25;

export type BottomSheetProps = {
  children: React.ReactNode;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Uncontrolled initial state. @default false */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Visible stub height when collapsed. @default 48 */
  peek?: number;
  /** Accessible name for the panel region. @default "Details panel" */
  label?: string;
  /** Positioning/sizing (app-owned). */
  className?: string;
  /** Applied to the scrollable content wrapper alongside its defaults. */
  scrollClassName?: string;
  /** Applied to the drag handle button alongside its defaults. */
  handleClassName?: string;
};

export function BottomSheet({
  children,
  expanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  peek = 48,
  label: providedLabel,
  className,
  scrollClassName,
  handleClassName,
}: BottomSheetProps) {
  const localizedLabel = useUiText("bottomSheet.label", "Details panel");
  const label = providedLabel ?? localizedLabel;
  const sheetRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = React.useState(0);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
  const isDragging = React.useRef(false);
  const didDrag = React.useRef(false);
  const dragRef = React.useRef<{ startY: number; startTime: number } | null>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const contentId = React.useId();

  const expanded = controlledExpanded ?? internalExpanded;

  const getHeight = React.useCallback(() => sheetRef.current?.offsetHeight ?? 400, []);
  const closedY = React.useCallback(() => Math.max(0, getHeight() - peek), [getHeight, peek]);

  const setExpanded = React.useCallback(
    (next: boolean) => {
      onExpandedChange?.(next);
      if (controlledExpanded === undefined) setInternalExpanded(next);
    },
    [controlledExpanded, onExpandedChange],
  );

  const snapTo = React.useCallback((targetY: number) => {
    setTranslateY(targetY);
    setDragOffset(0);
  }, []);

  // Sync visuals with expanded state (and settle closed on mount).
  React.useEffect(() => {
    snapTo(expanded ? 0 : closedY());
  }, [expanded, closedY, snapTo]);

  React.useEffect(() => {
    if (contentRef.current) contentRef.current.inert = !expanded;
  }, [expanded]);

  React.useEffect(() => {
    const element = sheetRef.current;
    if (!element || expanded || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => snapTo(closedY()));
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [closedY, expanded, snapTo]);

  const open = React.useCallback(() => setExpanded(true), [setExpanded]);
  const close = React.useCallback(() => setExpanded(false), [setExpanded]);

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    didDrag.current = false;
    dragRef.current = { startY: e.clientY, startTime: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !dragRef.current) return;
      const delta = e.clientY - dragRef.current.startY;
      if (Math.abs(delta) > 4) didDrag.current = true;
      setDragOffset(Math.max(-translateY, delta));
    },
    [translateY],
  );

  const endDrag = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !dragRef.current) return;
      isDragging.current = false;

      const delta = e.clientY - dragRef.current.startY;
      const elapsed = Date.now() - dragRef.current.startTime;
      const velocity = elapsed > 0 ? delta / elapsed : 0;
      dragRef.current = null;
      setDragOffset(0);

      if (didDrag.current) {
        const height = getHeight();
        const newY = Math.max(0, translateY + delta);
        const fraction = height > 0 ? newY / height : 0;

        if (velocity > FLICK_VELOCITY) close();
        else if (velocity < -FLICK_VELOCITY) open();
        else if (fraction > DRAG_THRESHOLD) close();
        else open();
      }
    },
    [translateY, getHeight, open, close],
  );

  const onHandleClick = React.useCallback(() => {
    if (didDrag.current) return;
    if (expanded) close();
    else open();
  }, [expanded, open, close]);

  const currentY = Math.max(0, translateY + dragOffset);

  return (
    <section
      ref={sheetRef}
      data-slot="bottom-sheet"
      aria-label={label}
      className={cn("flex flex-col overflow-hidden", className)}
      style={{
        transform: expanded
          ? `translateY(${currentY}px)`
          : `translateY(calc(100% - ${peek}px))`,
        transition: isDragging.current
          ? "none"
          : reduceMotion
            ? "none"
            : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <button
        type="button"
        data-slot="button bottom-sheet-handle"
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={expanded ? "Collapse panel" : "Expand panel"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onHandleClick}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
        className={cn(
          "ui-bottom-sheet-handle flex w-full shrink-0 cursor-grab justify-center py-3.5 active:cursor-grabbing",
          handleClassName,
        )}
      >
        <span aria-hidden="true" className="bg-border h-1 w-9 rounded-full" />
      </button>
      <div
        ref={contentRef}
        data-slot="bottom-sheet-scroll"
        id={contentId}
        aria-hidden={!expanded || undefined}
        className={cn("flex-1 overflow-y-auto", scrollClassName)}
      >
        {children}
      </div>
    </section>
  );
}
