import { Dispatch, SetStateAction } from "react";

interface Special1Props {
  special1: string;
  setSpecial1: Dispatch<SetStateAction<string>>;
}

export const Special1 = ({ special1, setSpecial1 }: Special1Props) => {
  return (
    <div className="w-full">
      <input
        type="text"
        maxLength={20}
        value={special1}
        onChange={(e) => setSpecial1(e.target.value)}
        placeholder="Documents shared"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
