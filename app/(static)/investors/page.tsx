import Dashboard from "./ClientPage";

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
  const data = await getInvestors();
  // const data = [
  //   {id: 1,
  //   name: "test"}
  // ]

  return <Dashboard data={data} />;
}
