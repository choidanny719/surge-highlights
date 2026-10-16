export type HighlightInput = {
  title: string;
  location: string;
  description: string;
};

export type Highlight = HighlightInput & {
  id: number | string;
};

export function isHighlight(value: unknown): value is Highlight {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    (typeof item.id === "string" || typeof item.id === "number") &&
    typeof item.title === "string" &&
    typeof item.location === "string" &&
    typeof item.description === "string"
  );
}
