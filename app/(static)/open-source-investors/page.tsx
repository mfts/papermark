import Dashboard from "./ClientPage";
import { cache } from "react";

export const revalidate = 86400; // revalidate the data at most every 24 hours

const getInvestors = cache(async () => {
  const response = await fetch(
    "https://api.airtable.com/v0/appAxYMTCbZ1hGTmg/Investors?maxRecords=5&view=Grid%20view",
    {
      headers: {
        Authorization: `Bearer patfKSONnnpe6dVxx.ab8a76305c3c67e5fb93b816c74340b157794403d8c059756d54f874c596664b`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = await response.json();
  return data;
});

export default async function HomePage() {
  const data = await getInvestors();

  console.log("data", data)

  return <Dashboard data={data} />;
}
