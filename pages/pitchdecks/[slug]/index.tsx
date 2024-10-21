"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import NotFound from "@/pages/404";
import { BookmarkPlus, ExternalLink, MoveLeft } from "lucide-react";

import AppLayout from "@/components/layouts/app";
import ImageCarousel from "@/components/pitchdeck/image-carousel";
import { ImageTiltEffect } from "@/components/pitchdeck/image-tilt-effect";
import { Button } from "@/components/ui/button";

interface CardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  views: number;
  category: string;
}

const images: string[] = [
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6657a1cb41281e9a76833473_Slidebean-Pitch-Deck-Template-The-Startup-Template-2024-Update.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6657a1cb41281e9a76833473_Slidebean-Pitch-Deck-Template-The-Startup-Template-2024-Update.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
  "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6657a1cb41281e9a76833473_Slidebean-Pitch-Deck-Template-The-Startup-Template-2024-Update.webp",
];

const data: CardProps[] = [
  {
    id: "1",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
    title: "Airbnb Pitch Deck",
    description:
      "Lorem ipsum odor amet, consectetuer adipiscing elit. Montes convallis ex mattis molestie et. Maecenas interdum ac consectetur commodo turpis habitasse. Leo malesuada cubilia consequat maecenas elementum fames purus id. Semper mus himenaeos facilisi nec purus; urna ligula primis feugiat. Fusce adipiscing natoque felis tellus eget auctor vulputate.",
    views: 980300,
    category: "Pitch Decks",
  },
  {
    id: "2",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
    title: "Uber Pitch Deck",
    description:
      "Lorem ipsum odor amet, consectetuer adipiscing elit. Montes convallis ex mattis molestie et. Maecenas interdum ac consectetur commodo turpis habitasse. Leo malesuada cubilia consequat maecenas elementum fames purus id. Semper mus himenaeos facilisi nec purus; urna ligula primis feugiat. Fusce adipiscing natoque felis tellus eget auctor vulputate.",
    views: 839900,
    category: "Business",
  },
];

export default function PitchDeckID() {
  const router = useRouter();
  const [deck, setDeck] = useState<CardProps | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const pathnameParts = router.asPath.split("/");
    const id = pathnameParts[pathnameParts.length - 1];
    const foundDeck = data.find((deck) => deck.id === id);

    if (foundDeck) {
      setDeck(foundDeck);
    } else {
      setDeck(null);
    }
  }, [router]);

  if (!deck) {
    return (
      <AppLayout>
        <NotFound message="The requested Pitch Deck Template could not be found. Please check the URL or explore other available templates." />
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout>
        <div className="min-h-screen overflow-x-hidden bg-white dark:bg-gray-900">
          <div className="sticky top-0 z-50 p-4 pb-0 sm:mx-4 sm:pt-8">
            <section className="mb-4 flex items-center justify-between space-x-2 sm:space-x-0 md:mb-8 lg:mb-12">
              <div className="space-y-0 sm:space-y-1">
                <div className="flex items-center gap-x-1 text-base font-semibold tracking-tight text-foreground sm:text-2xl">
                  <Link
                    href="/pitchdecks"
                    className="flex cursor-pointer items-center justify-center gap-4 text-primary hover:underline"
                  >
                    <MoveLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>Back to all pitch decks</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-x-1">
                <Button
                  className="group flex flex-1 items-center justify-start gap-x-1 whitespace-nowrap px-1 text-left sm:gap-x-3 sm:px-3"
                  title="Bookmark This Template"
                >
                  <BookmarkPlus
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-base">
                    Bookmark This Template
                  </span>
                </Button>
              </div>
            </section>
            <section className="mb-4 flex flex-col items-center gap-8 space-x-2 sm:flex-row sm:justify-center sm:space-x-0 md:mb-8 lg:mb-12">
              <div className="mb-8 grid w-2/5 grid-cols-1 items-end justify-end gap-3 space-y-2 text-center sm:text-right md:flex-row">
                <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl">{`${deck.title}`}</div>
                <div className="text-lg leading-4 text-muted-foreground sm:text-lg sm:leading-none">{`${deck.description}`}</div>
                <div>
                  <span className="text-md leading-2 sm:text-base sm:leading-none">
                    <strong>Category</strong> : {`template ${deck.category}`}{" "}
                    <strong>Industry</strong> : {`template ${deck.id}`}
                    <br />
                    <strong>Views:</strong> {deck.views.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-x-1 sm:items-end sm:justify-end">
                  <Button
                    className="group items-center justify-start gap-x-1 whitespace-nowrap p-2 px-1 text-right sm:gap-x-3 sm:px-3 sm:text-center"
                    title="Share This Template"
                    disabled
                  >
                    <ExternalLink
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-md sm:text-base">
                      Share This Template
                    </span>
                  </Button>
                </div>
              </div>
              <div className="mb-8 hidden w-3/5 items-center sm:grid sm:grid-cols-1 md:block md:flex-row">
                <ImageTiltEffect>
                  <Image
                    src={deck.image}
                    alt={deck.title}
                    className="rounded-lg"
                    width={680}
                    height={680}
                  />
                </ImageTiltEffect>
              </div>
            </section>
            <ImageCarousel images={images} />
          </div>
        </div>
      </AppLayout>
    </>
  );
}
