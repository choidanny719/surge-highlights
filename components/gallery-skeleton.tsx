export function GallerySkeleton() {
  return (
    <div role="status" aria-label="Loading highlights">
      <div className="highlight-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="highlight-card" key={index}>
            <div className="photo-skeleton skeleton" />
            <div className="text-skeleton skeleton" />
            <div className="text-skeleton short skeleton" />
            <div className="description-skeleton skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
