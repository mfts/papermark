"use client";

import { useState } from "react";
import { LoaderIcon } from "@/components";
import { signIn } from "next-auth/react";
import { Button } from "ui";
import { Google } from "ui/icons";

export const GoogleAuth = () => {
  const [signInClicked, setSignInClicked] = useState(false);

  return (
    <Button
      onClick={() => {
        setSignInClicked(true);
        void signIn("google", {
          callbackUrl: "/",
        });
      }}
      disabled={signInClicked}
    >
      <>
        {!!signInClicked && <LoaderIcon />}
        <Google className="h-5 w-5 mr-2" />
        <p>Sign in with Google</p>
      </>
    </Button>
  );
};
