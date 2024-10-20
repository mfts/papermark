import { useState } from "react";

import { Separator } from "@radix-ui/react-dropdown-menu";
import {
  FolderPlusIcon,
  GalleryVerticalEnd,
  PlusIcon,
  Presentation,
} from "lucide-react";

import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface CardProps {
  id: string;
  image: string;
  title: string;
  views: number;
  category: string;
}

const data: CardProps[] = [
  {
    id: "1",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
    title: "Airbnb Pitch Deck",
    views: 980300,
    category: "Pitch Decks",
  },
  {
    id: "2",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
    title: "Uber Pitch Deck",
    views: 839900,
    category: "Business",
  },
  {
    id: "3",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
    title: "Investor Deck Template",
    views: 625500,
    category: "Marketing",
  },
  {
    id: "4",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6657a1cb41281e9a76833473_Slidebean-Pitch-Deck-Template-The-Startup-Template-2024-Update.webp",
    title: "Startup Pitch Deck",
    views: 980200,
    category: "New",
  },
  {
    id: "5",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
    title: "Airbnb Pitch Deck",
    views: 980300,
    category: "Pitch Decks",
  },
  {
    id: "6",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
    title: "Uber Pitch Deck",
    views: 839900,
    category: "Business",
  },
  {
    id: "7",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
    title: "Investor Deck Template",
    views: 625500,
    category: "Marketing",
  },
  {
    id: "8",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6657a1cb41281e9a76833473_Slidebean-Pitch-Deck-Template-The-Startup-Template-2024-Update.webp",
    title: "Startup Pitch Deck",
    views: 980200,
    category: "New",
  },
  {
    id: "9",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
    title: "Airbnb Pitch Deck",
    views: 980300,
    category: "Pitch Decks",
  },
  {
    id: "10",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
    title: "Uber Pitch Deck",
    views: 839900,
    category: "Business",
  },
  {
    id: "11",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
    title: "Investor Deck Template",
    views: 625500,
    category: "Marketing",
  },
  {
    id: "12",
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6657a1cb41281e9a76833473_Slidebean-Pitch-Deck-Template-The-Startup-Template-2024-Update.webp",
    title: "Startup Pitch Deck",
    views: 980200,
    category: "New",
  },
];

const categories: string[] = [
  "All",
  "Pitch Decks",
  "Business",
  "Marketing",
  "Sales",
  "Academic",
];

const Card: React.FC<CardProps> = ({ image, title, views }) => {
  return (
    <div className="relative transform overflow-hidden rounded-lg bg-white shadow-md transition-transform hover:scale-105 dark:bg-gray-800">
      <img src={image} alt={title} className="h-48 w-full object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex justify-start">
            <Presentation className="mr-2" />
            <strong>{views.toLocaleString()} views</strong>
          </span>
        </p>
      </div>
    </div>
  );
};

export default function Pitchdesk() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [templates, setTemplates] = useState<CardProps[]>(data);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [visibleTemplates, setVisibleTemplates] = useState<number>(8);
  const [loadingMore, setLoadingMore] = useState(false);

  const filteredTemplates = templates.filter(
    (template) =>
      (selectedCategory === "All" || template.category === selectedCategory) &&
      (searchTerm === "" ||
        template.title.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const displayedTemplates = filteredTemplates.slice(0, visibleTemplates);

  const loadMoreTemplates = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleTemplates((prev) => prev + 4); // Load 4 more
      setLoadingMore(false);
    }, 1000); // Simulating API delay
  };

  return (
    <>
      <AppLayout>
        <div className="min-h-screen overflow-x-hidden bg-white dark:bg-gray-900">
          <div className="sticky top-0 z-50 p-4 pb-0 sm:mx-4 sm:pt-8">
            <section className="mb-6 flex items-center justify-between space-x-2 sm:space-x-0 md:mb-8 lg:mb-12">
              <div className="space-y-0 sm:space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Discover Professional Pitch Deck Templates for Your Startup
                </h1>
                <p className="text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-none">
                  Explore startup pitch decks used by successful companies to
                  impress investors and clients.
                </p>
              </div>
            </section>
            <section className="mb-4 flex items-center justify-between space-x-2 sm:space-x-0 md:mb-8 lg:mb-12">
              <div className="space-y-0 sm:space-y-1">
                <h5 className="text-base font-semibold tracking-tight text-foreground sm:text-2xl">
                  All Your Pitch Deck Templates
                </h5>
                <p className="text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-none">
                  Manage all your Pitch Deck Templates in one place.
                </p>
              </div>
              <div className="flex items-center gap-x-1">
                <AddDocumentModal>
                  <Button
                    className="group flex flex-1 items-center justify-start gap-x-1 whitespace-nowrap px-1 text-left sm:gap-x-3 sm:px-3"
                    title="Add New Template"
                  >
                    <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="text-xs sm:text-base">
                      Add New Template
                    </span>
                  </Button>
                </AddDocumentModal>
                <AddFolderModal>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-gray-500 bg-gray-50 hover:bg-gray-200 dark:bg-black hover:dark:bg-muted"
                  >
                    <FolderPlusIcon
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </AddFolderModal>
              </div>
            </section>
            <div className="mb-8 grid grid-cols-1 items-center gap-3 md:flex-row">
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Search pitch deck templates..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`text-gray-700 dark:text-gray-300 ${selectedCategory === category ? "font-bold" : ""}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
                {" | "}
                <button
                  className={`text-gray-700 dark:text-gray-300 ${selectedCategory === "New" ? "font-bold" : ""}`}
                  onClick={() => setSelectedCategory("New")}
                >
                  New
                  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500 align-middle"></span>
                </button>
              </div>
              <hr className="mx-auto h-1 w-1/2 bg-gray-600 opacity-50 dark:bg-white" />
            </div>
            <Separator className="bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {displayedTemplates.map((template) => (
              <>
                <Card
                  key={template.id}
                  image={template.image}
                  title={template.title}
                  views={template.views}
                  category={template.category}
                  id={template.id}
                />
              </>
            ))}
          </div>

          {/* Load More Button */}
          <div className="flex justify-center gap-x-2 p-4 sm:p-6 lg:p-8">
            <Button
              className="group flex items-center justify-center gap-x-2 rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-300 dark:bg-gray-50 dark:text-neutral-900 sm:gap-x-3 sm:px-3"
              title="Load More Templates"
              disabled={
                loadingMore || visibleTemplates >= filteredTemplates.length
              }
              onClick={loadMoreTemplates}
            >
              {loadingMore ? (
                <LoadingSpinner className="h-6 w-6" />
              ) : (
                <>
                  <GalleryVerticalEnd
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm sm:text-base">
                    Load More Templates
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
