import { Dispatch, SetStateAction } from "react";
import DropdownProto from "./DropdownProto";

interface MrrProps {
  mrr: string;
  setMrr: Dispatch<SetStateAction<string>>;
}

const options = [
  "MRR",
  "ARR",
  "Total Revenue",
  "Transactions",
  "Signed revenue",
  "Net Volume",
  "Customers",
  "Expected revenue",
];

export const Mrr = ({ mrr, setMrr }: MrrProps) => {
  return (
    <DropdownProto
      options={options}
      option={mrr || "Type of revenue"}
      setOption={setMrr}
    />
  );
};
