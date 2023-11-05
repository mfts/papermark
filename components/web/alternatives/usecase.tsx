import { Dispatch, SetStateAction } from "react";
import DropdownProto from "@/components/web/alternatives/dropdownproto";

interface UsecaseProps {
  usecase: string;
  setUsecase: Dispatch<SetStateAction<string>>;
}

const options = ["Pitch Deck", "Sales Deck", "Investment Docs", "Other"];

export const UsecaseSelect = ({ usecase, setUsecase }: UsecaseProps) => {
  return (
    <DropdownProto
      options={options}
      option={usecase || "Pitch Deck"}
      setOption={setUsecase}
    />
  );
};

// import React from "react";
// import Select from "react-select";
// import { Dispatch, SetStateAction } from "react";

// const usecasesList = ["Pitch Deck", "Sales Deck", "Investment Docs", "Other"];

// const options = usecasesList.map((name) => {
//   return { value: name, label: name };
// });

// interface SelectedOption {
//   value: string;
//   label: string;
// }

// interface UsecaseSelectProps {
//   usecase: string;
//   setUsecase: Dispatch<SetStateAction<string>>;
// }

// const customStyles = {
//   option: (provided: any, state: { isFocused: any; isActive: any }) => ({
//     ...provided,
//     backgroundColor: state.isFocused
//       ? "#f5f5f5" // Very light gray for hover.
//       : state.isActive
//       ? "black" // Black when option is clicked.
//       : "white", // Default color.
//     color: state.isActive ? "white" : "black",
//     padding: "15px 15px",
//     borderBottom: "none",
//   }),
//   control: (provided: any) => ({
//     ...provided,
//     borderColor: "black",
//     borderWidth: "2px",
//     boxShadow: "none",
//     "&:hover": {
//       borderColor: "black",
//     },
//   }),
//   singleValue: (provided: any) => ({
//     ...provided,
//     color: "black",
//   }),
//   dropdownIndicator: (provided: any) => ({
//     ...provided,
//     color: "black",
//     "&:hover": {
//       color: "black",
//     },
//   }),
//   indicatorSeparator: () => ({
//     display: "none",
//   }),
//   menu: (provided: any) => ({
//     ...provided,
//     marginTop: "2px",
//   }),
// };

// export const UsecaseSelect: React.FC<UsecaseSelectProps> = ({
//   usecase,
//   setUsecase,
// }) => {
//   const handleChange = (selectedOption: SelectedOption | null) => {
//     setUsecase(selectedOption ? selectedOption.value : "");
//   };

//   const selectedUsecase = options.find((option) => option.value === usecase);

//   const defaultOption = options.find((option) => option.value === "Pitch Deck");

//   return (
//     <Select
//       options={options}
//       onChange={handleChange}
//       value={selectedUsecase}
//       defaultValue={defaultOption}
//       placeholder="Select a case"
//       styles={customStyles}
//     />
//   );
// };
