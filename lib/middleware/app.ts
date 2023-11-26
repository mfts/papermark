import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function AppMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: {
      createdAt?: string;
    };
  };

  // if there's no token and the path isn't /login, redirect to /login
  if (!token?.email && path !== "/login") {
    return NextResponse.redirect(
      new URL(
        `/login${path !== "/" ? `?next=${encodeURIComponent(path)}` : ""}`,
        req.url,
      ),
    );

    // if there's a token
  } else if (token?.email) {
    // if the user was created in the last 10 seconds, redirect to "/welcome"
    if (
      token?.user?.createdAt &&
      new Date(token?.user?.createdAt).getTime() > Date.now() - 10000 &&
      path !== "/welcome"
    ) {
      return NextResponse.redirect(new URL("/welcome", req.url));

      // if the path is /login, redirect to "/documents"
    } else if (path === "/login") {
      return NextResponse.redirect(new URL("/documents", req.url));
    }
  }
}
