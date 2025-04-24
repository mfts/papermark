import { NextRequest, NextResponse } from "next/server";

import { getToken } from "next-auth/jwt";

export default async function AppMiddleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const isInvited = url.searchParams.has("invitation");
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: {
      createdAt?: string;
    };
  };

  // UNAUTHENTICATED if there's no token and the path isn't /login, redirect to /login
  if (!token?.email && path !== "/login") {
    const loginUrl = new URL(`/login`, req.url);
    // Append "next" parameter only if not navigating to the root
    if (path !== "/") {
      const nextPath =
        path === "/auth/confirm-email-change" ? `${path}${url.search}` : path;

      loginUrl.searchParams.set("next", encodeURIComponent(nextPath));
    }
    return NextResponse.redirect(loginUrl);
  }

  // AUTHENTICATED if the user was created in the last 10 seconds, redirect to "/welcome"
  if (
    token?.email &&
    token?.user?.createdAt &&
    new Date(token?.user?.createdAt).getTime() > Date.now() - 10000 &&
    path !== "/welcome" &&
    !isInvited
  ) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // AUTHENTICATED if the path is /login, redirect to "/dashboard"
  if (token?.email && path === "/login") {
    const nextPath = url.searchParams.get("next") || "/dashboard"; // Default redirection to "/dashboard" if no next parameter
    return NextResponse.redirect(
      new URL(decodeURIComponent(nextPath), req.url),
    );
  }
}
