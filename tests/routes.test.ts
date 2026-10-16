import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/highlights/route";
import { GET } from "@/app/api/photos/route";
import { createHighlight } from "@/lib/surge";
import { findPhoto } from "@/lib/photos";

vi.mock("@/lib/surge", () => ({ createHighlight: vi.fn() }));
vi.mock("@/lib/photos", () => ({ findPhoto: vi.fn() }));

const values = { title: "Hike", location: "Vancouver", description: "A good day." };

function post(body: string) {
  return new Request("http://localhost/api/highlights", { method: "POST", body });
}

beforeEach(() => {
  vi.mocked(createHighlight).mockReset();
  vi.mocked(findPhoto).mockReset();
});

describe("highlight route", () => {
  it("rejects malformed JSON before calling Surge", async () => {
    expect((await POST(post("{"))).status).toBe(400);
    expect(createHighlight).not.toHaveBeenCalled();
  });

  it("returns field errors and never forwards invalid input", async () => {
    const response = await POST(post(JSON.stringify({ ...values, title: " " })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errors: { title: "Highlight name is required." } });
    expect(createHighlight).not.toHaveBeenCalled();
  });

  it("returns the new record and discards unknown request fields", async () => {
    vi.mocked(createHighlight).mockResolvedValue({ ...values, id: 10 });
    const response = await POST(post(JSON.stringify({ ...values, title: " Hike ", key: "ignored" })));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ highlight: { ...values, id: 10 } });
    expect(createHighlight).toHaveBeenCalledWith(values);
  });

  it("does not expose upstream errors or the key", async () => {
    vi.mocked(createHighlight).mockRejectedValue(new Error("private-key"));
    const response = await POST(post(JSON.stringify(values)));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private-key");
  });
});

describe("photo route", () => {
  it("rejects missing or oversized search terms", async () => {
    expect((await GET(new Request("http://localhost/api/photos?title=Hike"))).status).toBe(400);
    expect((await GET(new Request(`http://localhost/api/photos?title=${"x".repeat(121)}&location=BC`))).status).toBe(400);
    expect(findPhoto).not.toHaveBeenCalled();
  });

  it("caches a completed search even when there is no match", async () => {
    vi.mocked(findPhoto).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/photos?title=Hike&location=BC"));
    expect(await response.json()).toEqual({ photo: null });
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
  });

  it("does not cache an upstream outage as a missing photo", async () => {
    vi.mocked(findPhoto).mockRejectedValue(new Error("Timeout"));
    const response = await GET(new Request("http://localhost/api/photos?title=Hike&location=BC"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
