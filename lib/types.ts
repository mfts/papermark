import { User as NextAuthUser } from "next-auth";

export interface CustomUser extends NextAuthUser {
  id: string;
}
