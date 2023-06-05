import { User as NextAuthUser } from "next-auth";
import { Document, Link } from "@prisma/client";

export interface CustomUser extends NextAuthUser {
  id: string;
}

export interface DocumentWithLinksAndLinkCount extends Document {
  _count: {
    links: number;
  };
  links: Link[];
}
