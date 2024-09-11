export default function PortraitLandscape({
  className,
  fill,
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={fill || "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      shapeRendering="geometricPrecision"
    >
      <path d="M19 11L19 4.25C19 3.65326 18.7893 3.08097 18.4142 2.65901C18.0391 2.23705 17.5304 2 17 2L14 2" />
      <path d="M16 8L19 11L22 8" />
      <path d="M10 2L6 2C5.46957 2 4.96086 2.26339 4.58579 2.73223C4.21072 3.20107 4 3.83696 4 4.5L4 19.5C4 20.163 4.21071 20.7989 4.58579 21.2678C4.96086 21.7366 5.46957 22 6 22L17 22C17.5304 22 18.0391 21.7366 18.4142 21.2678C18.7893 20.7989 19 20.163 19 19.5L19 15" />
    </svg>
  );
}
