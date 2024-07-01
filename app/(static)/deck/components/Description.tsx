import { Dispatch, SetStateAction } from "react";

interface DescriptionProps {
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
}

export const Description = ({
  description,
  setDescription,
}: DescriptionProps) => {
  return (
    <div className="w-full">
      <input
        maxLength={50}
        onChange={(e) => setDescription(e.target.value)}
        value={description}
        placeholder="An open source docsend alternative"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
