"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Photo } from "@/lib/photos";

export function HighlightPhoto({ title, location }: { title: string; location: string }) {
  const [photo, setPhoto] = useState<Photo | null>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ title, location });

    fetch(`/api/photos?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { photo: null })
      .then((data) => {
        if (!controller.signal.aborted) setPhoto(data.photo);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhoto(null);
      });

    return () => controller.abort();
  }, [title, location]);

  if (photo === null || failed) return null;

  if (!photo) {
    return <div className="photo-skeleton skeleton" aria-hidden="true" />;
  }

  return (
    <figure className="highlight-photo">
      <Image
        src={photo.url}
        alt={photo.title}
        width={960}
        height={540}
        unoptimized
        onError={() => setFailed(true)}
      />
      <details className="photo-credit">
        <summary aria-label={`Photo credit for ${title}`}>i</summary>
        <div className="photo-credit-content">
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.title}</a>
          <span>Photo by {photo.creator}</span>
          {photo.licenseUrl ? (
            <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>
          ) : <span>{photo.license}</span>}
          <span>Cropped to fit.</span>
        </div>
      </details>
    </figure>
  );
}
