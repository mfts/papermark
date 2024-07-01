import { Dispatch, SetStateAction } from "react";
import DropdownProto from "./DropdownProto";

interface CommunityProps {
  community: string;
  setCommunity: Dispatch<SetStateAction<string>>;
}

const options = [
  "GitHub stars",
  "Community",
  "Slack community",
  "Discord community",
  "Contributors",
  "Advisors",
];

export const Community = ({ community, setCommunity }: CommunityProps) => {
  return (
    <DropdownProto
      options={options}
      option={community || "Community"}
      setOption={setCommunity}
    />
  );
};
