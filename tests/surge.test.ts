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
