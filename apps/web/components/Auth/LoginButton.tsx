import Link from "next/link";
import { Button } from "ui";

export const LoginButton = () => {
  return (
    <Link href="/auth">
      <Button>Sign in</Button>
    </Link>
  );
};
