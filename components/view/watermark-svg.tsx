import React, { useMemo } from "react";

import Handlebars from "handlebars";

import { WatermarkConfig } from "@/lib/types";

export const SVGWatermark = ({
  config,
  viewerData,
  documentDimensions,
  pageIndex,
}: {
  config: WatermarkConfig;
  viewerData: any;
  documentDimensions: { width: number; height: number };
  pageIndex: number;
}) => {
  const watermarkText = useMemo(() => {
    const template = Handlebars.compile(config.text);
    return template(viewerData);
  }, [config.text, viewerData]);

  const { width, height } = documentDimensions;

  // Calculate a responsive font size
  const calculateFontSize = () => {
    const baseFontSize = Math.min(width, height) * (config.fontSize / 1000);
    return Math.max(8, Math.min(baseFontSize, config.fontSize)); // Clamp between 8px and config.fontSize
  };

  const fontSize = calculateFontSize();

  const createPattern = () => {
    // Estimate text width (this is an approximation)
    const textWidth = watermarkText.length * fontSize * 0.6;

    // Make pattern size larger than text to avoid cut-off
    const patternWidth = textWidth;
    const patternHeight = fontSize * 10;

    return (
      <pattern
        id={`watermarkPattern-${pageIndex}`}
        patternUnits="userSpaceOnUse"
        width={patternWidth}
        height={patternHeight}
        patternTransform={`rotate(-${config.rotation})`}
      >
        <text
          x={patternWidth / 2}
          y={patternHeight / 4}
          fontSize={`${fontSize}px`}
          fill={config.color}
          opacity={config.opacity}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {watermarkText}
        </text>
      </pattern>
    );
  };

  const createSingleWatermark = () => {
    let x, y;
    switch (config.position) {
      case "top-left":
        x = fontSize / 2;
        y = fontSize;
        break;
      case "top-center":
        x = width / 2;
        y = fontSize;
        break;
      case "top-right":
        x = width - fontSize / 2;
        y = fontSize;
        break;
      case "middle-left":
        x = fontSize / 2;
        y = height / 2;
        break;
      case "middle-center":
        x = width / 2;
        y = height / 2;
        break;
      case "middle-right":
        x = width - fontSize / 2;
        y = height / 2;
        break;
      case "bottom-left":
        x = fontSize / 2;
        y = height - fontSize;
        break;
      case "bottom-center":
        x = width / 2;
        y = height - fontSize;
        break;
      case "bottom-right":
        x = width - fontSize / 2;
        y = height - fontSize;
        break;
      default:
        x = width / 2;
        y = height / 2;
    }

    return (
      <text
        x={x}
        y={y}
        fontSize={`${fontSize}px`}
        fill={config.color}
        opacity={config.opacity}
        textAnchor={
          config.position.includes("right")
            ? "end"
            : config.position.includes("center")
              ? "middle"
              : "start"
        }
        dominantBaseline={
          config.position.includes("top")
            ? "hanging"
            : config.position.includes("middle")
              ? "middle"
              : "auto"
        }
        transform={`rotate(${-config.rotation} ${x} ${y})`}
      >
        {watermarkText}
      </text>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        display: "flex",
        pointerEvents: "none",
      }}
    >
      {config.isTiled ? (
        <>
          {createPattern()}
          <rect
            width={width}
            height={height}
            fill={`url(#watermarkPattern-${pageIndex})`}
          />
        </>
      ) : (
        createSingleWatermark()
      )}
    </svg>
  );
};
