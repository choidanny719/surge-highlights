import "server-only";
import { isHighlight, type Highlight } from "./highlights";

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
