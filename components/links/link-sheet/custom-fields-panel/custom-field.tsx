import { memo, useEffect, useState } from "react";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { type CustomFieldData } from ".";

interface CustomFieldProps {
  field: CustomFieldData;
  onUpdate: (field: CustomFieldData) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default memo(function CustomField({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: CustomFieldProps) {
  const [localField, setLocalField] = useState<CustomFieldData>(field);

  useEffect(() => {
    onUpdate(localField);
  }, [localField]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof CustomFieldData,
  ) => {
    if (key === "label") {
      setLocalField((prev) => ({
        ...prev,
        [key]: e.target.value,
        identifier: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      }));
    } else {
      setLocalField((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    }
  };

  const handleSelectChange = (value: string, key: keyof CustomFieldData) => {
    setLocalField((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean, key: keyof CustomFieldData) => {
    setLocalField((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  return (
    <div className="group relative flex flex-col space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="absolute -right-2 -top-2 hidden group-hover:block">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background text-muted-foreground hover:bg-background hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="type">Input Type</Label>
          <Select
            value={localField.type}
            onValueChange={(value) => handleSelectChange(value, "type")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SHORT_TEXT">Short Text</SelectItem>
              <SelectItem value="LONG_TEXT">Long Text</SelectItem>
              <SelectItem value="NUMBER">Number</SelectItem>
              <SelectItem value="PHONE_NUMBER">Phone</SelectItem>
              <SelectItem value="URL">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            type="text"
            required
            value={localField.label}
            onChange={(e) => handleInputChange(e, "label")}
            placeholder="e.g., Company Name"
          />
        </div>

        {/* <div className="grid gap-2">
          <Label htmlFor="identifier">Identifier</Label>
          <Input
            id="identifier"
            value={localField.identifier}
            type="text"
            disabled
            onChange={(e) => {
              const value = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-");
              handleInputChange(
                { ...e, target: { ...e.target, value } },
                "identifier",
              );
            }}
            placeholder="e.g., company-name"
          />
        </div> */}

        <div className="grid gap-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            type="text"
            value={localField.placeholder || ""}
            onChange={(e) => handleInputChange(e, "placeholder")}
            placeholder="e.g., Enter your company name"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <Label>Required Field</Label>
            <span className="text-sm text-muted-foreground">
              Make this field mandatory
            </span>
          </div>
          <Switch
            checked={localField.required}
            onCheckedChange={(checked) =>
              handleSwitchChange(checked, "required")
            }
          />
        </div>
      </div>
    </div>
  );
});
