import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MARKETING_URL}/api/help`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Help center response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }

    const { articles } = await response.json();

    // Filter articles based on search query if provided
    const filteredArticles = query
      ? articles.filter(
          (article: any) =>
            article.data.title.toLowerCase().includes(query.toLowerCase()) ||
            article.data.description
              ?.toLowerCase()
              .includes(query.toLowerCase()),
        )
      : articles;

    return NextResponse.json({ articles: filteredArticles });
  } catch (error) {
    console.error("Error in help search:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 },
    );
  }
}
