"use client";

import { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Faq = {
  question: string;
  answer: string | ReactNode;
};

type FaqProps = {
  faqs: Faq[];
};
export default function Faq({ faqs }: FaqProps) {
  return (
    <div className="">
      <dl className="mt-10 divide-y divide-gray-800/10">
        {faqs.map((faq) => (
          <Accordion key={faq.question} type="single" collapsible>
            <AccordionItem value={faq.question} className="border-none py-2">
              <AccordionTrigger className="text-balance text-left font-medium leading-7 text-gray-800 hover:no-underline dark:text-gray-200">
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
