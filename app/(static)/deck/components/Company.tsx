import { Dispatch, SetStateAction } from "react";

interface CompanyProps {
  company: string;
  setCompany: Dispatch<SetStateAction<string>>;
}

export const Company = ({ company, setCompany }: CompanyProps) => {
  return (
    <div className="w-full">
      <input
        type="text"
        maxLength={20}
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Papermark"
        className="text-black w-full p-2 text-s bg-white border border-gray-300 rounded-md font-light"
      />
    </div>
  );
};
