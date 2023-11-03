import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";
import { useState, useEffect } from "react";
import { siteConfig } from "@/lib/site";

export default function Section2() {
  const [stars, setStars] = useState<string>();

  useEffect(() => {
    async function getGitHubStars() {
      try {
        const response = await fetch(
          "https://api.github.com/repos/mfts/papermark",
          {
            next: {
              revalidate: 60,
            },
          }
        );
        if (!response?.ok) {
          return null;
        }
        const json = await response.json();
        const star_ = parseInt(json.stargazers_count).toLocaleString();
        setStars(star_);
        // return stars;
      } catch {
        return null;
      }
    }

    getGitHubStars();
  }, []);


  return (
    <div className="bg-white">
      <div className="px-6 py-12 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-6xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Build{" "}
            <span className="bg-gradient-to-tr from-purple-500 to-rose-300 bg-clip-text text-transparent">
              strong
            </span>{" "}
            relationships with investors
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            By sending presentations via Papermark
          </p>
          <div className="mt-10 flex  items-center justify-center gap-x-6">
            <Link
              href="/login"
              className="rounded-md font-display bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start now
            </Link>
            {stars && (
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="flex"
              >
                <div className="flex flex-col h-10 w-10 items-center justify-center space-x-2 rounded-md border border-muted bg-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#fff"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-foreground"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                  </svg>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border-y-8 border-l-0 border-r-8 border-solid border-muted border-y-transparent"></div>
                  <div className="font-display bg-gradient-to-tr from-purple-600 to-rose-400 bg-clip-text text-transparent flex h-10 items-center rounded-md border border-muted bg-muted px-4 font-medium">
                    {stars} stars on GitHub
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Image added below */}
          <div className="mt-10 mx-auto w-full max-w-md">
            <img
              src="https://www.papermark.io/_static/image2.png"
              alt="Description of Image"
              className="mx-auto w-full h-auto object-cover rounded-md "
            />
          </div>
        </div>
      </div>
    </div>
  );
}
