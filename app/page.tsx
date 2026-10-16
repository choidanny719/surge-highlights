import { Suspense } from "react";
import { GallerySkeleton } from "@/components/gallery-skeleton";
import { HighlightGallery } from "@/components/highlight-gallery";
import { getHighlights } from "@/lib/surge";

async function Highlights() {
  try {
    const highlights = await getHighlights();
    return <HighlightGallery initialHighlights={highlights} />;
  } catch {
    return <HighlightGallery initialHighlights={[]} loadFailed />;
  }
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
