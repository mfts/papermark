import { ChangeEvent, FormEventHandler, useMemo, useRef } from "react";

import { PlanEnum } from "@/ee/stripe/constants";

import { usePlan } from "@/lib/swr/use-billing";
import { TagColorProps } from "@/lib/types";
import { cn } from "@/lib/utils";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { COLORS_LIST } from "../links/link-sheet/tags/tag-badge";

export function AddTagsModal({
  open,
  setMenuOpen,
  children,
  tagForm,
  setTagForm,
  handleSubmit,
  tagCount = 0,
}: {
  tagCount: number | undefined;
  open: boolean;
  setMenuOpen: (open: boolean) => void;
  children?: React.ReactNode;
  tagForm: {
    color: TagColorProps;
    name: string;
    description: string | null;
    loading: boolean;
    id?: string;
  };
  setTagForm: React.Dispatch<
    React.SetStateAction<{
      color: TagColorProps;
      name: string;
      description: string | null;
      loading: boolean;
    }>
  >;
  handleSubmit: FormEventHandler<HTMLFormElement> | undefined;
}) {
  const { isFree, isTrial } = usePlan();
  const initialValues = useRef(tagForm);

  useMemo(() => {
    if (tagForm.id && tagForm.id !== initialValues.current.id) {
      initialValues.current = tagForm;
    }
  }, [tagForm.id]);

  const hasChanged =
    tagForm.name !== initialValues.current.name ||
    tagForm.color !== initialValues.current.color ||
    tagForm.description !== initialValues.current.description;

  const isFormValid =
    tagForm.name.length >= 3 && !!tagForm.color && (!tagForm.id || hasChanged);

  // If the team is on a free plan and has reached the max limit of 5 tags
  if (isFree && tagCount >= 5) {
    if (children) {
      return (
        <UpgradePlanModal
          clickedPlan={isTrial ? PlanEnum.Business : PlanEnum.Pro}
          trigger={"create_tag"}
        >
          <Button>Upgrade to Create Tags</Button>
        </UpgradePlanModal>
      );
    }
  }

  function handleValueChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    setTagForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <Dialog open={open} onOpenChange={setMenuOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>{tagForm.id ? "Edit Tag" : "Create Tag"}</DialogTitle>
          <DialogDescription>
            Organize your links with tags for easy categorization and search.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="name" className="opacity-80">
            Tag name
          </Label>
          <Input
            name="name"
            id="name"
            value={tagForm.name}
            placeholder="documentation"
            className="mb-3 mt-1 w-full"
            onChange={(e) => handleValueChange(e)}
          />

          <Label htmlFor="color" className="opacity-80">
            Tag Color
          </Label>
          <ToggleGroup
            id="color"
            type="single"
            value={tagForm.color}
            onValueChange={(value: TagColorProps) => {
              if (value) {
                setTagForm((prev) => ({
                  ...prev,
                  color: value,
                }));
              }
            }}
            className="my-2 flex-shrink-0 flex-wrap !justify-start gap-3"
          >
            {COLORS_LIST.map((li) => (
              <ToggleGroupItem
                key={li.color}
                value={li.color}
                aria-label={`Select ${li.color}`}
                className={cn(
                  "h-8 rounded-full border-0 px-3 text-sm transition-all",
                  li.css,
                  tagForm.color === li.color
                    ? `ring-${li.color}-500 ring-2 text-${li.color}-500`
                    : "border-transparent",
                )}
              >
                {li.color}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div>
            <Label htmlFor="description" className="opacity-80">
              Description
            </Label>
            <Textarea
              value={tagForm.description || ""}
              onChange={(e) => handleValueChange(e)}
              rows={5}
              name="description"
              id="description"
              placeholder="Add a description to understand the purpose of this tag..."
              className="mt-1 flex-1 bg-muted"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="mt-3 h-9 w-full"
              disabled={!isFormValid || tagForm.loading}
            >
              {tagForm.loading
                ? "Saving..."
                : tagForm.id
                  ? "Save Changes"
                  : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
