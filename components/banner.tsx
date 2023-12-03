import Link from "next/link";
import { Button } from "./ui/button";
import { calculateDaysLeft } from "@/lib/utils";
import { CustomUser } from "@/lib/types";
import { Session } from "next-auth";
import { useDomains } from "@/lib/swr/use-domains";

const cutoffDate = new Date("2023-10-12T00:00:00.000Z");

export default function Banner({ session }: { session: Session | null }) {
  const { domains } = useDomains();

  const userDaysLeft = calculateDaysLeft(
    new Date((session?.user as CustomUser).createdAt || 0),
  );

  const noDomains = domains && domains.length === 0;
  const someNotVerified =
    domains && !noDomains && domains.some((domain) => !domain.verified);
  const allVerified =
    domains && !noDomains && domains.every((domain) => domain.verified);

  return (
    <aside className="flex flex-col justify-center w-full bg-background text-foreground p-4 mb-2 rounded-lg border border-gray-700">
      <div className="flex space-x-2">
        <span className="font-bold text-sm">✨ Pro Trial ✨</span>
      </div>
      <p className="my-4 text-sm">
        {`You are on the Pro trial for the next ${userDaysLeft} days.`}
      </p>
      {allVerified ? (
        <p className="text-sm text-green-500">{`Your domain is verified.`}</p>
      ) : (
        <Button variant={someNotVerified ? `destructive` : `default`}>
          <Link href="/settings/domains" target="_blank">
            {someNotVerified
              ? `Please verify your domain`
              : `Connect custom domain`}
          </Link>
        </Button>
      )}
    </aside>
  );
}
