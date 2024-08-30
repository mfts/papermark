import React from "react";

import Handlebars from "handlebars";

import { WatermarkConfig } from "../links/link-sheet/watermark-panel";

const Watermark = ({
  config,
  viewerData,
  imageDimensions,
}: {
  config: WatermarkConfig;
  viewerData: any;
  imageDimensions: any;
}) => {
  const template = Handlebars.compile(config.text);
  const watermarkText = template(viewerData);

  if (!imageDimensions.width || !imageDimensions.height) {
    return null; // Don't render anything if image dimensions are not available
  }

  const textWidth = imageDimensions.width * (config.fontSize / 100); // Assume fontSize is a percentage of image width
  const textHeight = imageDimensions.height * (config.fontSize / 100);

  const renderTiles = () => {
    const maxTilesPerRow = Math.ceil(imageDimensions.width / textWidth);
    const maxTilesPerColumn = Math.ceil(imageDimensions.height / textHeight);

    const tiles = [];
    for (let i = 0; i < maxTilesPerRow; i++) {
      for (let j = 0; j < maxTilesPerColumn; j++) {
        const x = i * textWidth - textWidth;
        const y = j * textHeight;

        tiles.push(
          <div
            key={`tile-${i}-${j}`}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              fontSize: `${config.fontSize}px`,
              color: config.color,
              opacity: config.opacity,
              transform: `rotate(-${config.rotation}deg)`,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {watermarkText}
          </div>,
        );
      }
    }
    return tiles;
  };

  if (config.isTiled) {
    return <>{renderTiles()}</>;
  }

  const [x, y] = getPositionCoordinates(
    config.position,
    imageDimensions.width,
    imageDimensions.height,
    imageDimensions.width * (config.fontSize / 100), // Assuming fontSize is relative to image width
    imageDimensions.height * (config.fontSize / 100),
  );

  console.log("watermark config", config);
  console.log("image dimensions", imageDimensions);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom: y,
        fontSize: `${config.fontSize}px`,
        color: config.color,
        opacity: config.opacity,
        transform: `rotate(-${config.rotation}deg)`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {watermarkText}
    </div>
  );
};

function getPositionCoordinates(
  position: WatermarkConfig["position"],
  width: number,
  height: number,
  textWidth: number,
  textHeight: number,
): number[] {
  const positions = {
    "top-left": [10, height - textHeight],
    "top-center": [(width - textWidth) / 2, height - textHeight],
    "top-right": [width - textWidth - 10, height - textHeight],
    "middle-left": [10, (height - textHeight) / 2],
    "middle-center": [(width - textWidth) / 2, (height - textHeight) / 2],
    "middle-right": [width - textWidth - 10, (height - textHeight) / 2],
    "bottom-left": [10, 20],
    "bottom-center": [(width - textWidth) / 2, 20],
    "bottom-right": [width - textWidth - 10, 20],
  };
  return positions[position];
}

export default Watermark;
