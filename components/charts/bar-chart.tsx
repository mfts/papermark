import React, { useMemo, useState } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { GradientSteelPurple } from "@visx/gradient";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Tooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";


const verticalMargin = 120;

type Data = {
  pageNumber: string;
  avg_duration: number;
}

type Props = {
  width: number;
  height: number;
  events?: boolean;
  documentId: string;
  data: Data[] | undefined;
};

const margins = {
  left: 50,
};

export function Chart({ width, height, events = false, documentId, data }: Props) {
  // State for tooltip
  const [tooltipData, setTooltipData] = useState<Data | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | undefined>(undefined);
  const [tooltipTop, setTooltipTop] = useState<number | undefined>(undefined);

  // accessors
  const getPageNumber = (d: Data) => d.pageNumber;
  const getAvgDuration = (d: Data) => Number(d.avg_duration / 1000);

  // bounds
  const xMax = width - margins.left;
  const yMax = height - verticalMargin;

  // scales, memoize for performance
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, xMax],
        round: true,
        domain: data!.map(getPageNumber),
        padding: 0.4,
      }),
    [xMax]
  );

  const yScale = useMemo(
    () =>
    scaleLinear<number>({
      range: [yMax, 0],
      round: true,
      domain: [0, Math.max(30, ...data!.map(getAvgDuration))], // Set a minimum max domain value of 30 seconds
    }),
  [yMax]
  );

  // Tooltip handler
  const handleTooltip = (
    event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>,
    data: Data
  ) => {
    const coords = localPoint(event) || { x: 0, y: 0 };
    setTooltipData(data);
    setTooltipLeft(coords.x);
    setTooltipTop(coords.y);
  };

  return width < 10 ? null : (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        {/* <GradientSteelPurple id="teal" /> */}
        <text
          x="15"
          y="30"
          textAnchor="start"
          fill="#d1d5db"
          fontSize="14"
          fontWeight="bold"
        >
          Total Time Spent Per Page
        </text>
        <rect width={width} height={height} fill="url(#teal)" rx={14} />
        <Group top={verticalMargin / 2} left={margins.left}>
          {data!.map((d) => {
            const letter = getPageNumber(d);
            const barWidth = xScale.bandwidth();
            const barHeight = yMax - (yScale(getAvgDuration(d)) ?? 0);
            const barX = xScale(letter);
            const barY = yMax - barHeight;
            return (
              <Bar
                key={`bar-${letter}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill="rgba(55, 65, 81, 1)"
                onMouseMove={(event) => handleTooltip(event, d)}
                onMouseLeave={() => setTooltipData(null)}
              />
            );
          })}
          <AxisBottom
            numTicks={data!.length}
            top={yMax}
            scale={xScale}
            tickLabelProps={() => ({
              fill: "#d1d5db",
              fontSize: 11,
              textAnchor: "middle",
            })}
          />
          <AxisLeft
            scale={yScale.nice()}
            numTicks={5}
            top={0}
            tickFormat={(value) => {
              const numValue = Number(value);
              const minutes = Math.floor(numValue / 60);
              const seconds = Math.round(numValue % 60);
              return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
            }}
            tickLabelProps={(e) => ({
              fill: "#d1d5db",
              fontSize: 10,
              textAnchor: "end",
              x: -12,
              y: (yScale(e) ?? 0) + 3,
            })}
          />
        </Group>
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
          className="p-4 text-white bg-gray-950 text-sm"
        >
          <div>
            <strong>Page:</strong> {getPageNumber(tooltipData)} / {data!.length}
          </div>
          <div>
            <strong>Time spent:</strong>{" "}
            {(() => {
              const numValue = getAvgDuration(tooltipData);
              const minutes = Math.floor(numValue / 60);
              const seconds = Math.round(numValue % 60);
              return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
            })()}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: "rgba(0,0,0,0.7)",
  color: "white",
  zIndex: 9999,
};
