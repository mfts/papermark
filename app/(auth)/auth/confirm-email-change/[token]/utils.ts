import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

export const getSession = async () => {
  return getServerSession(authOptions);
};
