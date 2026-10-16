import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHighlight, getHighlights } from "@/lib/surge";

const highlight = { id: 1, title: "Grouse Grind", location: "Vancouver", description: "A good day." };
const input = { title: highlight.title, location: highlight.location, description: highlight.description };

beforeEach(() => {
  vi.stubEnv("SURGE_ACCESS_KEY", "test/key");
});

describe("Surge requests", () => {
  it("loads the supplied order and keeps the key in the server request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([highlight]));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getHighlights()).toEqual([highlight]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://surgetakehome.vercel.app/api/getreviews/test%2Fkey",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("accepts an empty collection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    expect(await getHighlights()).toEqual([]);
  });

  it("loads added highlights newest first while keeping the starter cards in order", async () => {
    const starters = Array.from({ length: 9 }, (_, index) => ({ ...highlight, id: index + 1 }));
    const first = { ...highlight, id: 10, title: "First addition" };
    const latest = { ...highlight, id: 11, title: "Latest addition" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([...starters, first, latest])));

    expect(await getHighlights()).toEqual([latest, first, ...starters]);
  });

  it("identifies starter cards by ID when some are missing or IDs are strings", async () => {
    const starter = { ...highlight, id: "9" };
    const first = { ...highlight, id: "10" };
    const latest = { ...highlight, id: "11" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([starter, first, latest])));

    expect(await getHighlights()).toEqual([latest, first, starter]);
  });

  it("does not make a request without a configured key", async () => {
    vi.stubEnv("SURGE_ACCESS_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getHighlights()).rejects.toThrow("not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{ message: "Unexpected" }, [{ id: 1 }]])("rejects malformed GET data", async (data) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(data)));
    await expect(getHighlights()).rejects.toThrow("invalid response");
  });

  it("handles service failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(getHighlights()).rejects.toThrow("unavailable");
    await expect(createHighlight(input)).rejects.toThrow("could not be saved");
  });

  it("sends only the three expected fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(highlight));
    vi.stubGlobal("fetch", fetchMock);
    expect(await createHighlight(input)).toEqual(highlight);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://surgetakehome.vercel.app/api/postreview/test%2Fkey",
      expect.objectContaining({ method: "POST", body: JSON.stringify(input) }),
    );
  });

  it("accepts a wrapped created record", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ review: highlight })));
    expect(await createHighlight(input)).toEqual(highlight);
  });

  it("can display a saved highlight when the API only acknowledges success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await createHighlight(input)).toEqual({ ...input, id: expect.any(String) });
  });

  it("propagates a network failure without retrying a POST", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createHighlight(input)).rejects.toThrow("Network unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
