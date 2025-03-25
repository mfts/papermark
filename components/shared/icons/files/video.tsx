export default function VideoIcon({
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
      <g clipPath="url(#clip0_159_5)">
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
          d="M497.5 31.5H77.5C53.1667 37.8333 37.8333 53.1667 31.5 77.5V497.5C37.8333 521.833 53.1667 537.167 77.5 543.5H497.5C521.833 537.167 537.167 521.833 543.5 497.5V77.5C537.167 53.1667 521.833 37.8333 497.5 31.5ZM203.514 117.453C198.584 114.354 192.359 114.179 187.261 116.996C182.164 119.813 179 125.176 179 131V444C179 449.824 182.164 455.187 187.261 458.004C192.359 460.821 198.584 460.646 203.514 457.547L452.514 301.047C457.173 298.119 460 293.002 460 287.5C460 281.998 457.173 276.881 452.514 273.953L203.514 117.453ZM413.933 287.5L211 415.046V159.954L413.933 287.5Z"
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
        <clipPath id="clip0_159_5">
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
