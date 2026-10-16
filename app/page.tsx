import { Suspense } from "react";
import { GallerySkeleton } from "@/components/gallery-skeleton";
import { HighlightGallery } from "@/components/highlight-gallery";
import { getHighlights } from "@/lib/surge";

export const dynamic = "force-dynamic";

async function Highlights() {
  const highlights = await getHighlights().catch(() => null);
  return <HighlightGallery initialHighlights={highlights ?? []} loadFailed={highlights === null} />;
}

export default function Home() {
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Highlights</p>
        <h1>What are the special moments of your life?</h1>
        <p className="intro">
          We believe every moment counts! Share your favorite highlights,
          unforgettable memories, and the stories that make your life shine.
        </p>
      </header>
      <Suspense fallback={<GallerySkeleton />}>
        <Highlights />
      </Suspense>
    </main>
  );
}
