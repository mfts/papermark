export default function SheetIcon({
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
        <path fill={isLight ? "#000" : "#fff"} d="M57.5 59.5h454v462h-454z" />
        <path
          opacity=".999"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M498 32H78c-24.333 6.333-39.667 21.667-46 46v420c6.333 24.333 21.667 39.667 46 46h420c24.333-6.333 39.667-21.667 46-46V78c-6.333-24.333-21.667-39.667-46-46ZM145.135 197h127.95l-.214 76.36H145.135V197Zm-30 89.341a15.103 15.103 0 0 0 0 4.039v104.071c0 8.284 6.716 15 15 15h315.98c8.284 0 15-6.716 15-15V290.38a15.118 15.118 0 0 0 0-4.04V182c0-8.284-6.716-15-15-15h-315.98c-8.284 0-15 6.716-15 15v104.341Zm315.98-12.981V197H303.086l-.215 76.36h128.244Zm-158.328 30-.214 76.091H145.135V303.36h127.652Zm30 0h128.328v76.091H302.573l.214-76.091Z"
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
