import { validateHighlight } from "@/lib/highlights";
import { createHighlight } from "@/lib/surge";

export async function POST(request: Request) {
  let data: unknown;

  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "The request must contain valid JSON." }, { status: 400 });
  }

  const { values, errors } = validateHighlight(data);

  if (Object.keys(errors).length) {
    return Response.json({ errors }, { status: 400 });
  }

  try {
    const highlight = await createHighlight(values);
    return Response.json({ highlight }, { status: 201 });
  } catch {
    return Response.json({
      error: "We couldn’t confirm that your highlight was saved. Your text is still here. Check the page before trying again.",
    }, { status: 502 });
  }
}
