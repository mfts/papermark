export function ConfidentialViewOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/75 backdrop-blur-[2px]">
      <div className="max-w-sm rounded-xl border border-border bg-background px-5 py-4 text-center shadow-lg">
        <p className="text-sm font-semibold text-foreground">Confidential view</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This content is hidden until the viewer confirms access.
        </p>
      </div>
    </div>
  );
}