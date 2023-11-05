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

// import React from "react";
// import Select from "react-select";

// const plansList = ["Free", "Open-Source", "Paid", "Custom", "Any Plan"];

// const options = plansList.map((name) => {
//   return { value: name, label: name };
// });

// interface PlanSelectProps {
//   plan: string;
//   setPlan: (value: string) => void;
// }

// export const PlanSelect: React.FC<PlanSelectProps> = ({ plan, setPlan }) => {
//   interface SelectedOption {
//     value: string;
//     label: string;
//   }

//   const handleChange = (selectedOption: SelectedOption | null) => {
//     setPlan(selectedOption ? selectedOption.value : "");
//   };

//   const selectedPlan = options.find((option) => option.value === plan);

//   // Default option to be selected
//   const defaultOption = options.find((option) => option.value === "Free");

//   return (
//     <Select
//       options={options}
//       onChange={handleChange}
//       value={selectedPlan}
//       defaultValue={defaultOption} // Add this line
//       placeholder="Select a plan"
//     />
//   );
// };
