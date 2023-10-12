import Link from "next/link";
import { Terminal } from "lucide-react";
import { Session } from "next-auth";
import { LoginButton } from "./Auth/LoginButton";
import { LogoutButton } from "./Auth/LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  user: Session["user"];
}

export const Navbar = ({ user }: NavbarProps) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-md">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center gap-6 md:gap-10 text-sm">
          <Link href="/" className="flex items-center space-x-2">
            <Terminal className="h-6 w-6" />
            <span className="hidden text-base font-bold sm:inline-block">
              codebaseUp
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            {user ? <LogoutButton /> : <LoginButton />}
          </nav>
        </div>
      </div>
    </header>
  );
};
