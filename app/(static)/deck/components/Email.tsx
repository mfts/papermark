import { Dispatch, SetStateAction } from "react";

interface EmailProps {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
}

export const Email = ({ email, setEmail }: EmailProps) => {
  return (
    <div className="w-full">
      <input
        type="text"
        maxLength={20}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="support@papermark.io"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
