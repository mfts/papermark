"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  return ( 
    <div className="h-screen w-screen">
      <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/_static/error.png"
        height="300"
        width="300"
        alt="Error"
        className="dark:hidden"
      />
      <Image
        src="/_static/error-dark.png"
        height="300"
        width="300"
        alt="Error"
        className="hidden dark:block"
      />
      <h2 className="text-xl font-medium">
        Oops! We couldn't find the page you're looking for.
      </h2>
      <Button asChild>
        <Link href="/">
          Go back
        </Link>
      </Button>
    </div>
    </div>
  );
}
 
export default NotFound;