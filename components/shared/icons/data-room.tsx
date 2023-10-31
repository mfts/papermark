export default function DataRoom({ className }: { className?: string }) {
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
      shapeRendering="geometricPrecision"
      className={className}
    >
      <rect x="2.5" y="4" width="20" height="18" rx="2" ry="2" />
      <path d="M8 9h9" />
      <path d="M8 13h9" />
      <path d="M8 17h9" />
    </svg>
  );
}
