import { Dispatch, SetStateAction } from "react";
import DropdownProto from "@/components/web/alternatives/dropdownproto";

interface PlanProps {
  plan: string;
  setPlan: Dispatch<SetStateAction<string>>;
}

const options = ["Free", "Open-Source", "Paid", "Custom", "Any Plan"];

export const PlanSelect = ({ plan, setPlan }: PlanProps) => {
  return (
    <DropdownProto
      options={options}
      option={plan || "Free"}
      setOption={setPlan}
    />
  );
};
