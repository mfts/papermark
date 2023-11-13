import { useState } from "react";

interface Props {
  selectedFeatures: string[];
  setSelectedFeatures: (features: string[]) => void;
}

const features = [
  "send unlimited documents",
  "email capture",
  "analytics on each page",
  "custom domain",
  "team access",
  "large files upload",
];

const Feature: React.FC<Props> = ({
  selectedFeatures,
  setSelectedFeatures,
}) => {
  const toggleFeature = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  return (
    <div className="flex flex-wrap justify-center space-x-4">
      {features.map((feat) => (
        <button
          key={feat}
          onClick={() => toggleFeature(feat)}
          className={`py-2 px-4 rounded-md mb-2 ${
            selectedFeatures.includes(feat)
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
