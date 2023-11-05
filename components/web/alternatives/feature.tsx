// Feature.tsx
import { useState } from "react";

interface Props {
  selectedFeature: string;
  setSelectedFeature: (feature: string) => void;
}

const features = [
  "send unlimited documents",
  "custom domain",
  "team access",
  "large files upload",
];

const Feature: React.FC<Props> = ({ selectedFeature, setSelectedFeature }) => {
  return (
    <div className="flex space-x-4">
      {features.map((feat) => (
        <button
          key={feat}
          onClick={() => setSelectedFeature(feat)}
          className={`py-2 px-4 rounded-md ${
            selectedFeature === feat
              ? "bg-black text-white border-black"
              : "bg-white text-black border-2 border-black"
          }`}
        >
          {feat}
        </button>
      ))}
    </div>
  );
};

export default Feature;
