"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Highlight } from "@/lib/highlights";
import { HighlightGrid } from "./highlight-grid";
import { CreateHighlight } from "./create-highlight";

export function HighlightGallery({
  initialHighlights,
  loadFailed = false,
}: {
  initialHighlights: Highlight[];
  loadFailed?: boolean;
}) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  const [created, setCreated] = useState<Highlight[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const createdIds = new Set(created.map((highlight) => highlight.id));
  const highlights = [...created, ...initialHighlights.filter((highlight) => !createdIds.has(highlight.id))];

  function addHighlight(highlight: Highlight) {
    setCreated((current) => [highlight, ...current]);
    setAnnouncement(`${highlight.title} was added to your highlights.`);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

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
      {!loadFailed && highlights.length === 0 && (
        <p className="gallery-message">No highlights yet. Share the first one!</p>
      )}
      <HighlightGrid highlights={highlights} />
      <CreateHighlight onCreate={addHighlight} />
      <p className="sr-only" role="status">{announcement}</p>
    </section>
  );
}
