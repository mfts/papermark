import {
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { validateEmail } from "@/lib/utils/validate-email";

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
  validate,
  defaultValue,
}: {
  title: string;
  description: string;
  inputAttrs: InputHTMLAttributes<HTMLInputElement>;
  helpText?: string | ReactNode;
  buttonText?: string;
  disabledTooltip?: string | ReactNode;
  handleSubmit: (data: any) => Promise<any>;
  validate?: (data: string) => boolean;
  defaultValue?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) setValue(defaultValue);
  }, [defaultValue]);

  const saveDisabled = useMemo(() => {
    return saving || !value || value === defaultValue;
  }, [saving, value, defaultValue]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        if (!validate || validate(value?.toString() || "")) {
          await handleSubmit({
            [inputAttrs.name as string]: value?.toString(),
          });
        } else {
          toast.error("Please enter a valid value");
        }
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
          {typeof defaultValue === "string" ? (
            <Input
              {...inputAttrs}
              value={value}
              type={inputAttrs.type || "text"}
              required
              disabled={!!disabledTooltip}
              onChange={(e) => setValue(e.target.value)}
              onBlur={(e) => setValue(e.target.value.trim())}
              onKeyDown={(e) =>
                inputAttrs.type === "email" &&
                e.key === " " &&
                e.preventDefault()
              }
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
          {typeof helpText === "string" ? (
            <p
              className="text-sm text-muted-foreground transition-colors"
              dangerouslySetInnerHTML={{ __html: helpText || "" }}
            />
          ) : (
            helpText
          )}
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
