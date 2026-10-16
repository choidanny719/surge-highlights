import "server-only";
import { decode } from "html-entities";

export type Photo = {
  url: string;
  title: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string | null;
};

type ImageInfo = {
  thumburl?: string;
  descriptionurl?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value?: string }>;
};

type CommonsPage = {
  index?: number;
  title?: string;
  imageinfo?: ImageInfo[];
};

function plainText(value: string | undefined) {
  return decode((value ?? "").replace(/<[^>]*>/g, "")).trim();
}

function safeUrl(value: string | undefined, hosts?: string[]) {
  try {
    const url = new URL(value ?? "");

    if (url.protocol !== "https:") return null;
    if (hosts && !hosts.includes(url.hostname)) return null;

    return url.href;
  } catch {
    return null;
  }
}

export function pickPhoto(pages: CommonsPage[]): Photo | null {
  const sorted = [...pages].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (const page of sorted) {
    const info = page.imageinfo?.[0];
    if (!info) continue;

    const url = safeUrl(info.thumburl, ["upload.wikimedia.org", "thumb.wikimedia.org"]);
    const sourceUrl = safeUrl(info.descriptionurl, ["commons.wikimedia.org"]);
    const meta = info.extmetadata;
    const license = plainText(meta?.LicenseShortName?.value);
    const creator = plainText(meta?.Artist?.value);

    if (!url || !sourceUrl || !license || !creator) continue;

    return {
      url,
      sourceUrl,
      title: plainText(meta?.ObjectName?.value) || (page.title ?? "Photo").replace(/^File:/, ""),
      creator,
      license,
      licenseUrl: safeUrl(meta?.LicenseUrl?.value?.replace(/^http:/, "https:")),
    };
  }

  return null;
}

async function searchPhotos(query: string): Promise<Photo | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "3",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "960",
    iiextmetadatafilter: "Artist|ObjectName|LicenseShortName|LicenseUrl",
    maxlag: "5",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: {
      "User-Agent": "SurgeHighlights/1.0 (https://github.com/choidanny719/surge-highlights)",
    },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) throw new Error("Photo search is unavailable.");

  const data = await response.json();
  if (data.error) throw new Error("Photo search is temporarily busy.");

  return pickPhoto(Array.isArray(data.query?.pages) ? data.query.pages : []);
}

export async function findPhoto(title: string, location: string) {
  const photo = await searchPhotos(title);
  if (photo || title.toLowerCase() === location.toLowerCase()) return photo;

  return searchPhotos(location);
}
