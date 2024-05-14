import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";
import {
  Upload as ArrowUpTrayIcon,
  BadgeInfoIcon,
  HelpCircleIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

export default function QuestionSection({
  data,
  setData,
  hasFreePlan,
  handleUpgradeStateChange,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  hasFreePlan: boolean;
  handleUpgradeStateChange: (
    state: boolean,
    trigger: string,
    plan?: "Pro" | "Business" | "Data Rooms",
  ) => void;
}) {
  const { enableQuestion, questionText, questionType } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableQuestion!);
  }, [enableQuestion]);

  const handleQuestion = async () => {
    const updatedQuestion = !enabled;

    setData({ ...data, enableQuestion: updatedQuestion });
    setEnabled(updatedQuestion);
  };

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "flex items-center gap-x-2 text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
              hasFreePlan ? "cursor-pointer" : undefined,
            )}
            onClick={
              hasFreePlan
                ? () =>
                    handleUpgradeStateChange(
                      true,
                      "link_sheet_question_section",
                      "Business",
                    )
                : undefined
            }
          >
            Feedback Question
            {/* <span>
              <HelpCircleIcon className="text-muted-foreground h-4 w-4" />
            </span> */}
            {hasFreePlan && (
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs text-foreground ring-1 ring-gray-800 dark:ring-gray-500">
                Business
              </span>
            )}
          </h2>
        </div>
        <Switch
          checked={enabled}
          onClick={
            hasFreePlan
              ? () =>
                  handleUpgradeStateChange(
                    true,
                    "link_sheet_question_section",
                    "Business",
                  )
              : undefined
          }
          className={hasFreePlan ? "opacity-50" : undefined}
          onCheckedChange={hasFreePlan ? undefined : handleQuestion}
        />
      </div>

      {enabled && (
        <motion.div
          className="relative mt-4 space-y-3"
          {...FADE_IN_ANIMATION_SETTINGS}
        >
          <div className="flex w-full flex-col items-start gap-6 overflow-x-visible pb-4 pt-0">
            <div className="w-full space-y-2">
              <Label>Question Type</Label>
              <Select defaultValue="yes-no">
                <SelectTrigger className="focus:ring-offset-3 flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-gray-400 sm:text-sm sm:leading-6">
                  <SelectValue placeholder="Select a question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes-no">Yes / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                id="question"
                type="text"
                name="question"
                required
                placeholder="Are you interested?"
                value={questionText || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    questionText: e.target.value,
                    questionType: "YES_NO",
                  })
                }
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
