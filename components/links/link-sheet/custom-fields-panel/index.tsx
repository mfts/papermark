import { CustomField, CustomFieldType } from "@prisma/client";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { usePlan } from "@/lib/swr/use-billing";

import CustomFieldComponent from "./custom-field";

export type CustomFieldData = Omit<
  CustomField,
  "id" | "createdAt" | "updatedAt" | "linkId"
> & {
  type: Omit<
    CustomFieldType,
    "PHONE_NUMBER" | "CHECKBOX" | "SELECT" | "MULTI_SELECT"
  >;
};

export default function CustomFieldsPanel({
  fields,
  onChange,
  isConfigOpen,
  setIsConfigOpen,
}: {
  fields: CustomFieldData[];
  onChange: (fields: CustomFieldData[]) => void;
  isConfigOpen: boolean;
  setIsConfigOpen: (open: boolean) => void;
}) {
  const { isDatarooms, isDataroomsPlus, isBusiness } = usePlan();

  const getFieldLimit = () => {
    if (isDatarooms || isDataroomsPlus) return 3;
    if (isBusiness) return 1;
    return 0;
  };

  const addField = () => {
    const fieldLimit = getFieldLimit();
    if (fields.length >= fieldLimit) {
      toast.error(
        `You can only add up to ${fieldLimit} custom field${fieldLimit === 1 ? "" : "s"} on the ${isDatarooms ? "Data Rooms" : "Business"} plan`,
      );
      return;
    }

    const newField: CustomFieldData = {
      type: "SHORT_TEXT",
      identifier: "",
      label: "",
      placeholder: "",
      required: false,
      disabled: false,
      orderIndex: fields.length,
    };
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updatedField: CustomFieldData) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    onChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Update orderIndex for remaining fields
    newFields.forEach((field, i) => {
      field.orderIndex = i;
    });
    onChange(newFields);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    )
      return;

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[index],
    ];

    // Update orderIndex for all fields
    newFields.forEach((field, i) => {
      field.orderIndex = i;
    });

    onChange(newFields);
  };

  const fieldLimit = getFieldLimit();

  return (
    <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
      <SheetContent className="flex h-full flex-col">
        <SheetHeader>
          <SheetTitle>Configure Custom Fields</SheetTitle>
          <SheetDescription>
            Configure the custom fields that will be shown to viewers.
            {fieldLimit > 0 && (
              <span className="mt-1 block text-sm text-muted-foreground">
                You can add up to {fieldLimit} custom field
                {fieldLimit === 1 ? "" : "s"} on the{" "}
                {isDatarooms ? "Data Rooms" : "Business"} plan.
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {fields.length} of {fieldLimit} custom field
            {fields.length === 1 ? "" : "s"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addField}
            className="flex items-center gap-2"
            disabled={fields.length >= fieldLimit}
          >
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <CustomFieldComponent
                key={index}
                field={field}
                onUpdate={(updatedField) => updateField(index, updatedField)}
                onDelete={() => removeField(index)}
                onMoveUp={() => moveField(index, "up")}
                onMoveDown={() => moveField(index, "down")}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
