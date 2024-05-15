import { Dispatch, SetStateAction } from "react";

interface ProblemProps {
  problem: string;
  setProblem: Dispatch<SetStateAction<string>>;
}

export const Problem = ({ problem, setProblem }: ProblemProps) => {
  return (
    <div className="w-full">
      <input
        type="text"
        maxLength={70}
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        placeholder="Turn documents and data rooms intro trackable links"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
