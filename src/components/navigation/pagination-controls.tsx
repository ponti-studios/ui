"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../primitives/button";
import { useUiText } from "../../translations/ui-provider";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Zero-indexed prev/next pagination control. */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const previousLabel = useUiText("pagination.previous", "Previous page");
  const nextLabel = useUiText("pagination.next", "Next page");
  return (
    <div className="border-border bg-background text-foreground inline-flex w-fit shrink-0 items-center self-start overflow-hidden rounded-full border text-sm">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-none border-0 border-r bg-transparent shadow-none"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label={previousLabel}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <span className="min-w-20 px-3 text-center text-xs tabular-nums">
        {currentPage + 1} of {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-none border-0 border-l bg-transparent shadow-none"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        aria-label={nextLabel}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
