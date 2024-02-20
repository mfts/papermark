import { Suspense } from "react";
import Dashboard from "./ClientPage";
import { FallbackInvestors } from "./Fallback";
import { getInvestors } from "@/lib/content/investor";

export default async function HomePage() {
  const allInvestors = await getInvestors();

  return (
    <>
      <div className="mx-auto max-w-6xl pt-4 mb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 sm:pt-16 pt-8 text-gray-600">
          <div className="space-y-5 max-w-4xl mx-auto text-center mb-10">
            <h1 className="text-3xl text-gray-800 font-extrabold mx-auto sm:text-6xl max-w-3xl tracking-tighter">
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
