import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Row = {
  question: string;
  answer: string;
};

type FaqProps = {
  rows: Row[];
};

export const Faq: React.FC<FaqProps> = ({ rows }) => {
  return (
    <Accordion type="single" collapsible className="not-prose space-y-4">
      {rows.map((row, index) => (
        <AccordionItem key={index} value={row.question}>
          <AccordionTrigger className="flex w-full items-start justify-between text-left text-gray-800 hover:no-underline">
            <span className="text-balance font-medium leading-7">
              {row.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="mt-2 pr-12">
            <p className="text-balance leading-7 text-gray-500">{row.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
