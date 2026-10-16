import { describe, expect, it } from "vitest";
import { fieldLimits, isHighlight, validateHighlight } from "@/lib/highlights";

const input = { title: "Grouse Grind", location: "Vancouver, BC", description: "A great hike." };

describe("highlight validation", () => {
  it("trims input before saving", () => {
    expect(validateHighlight({ title: "  Hike ", location: " Vancouver ", description: " A good day.\n" }))
      .toEqual({ values: { title: "Hike", location: "Vancouver", description: "A good day." }, errors: {} });
  });

  it.each([null, [], {}, { title: " ", location: 12, description: false }])("rejects missing or invalid fields: %j", (value) => {
    expect(Object.keys(validateHighlight(value).errors)).toEqual(["title", "location", "description"]);
  });

  it.each(["title", "location", "description"] as const)("enforces the %s length limit", (field) => {
    expect(validateHighlight({ ...input, [field]: "a".repeat(fieldLimits[field]) }).errors).toEqual({});
    expect(validateHighlight({ ...input, [field]: "a".repeat(fieldLimits[field] + 1) }).errors[field]).toBeDefined();
  });

  it("keeps Unicode and internal line breaks", () => {
    const values = { title: "산책 🌲", location: "밴쿠버", description: "First line\nSecond line" };
    expect(validateHighlight(values)).toEqual({ values, errors: {} });
  });

  it("accepts string and numeric IDs but rejects malformed records", () => {
    expect(isHighlight({ ...input, id: 1 })).toBe(true);
    expect(isHighlight({ ...input, id: "new-highlight" })).toBe(true);
    expect(isHighlight({ ...input, id: null })).toBe(false);
    expect(isHighlight({ id: 1, title: "Incomplete" })).toBe(false);
  });
});
