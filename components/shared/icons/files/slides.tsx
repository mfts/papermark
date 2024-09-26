export default function SlidesIcon({
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
      <g clipPath="url(#a)">
        <path fill={isLight ? "#000" : "#fff"} d="M57 59h454v462H57z" />
        <path
          opacity=".999"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M497.5 31.5h-420c-24.333 6.333-39.667 21.667-46 46v420c6.333 24.333 21.667 39.667 46 46h420c24.333-6.333 39.667-21.667 46-46v-420c-6.333-24.333-21.667-39.667-46-46ZM133 160c-19.33 0-35 15.67-35 35v186c0 19.33 15.67 35 35 35h309.347c19.329 0 35-15.67 35-35V195c0-19.33-15.671-35-35-35H133Zm-5 59.347h319.347v136.871H128V219.347Z"
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
        <clipPath id="a">
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
