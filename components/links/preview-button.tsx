import { EyeIcon } from "lucide-react";
import { EyeOffIcon } from "lucide-react";

import { LinkWithViews } from "@/lib/types";

import { Button } from "../ui/button";
import { ButtonTooltip } from "../ui/tooltip";

const PreviewButton = ({
  link,
  isProcessing,
  onPreview,
}: {
  link: LinkWithViews;
  isProcessing: boolean;
  onPreview: (link: LinkWithViews) => void;
}) => {
  return (
    <div className="relative">
      <ButtonTooltip
        content={isProcessing ? "Preparing preview" : "Preview link"}
      >
        <div>
          <Button
            variant={"link"}
            size={"icon"}
            className="group h-7 w-8"
            onClick={() => onPreview(link)}
            disabled={isProcessing}
          >
            <span className="sr-only">Preview link</span>
            {isProcessing ? (
              <EyeOffIcon className="text-gray-400 group-hover:text-gray-500" />
            ) : (
              <EyeIcon className="text-gray-400 group-hover:text-gray-500" />
            )}
          </Button>
        </div>
      </ButtonTooltip>
    </div>
  );
};

export { PreviewButton };
