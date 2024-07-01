import { Dispatch, SetStateAction } from "react";

interface Special1Props {
  special2: string;
  setSpecial2: Dispatch<SetStateAction<string>>;
}

export const Special2 = ({ special2, setSpecial2 }: Special1Props) => {
  return (
    <div className="w-full">
      <input
        type="text"
        maxLength={20}
        value={special2}
        onChange={(e) => setSpecial2(e.target.value)}
        placeholder="100k"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
