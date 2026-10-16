"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Highlight } from "@/lib/highlights";
import { HighlightGrid } from "./highlight-grid";

export function HighlightGallery({
  initialHighlights,
  loadFailed = false,
}: {
  initialHighlights: Highlight[];
  loadFailed?: boolean;
}) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  return (
    <section aria-label="Shared memories">
      {loadFailed && (
        <div className="gallery-message" role="alert">
          <p>We couldn’t load the highlights. Please try again.</p>
          <button
            className="button button-secondary"
            disabled={retrying}
            onClick={() => startTransition(() => router.refresh())}
          >
            {retrying ? "Retrying…" : "Try again"}
          </button>
        </div>
      )}
      {!loadFailed && initialHighlights.length === 0 && (
        <p className="gallery-message">No highlights yet. Share the first one!</p>
      )}
      <HighlightGrid highlights={initialHighlights} />
    </section>
  );
}
