"use client";

import { useEffect } from "react";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SAMLCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams?.get("code");
    const callbackUrl = searchParams?.get("next") || "/dashboard";

    if (!code) {
      router.replace("/login?error=sso-failed");
      return;
    }

    signIn("saml-idp", {
      code,
      redirect: false,
      callbackUrl,
    }).then((result) => {
      if (result?.ok) {
        router.replace(result.url ?? callbackUrl);
      } else {
        router.replace("/login?error=sso-failed");
      }
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Completing SSO login...
    </div>
  );
}
