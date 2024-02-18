import { getInvestor } from "@/lib/content/investor";
import { notFound } from "next/navigation";

export default async function InvestorPage({
  params,
}: {
  params: { slug: string };
}) {
  const investor = await getInvestor(params.slug);
  if (!investor) return notFound();

  return (
    <>
      <div>{investor.name}</div>
    </>
  );
}
