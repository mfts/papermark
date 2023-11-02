export default function UploadFile({
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
      <path d="M14.5 1 H6 C4.8954 1 4 1.8954 4 3 V19 C4 20.1046 4.8954 21 6 21 H18 C19.1046 21 20 20.1046 20 19 V7.667 L14.5 1 M14.5 1 V6 C14.516 7.022 15.842 7.667 16.513 7.667 H20 M12 11 L9.778 13.222 M12 11 L14.222 13.222 M12 11 V17.667" />
    </svg>
  );
}
