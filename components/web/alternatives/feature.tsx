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
          className={`mb-2 rounded-md px-4 py-2 ${
            selectedFeatures.includes(feat)
              ? "border-black bg-black text-white"
              : "border-2 border-black bg-white text-black"
          }`}
        >
          {feat}
        </button>
      ))}
    </div>
  );
};

export default Feature;
