import { useState } from "react";

import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { ButtonTooltip } from "../ui/tooltip";

export default function ReportForm({
  linkId,
  documentId,
  viewId,
}: {
  linkId: string | undefined;
  documentId: string | undefined;
  viewId: string | undefined;
}) {
  const [abuseType, setAbuseType] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  enum AbuseTypeEnum {
    "spam" = 1,
    "malware" = 2,
    "copyright" = 3,
    "harmful" = 4,
    "not-working" = 5,
    "other" = 6,
  }

  const handleSubmit = async () => {
    if (!abuseType) {
      toast.error("Please select an abuse type.");
      return;
    }

    const abuseTypeEnum =
      AbuseTypeEnum[abuseType as keyof typeof AbuseTypeEnum]; // Convert string to enum number

    setLoading(true);

    const response = await fetch("/api/report", {
      method: "POST",
      body: JSON.stringify({
        linkId: linkId,
        documentId: documentId,
        viewId: viewId,
        abuseType: abuseTypeEnum, // Send the numeric value of the abuse type
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const { message } = await response.json();
      toast.error(message);
      setOpen(false);
      setLoading(false);
      return;
    }

    toast.success("Report submitted successfully");
    setOpen(false);
    setLoading(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <ButtonTooltip
          content="Report abuse"
          sideOffset={8}
          className="border-gray-800"
        >
          <PopoverTrigger asChild>
            <Button
              className="h-8 w-8 bg-gray-900 text-xs text-gray-300 hover:bg-gray-900/80 hover:text-gray-50 sm:h-10 sm:w-10 sm:text-sm"
              size="icon"
              title="Report abuse"
            >
              <Flag className="size-3 sm:size-4" />
            </Button>
          </PopoverTrigger>
        </ButtonTooltip>
        <PopoverContent className="w-auto" align="end">
          <div className="flex max-w-xs flex-col gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Report an issue</h4>
              <p className="text-sm text-muted-foreground">
                See something inappropriate? We will take a look and, when
                appropriate, take action.
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <RadioGroup value={abuseType} onValueChange={setAbuseType} className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam" className="font-normal">
                    Spam, Fraud, or Scam
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="malware" id="malware" />
                  <Label htmlFor="malware" className="font-normal">
                    Malware or virus
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="copyright" id="copyright" />
                  <Label htmlFor="copyright" className="font-normal">
                    Copyright violation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harmful" id="harmful" />
                  <Label htmlFor="harmful" className="font-normal">
                    Harmful content
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-working" id="not-working" />
                  <Label htmlFor="not-working" className="font-normal">
                    Content is not working properly
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal">
                    Other
                  </Label>
                </div>
              </RadioGroup>
              <Button
                onClick={handleSubmit}
                disabled={!abuseType}
                loading={loading}
                size="sm"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
