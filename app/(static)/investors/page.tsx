import { Suspense } from "react";

import { getInvestors } from "@/lib/content/investor";

import Dashboard from "./ClientPage";
import { FallbackInvestors } from "./Fallback";

export default async function HomePage() {
  const allInvestors = await getInvestors();

  return (
    <>
      <div className="mx-auto mb-10 max-w-6xl pt-4">
        <div className="mx-auto max-w-6xl px-4 pt-8 text-gray-600 sm:pt-16 md:px-8">
          <div className="mx-auto mb-10 max-w-4xl space-y-5 text-center">
            <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tighter text-gray-800 sm:text-6xl">
              Investors Database
            </h1>
            <p>
              List of investors where you can search by stage, sector, or
              location.
            </p>
          </div>
        </div>
        <Suspense fallback={<FallbackInvestors allInvestors={allInvestors} />}>
          <Dashboard data={allInvestors} />
        </Suspense>
      </div>
    </>
  );
}
