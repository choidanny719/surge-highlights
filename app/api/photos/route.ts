import { findPhoto } from "@/lib/photos";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = params.get("title")?.trim();
  const location = params.get("location")?.trim();

  if (!title || !location || title.length > 120 || location.length > 160) {
    return Response.json({ error: "A highlight name and location are required." }, { status: 400 });
  }

  try {
    const photo = await findPhoto(title, location);

    return Response.json({ photo }, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return Response.json({ photo: null }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
