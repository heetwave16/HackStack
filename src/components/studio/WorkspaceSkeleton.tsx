export default function WorkspaceSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Generating your studio</span>
      <div className="h-24 animate-pulse rounded bg-surface-1" aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded bg-surface-1" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded bg-surface-1" aria-hidden="true" />
    </div>
  );
}
