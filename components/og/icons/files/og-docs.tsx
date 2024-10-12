import { SVGProps } from "react";

export default function DocsIcon({
  ...props
}: {
  props?: SVGProps<SVGSVGElement>;
}) {
  return (
    <svg
      width="576"
      height="576"
      viewBox="0 0 576 576"
      fill="none"
      style={{ width: "5rem", height: "5rem" }}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#a)">
        <path fill="rgb(107 114 128)" d="M57 59h454v462H57z" />
        <path
          opacity=".999"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M497.5 31.5h-420c-24.333 6.333-39.667 21.667-46 46v420c6.333 24.333 21.667 39.667 46 46h420c24.333-6.333 39.667-21.667 46-46v-420c-6.333-24.333-21.667-39.667-46-46ZM129.465 268.876h-20v40h357.666v-40H129.465ZM109.87 163.648h357.665v40H109.87v-40ZM129.465 373h-20v40h253.542v-40H129.465Z"
          fill="rgb(107 114 128)"
        />
      </g>
      <rect
        x="16"
        y="16"
        width="544"
        height="544"
        rx="48"
        stroke="transparent"
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
            fill="rgb(107 114 128)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
