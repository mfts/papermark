import { InputHTMLAttributes, ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Input } from "./input";

export function Form({
  title,
  description,
  inputAttrs,
  helpText,
  buttonText = "Save Changes",
  disabledTooltip,
  handleSubmit,
}: {
  title: string;
  description: string;
  inputAttrs: InputHTMLAttributes<HTMLInputElement>;
  helpText?: string | ReactNode;
  buttonText?: string;
  disabledTooltip?: string | ReactNode;
  handleSubmit: (data: any) => Promise<any>;
}) {
  const [value, setValue] = useState(inputAttrs.defaultValue);
  const [saving, setSaving] = useState(false);
  const saveDisabled = useMemo(() => {
    return saving || !value || value === inputAttrs.defaultValue;
  }, [saving, value, inputAttrs.defaultValue]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await handleSubmit({
          [inputAttrs.name as string]: value,
        });
        setSaving(false);
      }}
      className="rounded-lg"
    >
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {typeof inputAttrs.defaultValue === "string" ? (
            <Input
              {...inputAttrs}
              type={inputAttrs.type || "text"}
              required
              disabled={disabledTooltip ? true : false}
              onChange={(e) => setValue(e.target.value)}
              className={cn(
                "w-full max-w-md focus:border-gray-500 focus:outline-none focus:ring-gray-500",
                {
                  "cursor-not-allowed bg-gray-100 text-gray-400":
                    disabledTooltip,
                },
              )}
              data-1p-ignore
            />
          ) : (
            <div className="h-[2.35rem] w-full max-w-md animate-pulse rounded-md bg-gray-200" />
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
          <p className="text-sm text-muted-foreground transition-colors">
            {helpText || ""}
          </p>

          <div className="shrink-0">
            <Button loading={saving} disabled={saveDisabled}>
              {buttonText}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
