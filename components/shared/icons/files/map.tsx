export default function MapIcon({
  className,
  isLight = true,
}: {
  className?: string;
  isLight?: boolean;
}) {
  return (
    <svg
      width="576"
      height="576"
      viewBox="0 0 576 576"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_map)">
        <rect
          x="57"
          y="59"
          width="454"
          height="462"
          fill={isLight ? "#000" : "#fff"}
        />
        <path
          opacity="0.999"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M497.5 31.5H77.5C53.1667 37.8333 37.8333 53.1667 31.5 77.5V497.5C37.8333 521.833 53.1667 537.167 77.5 543.5H497.5C521.833 537.167 537.167 521.833 543.5 497.5V77.5C537.167 53.1667 521.833 37.8333 497.5 31.5ZM287.5 117.5C229.5 117.5 182.5 164.5 182.5 222.5C182.5 299.5 287.5 417.5 287.5 417.5C287.5 417.5 392.5 299.5 392.5 222.5C392.5 164.5 345.5 117.5 287.5 117.5ZM287.5 262.5C265.5 262.5 247.5 244.5 247.5 222.5C247.5 200.5 265.5 182.5 287.5 182.5C309.5 182.5 327.5 200.5 327.5 222.5C327.5 244.5 309.5 262.5 287.5 262.5Z"
          fill={isLight ? "#fff" : "#111827"}
        />
      </g>
      <rect
        x="16"
        y="16"
        width="544"
        height="544"
        rx="48"
        stroke={isLight ? "#000" : "#fff"}
        strokeWidth="32"
      />
      <defs>
        <clipPath id="clip0_map">
          <rect
            x="32"
            y="32"
            width="512"
            height="512"
            rx="32"
            fill={isLight ? "#fff" : "#111827"}
          />
        </clipPath>
      </defs>
    </svg>
  );
}
