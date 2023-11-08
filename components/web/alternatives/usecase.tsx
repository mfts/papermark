import { Dispatch, SetStateAction } from "react";
import DropdownProto from "@/components/web/alternatives/dropdownproto";

interface UsecaseProps {
  usecase: string;
  setUsecase: Dispatch<SetStateAction<string>>;
}

const options = ["Pitch Deck", "Sales Deck", "Investment Docs", "Any Document"];

export const UsecaseSelect = ({ usecase, setUsecase }: UsecaseProps) => {
  return (
    <DropdownProto
      options={options}
      option={usecase || "Pitch Deck"}
      setOption={setUsecase}
    />
  );
};
