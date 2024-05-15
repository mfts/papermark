import { Dispatch, SetStateAction } from "react";
import DropdownProto from "./DropdownProto";

interface UsersProps {
  users: string;
  setUsers: Dispatch<SetStateAction<string>>;
}

const options = [
  "Users",
  "Monthly Active Users",
  "Customers",
  "Sign Ups",
  "Waitlist signus",
];

export const Users = ({ users, setUsers }: UsersProps) => {
  return (
    <DropdownProto
      options={options}
      option={users || "Type of users"}
      setOption={setUsers}
    />
  );
};
