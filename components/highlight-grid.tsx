"use client";

import { useEffect, useRef } from "react";
import type { Highlight } from "@/lib/highlights";
import { HighlightCard } from "./highlight-card";

export function HighlightGrid({ highlights }: { highlights: Highlight[] }) {
  const gridRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === "undefined") return;

    function arrangeCards() {
      if (!grid) return;

      const columns = Number(getComputedStyle(grid).getPropertyValue("--columns")) || 1;
      const heights = Array<number>(columns).fill(0);

      grid.dataset.masonry = "true";

      Array.from(grid.children).forEach((item, index) => {
        (item as HTMLLIElement).style.gridColumn = String(index % columns + 1);
      });

      Array.from(grid.children).forEach((item, index) => {
        const cell = item as HTMLLIElement;
        const card = cell.firstElementChild;
        if (!card) return;

        const column = index % columns;
        const height = Math.ceil(card.getBoundingClientRect().height) + 24;
        cell.style.gridArea = `${heights[column] + 1} / ${column + 1} / span ${height} / span 1`;
        heights[column] += height;
      });
    }

    const observer = new ResizeObserver(arrangeCards);
    observer.observe(grid);
    Array.from(grid.children).forEach((item) => {
      if (item.firstElementChild) observer.observe(item.firstElementChild);
    });
    arrangeCards();

    return () => observer.disconnect();
  }, [highlights]);

  return (
    <ol ref={gridRef} className="highlight-grid" aria-label="Highlights">
      {highlights.map((highlight) => (
        <li key={highlight.id}>
          <HighlightCard highlight={highlight} />
        </li>
      ))}
    </ol>
  );
}
