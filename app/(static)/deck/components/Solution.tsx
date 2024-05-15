import { Dispatch, SetStateAction } from "react";

interface SolutionProps {
  solution: string;
  setSolution: Dispatch<SetStateAction<string>>;
}

export const Solution = ({ solution, setSolution }: SolutionProps) => {
  return (
    <div className="w-full">
      <input
        type="text"
        maxLength={70}
        value={solution}
        onChange={(e) => setSolution(e.target.value)}
        placeholder="Modern document infrastructure with built-in analytics"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
