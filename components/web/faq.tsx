"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Papermark?",
    answer:
      "Papermark is a dynamic, open-source alternative to DocSend. It enables secure document sharing, tracking, and storage, providing users with real-time analytics. Like your Pitchdeck.",
  },
  {
    question: "How can I use Papermark?",
    answer:
      "You can subscribe to one of our plans or use it for free and host it yourself. Simply visit our GitHub page, clone the repository, follow the setup instructions and start using Papermark. You can customize it according to your specific needs as it is open-source. https://github.com/mfts/papermark",
  },
  {
    question: "Is Papermark free?",
    answer:
      "Yes, Papermark is completely open-source. This means you are free to use, modify, and distribute it as you see fit according to the terms of our license.",
  },
  {
    question: "Can I add my custom domain to look professional?",
    answer:
      "Yes, with Papermark you can connect your custom domain and send your Pitchdeck or document via it. While continue tracking the analytics",
  },
  {
    question: "How I can reach more investors with Papermark?",
    answer:
      "Papermark has recommendations for more similar investors for your specific startup build in.",
  },
  {
    question: "How I can use Papermark as a VC?",
    answer:
      "You can use it to summarise and analyse data for different Pitchdecks",
  },
  {
    question: "Can I contribute to the Papermark project?",
    answer:
      "Yes, contributions are welcome! Please visit our GitHub repository to learn about how you can contribute. Whether it&apos;s by improving the code, adding new features, or even reporting bugs, all contributions are appreciated. https://github.com/mfts/papermark",
  },
];

export default function Faq() {
  return (
    <div className="">
      <dl className="mt-10 divide-y divide-gray-800/10 ">
        {faqs.map((faq) => (
          <Accordion key={faq.question} type="single" collapsible>
            <AccordionItem value={faq.question} className="py-2 border-none">
              <AccordionTrigger className="text-left text-gray-800 dark:text-gray-200 text-balance font-medium leading-7 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-gray-500">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </dl>
    </div>
  );
}
