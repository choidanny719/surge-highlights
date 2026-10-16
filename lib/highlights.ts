export type HighlightInput = {
  title: string;
  location: string;
  description: string;
};

export type Highlight = HighlightInput & {
  id: number | string;
};

export const fieldLimits = { title: 120, location: 160, description: 2000 };

export type FieldErrors = Partial<Record<keyof HighlightInput, string>>;

export function validateHighlight(value: unknown): {
  values: HighlightInput;
  errors: FieldErrors;
} {
  const input = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const values: HighlightInput = { title: "", location: "", description: "" };
  const errors: FieldErrors = {};
  const labels = { title: "Highlight name", location: "Location", description: "Description" };

  for (const field of Object.keys(values) as (keyof HighlightInput)[]) {
    const raw = input[field];
    values[field] = typeof raw === "string" ? raw.trim() : "";

    if (!values[field]) errors[field] = `${labels[field]} is required.`;
    else if (values[field].length > fieldLimits[field]) {
      errors[field] = `Use ${fieldLimits[field]} characters or fewer.`;
    }
  }

  return { values, errors };
}

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
