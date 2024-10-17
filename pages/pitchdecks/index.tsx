import { useState } from "react";

import { Separator } from "@radix-ui/react-dropdown-menu";
import { Frame, Icon, Presentation } from "lucide-react";

import AppLayout from "@/components/layouts/app";

interface CardProps {
  image: string;
  title: string;
  views: number;
  category: string;
}

const data: CardProps[] = [
  {
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668c982d4b3e168b1f4af_Slidebean-Pitch-Deck-Template-Airbnb-p-500.webp",
    title: "Airbnb Pitch Deck",
    views: 980300,
    category: "Pitch Decks",
  },
  {
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/665668e3883d43cd52b61816_Slidebean-Pitch-Deck-Template-Uber.webp",
    title: "Uber Pitch Deck",
    views: 839900,
    category: "Business",
  },
  {
    image:
      "https://cdn.prod.website-files.com/6179a66d5f9cc70024c61878/6658b124f408c8e1f783eb15_Slidebean-Investor-Deck-Template-1.webp",
    title: "Investor Deck Template",
    views: 625500,
    category: "Marketing",
  },
  {
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
  const filteredTemplates = templates.filter(
    (template) =>
      (selectedCategory === "All" || template.category === selectedCategory) &&
      (searchTerm === "" ||
        template.title.toLowerCase().includes(searchTerm.toLowerCase())),
  );
  return (
    <>
      <AppLayout>
        <div className="min-h-screen overflow-x-hidden bg-white dark:bg-gray-900">
          <div className="sticky top-0 z-50 bg-white p-4 pb-0 dark:bg-gray-900 sm:mx-4 sm:pt-8">
            <section className="mb-6 flex items-center justify-between space-x-2 sm:space-x-0 md:mb-8 lg:mb-12">
              <div className="space-y-0 sm:space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-black text-foreground dark:text-white sm:text-2xl">
                  Discover Professional Pitch Deck Templates for Your Startup
                </h1>
                <p className="text-xs leading-4 text-gray-600 text-muted-foreground dark:text-gray-400 sm:text-sm sm:leading-none">
                  Explore 100+ startup pitch decks used by successful companies
                  to impress investors and clients.
                </p>
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
                <button
                  className="text-gray-700 dark:text-gray-300"
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
            {filteredTemplates.map((template, index) => (
              <Card
                key={index}
                image={template.image}
                title={template.title}
                views={template.views}
                category={template.category}
              />
            ))}
          </div>

          {/* Load More Button */}
          <div className="flex justify-center py-8">
            <button className="rounded-lg bg-black px-6 py-2 text-white dark:bg-gray-700">
              Load More Templates
            </button>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
