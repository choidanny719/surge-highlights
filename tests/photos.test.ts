import { describe, expect, it, vi } from "vitest";
import { findPhoto, pickPhoto } from "@/lib/photos";

const page = {
  index: 1,
  title: "File:Mountain.jpg",
  imageinfo: [{
    thumburl: "https://upload.wikimedia.org/mountain.jpg",
    descriptionurl: "https://commons.wikimedia.org/wiki/File:Mountain.jpg",
    extmetadata: {
      Artist: { value: '<a href="/artist">Alex &amp; Jamie</a>' },
      ObjectName: { value: "Mountain" },
      LicenseShortName: { value: "CC BY 4.0" },
      LicenseUrl: { value: "https://creativecommons.org/licenses/by/4.0/" },
    },
  }],
};

describe("photo search", () => {
  it("keeps attribution as plain text", () => {
    expect(pickPhoto([page])).toEqual({
      url: "https://upload.wikimedia.org/mountain.jpg",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mountain.jpg",
      title: "Mountain",
      creator: "Alex & Jamie",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("skips files with unsafe URLs or missing credits", () => {
    const unsafe = { ...page, imageinfo: [{ ...page.imageinfo[0], thumburl: "javascript:alert(1)" }] };
    const uncredited = { ...page, imageinfo: [{ ...page.imageinfo[0], extmetadata: {} }] };
    expect(pickPhoto([unsafe, uncredited])).toBeNull();
    expect(pickPhoto([unsafe, page])).not.toBeNull();
  });

  it("uses relevance order rather than response array order", () => {
    const later = { ...page, index: 2, imageinfo: [{ ...page.imageinfo[0], thumburl: "https://upload.wikimedia.org/later.jpg" }] };
    expect(pickPhoto([later, page])?.url).toBe(page.imageinfo[0].thumburl);
  });

  it("searches the highlight name and caches the provider response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ query: { pages: [page] } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await findPhoto("Grouse Grind", "Vancouver")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url).searchParams.get("gsrsearch")).toBe("Grouse Grind filetype:bitmap");
    expect(options.next.revalidate).toBe(86400);
  });

  it("falls back to the location when the name has no usable image", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ batchcomplete: true }))
      .mockResolvedValueOnce(Response.json({ query: { pages: [page] } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await findPhoto("Unusual memory", "Vancouver")).not.toBeNull();
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("gsrsearch")).toBe("Vancouver filetype:bitmap");
  });

  it("does not repeat identical name and location searches", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ query: { pages: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await findPhoto("Vancouver", "vancouver")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops on rate limits rather than issuing a fallback request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(findPhoto("Hike", "Vancouver")).rejects.toThrow("unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
