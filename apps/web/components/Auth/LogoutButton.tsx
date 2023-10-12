"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "ui";
import { LoaderIcon } from "../Icons";

export const LogoutButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true);
        void signOut();
      }}
    >
      {!!isLoading && <LoaderIcon />}
      Sign out
    </Button>
  );
};
