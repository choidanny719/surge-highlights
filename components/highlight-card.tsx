import type { Highlight } from "@/lib/highlights";
import { HighlightPhoto } from "./highlight-photo";

export function HighlightCard({ highlight }: { highlight: Highlight }) {
  return (
    <article className="highlight-card">
      <HighlightPhoto title={highlight.title} location={highlight.location} />
      <h2>{highlight.title}</h2>
      <p className="highlight-location">{highlight.location}</p>
      <p className="highlight-description">{highlight.description}</p>
    </article>
  );
}
