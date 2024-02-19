import { Suspense } from "react";
import Dashboard from "./ClientPage";
import { FallbackInvestors } from "./Fallback";

export const revalidate = 3600; // revalidate the data at most every 24 hours

const getInvestors = async () => {
  const response = await fetch(`https://investors.papermark.io/api/investors`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INVESTORS_API_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = await response.json();
  return data;
};


export default async function HomePage() {
  const allInvestors = await getInvestors();

  return (
    <>
      <div className="mx-auto max-w-6xl pt-4 mb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 sm:pt-16 pt-8 text-gray-600">
          <div className="space-y-5 max-w-4xl mx-auto text-center mb-10">
            <h1 className="text-3xl text-gray-800 font-extrabold mx-auto sm:text-6xl max-w-3xl tracking-tighter">
              Open Investor Database
            </h1>
            <p>
              Find investors based on stage, sector, or location. <br />
              Powered by Papermark.
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
