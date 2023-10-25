export default function Check({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      shapeRendering="geometricPrecision"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
