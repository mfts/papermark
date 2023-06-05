import { User as NextAuthUser } from "next-auth";
import { Document, Link, View } from "@prisma/client";

export interface CustomUser extends NextAuthUser {
  id: string;
}

export interface DocumentWithLinksAndLinkCount extends Document {
  _count: {
    links: number;
  };
  links: Link[];
}

export interface LinkWithViews extends Link {
  _count: {
    views: number;
  };
  views: View[];
}
