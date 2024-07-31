"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type Faq = {
  question: string;
  answer: string;
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
