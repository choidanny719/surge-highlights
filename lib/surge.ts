import "server-only";
import { isHighlight, type Highlight, type HighlightInput } from "./highlights";

const baseUrl = "https://surgetakehome.vercel.app/api";

function endpoint(path: string) {
  const key = process.env.SURGE_ACCESS_KEY?.trim();

  if (!key) throw new Error("SURGE_ACCESS_KEY is not configured.");

  return `${baseUrl}/${path}/${encodeURIComponent(key)}`;
}

export async function getHighlights(): Promise<Highlight[]> {
  const response = await fetch(endpoint("getreviews"), {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error("The highlights service is unavailable.");

  const data: unknown = await response.json();

  if (!Array.isArray(data) || !data.every(isHighlight)) {
    throw new Error("The highlights service returned an invalid response.");
  }

  return data;
}

export async function createHighlight(input: HighlightInput): Promise<Highlight> {
  const response = await fetch(endpoint("postreview"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error("The highlight could not be saved.");

  const data = await response.json().catch(() => null);
  const saved = [data, data?.review, data?.highlight, data?.data].find(isHighlight);

  return saved ?? { ...input, id: crypto.randomUUID() };
}
