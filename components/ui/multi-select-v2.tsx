import * as React from "react";

import { type VariantProps, cva } from "class-variance-authority";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  PlusIcon,
  WandSparkles,
  XCircle,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

import { Icon } from "../shared/icons";
import LoadingSpinner from "./loading-spinner";
import { BadgeTooltip } from "./tooltip";

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
  "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps<
  TMeta = { color: string; description: string | null },
> extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: ComboboxOption<TMeta>[];
  searchPlaceholder?: string;
  inputClassName?: string;
  createLabel?: (search: string) => React.ReactNode;
  onCreate?: (search: string) => Promise<boolean>;
  optionClassName?: string;

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /** update dynamic selected values when the value change. */
  value: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;
  isPopoverOpen: boolean;
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loading?: boolean;
}

export type ComboboxOption<
  TMeta = { color: string; description: string | null },
> = {
  label: string | React.ReactNode;
  value: string;
  icon?: Icon | React.ReactNode;
  meta?: TMeta;
  separatorAfter?: boolean;
};

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      className,
      value,
      searchPlaceholder = "Search...",
      inputClassName,
      optionClassName,
      onCreate,
      createLabel,
      setIsPopoverOpen,
      isPopoverOpen,
      loading,
      ...props
    },
    ref,
  ) => {
    // const [selectedValues, setSelectedValues] =
    //   React.useState<string[]>(defaultValue);
    const [isCreating, setIsCreating] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        event.preventDefault();
        event.stopPropagation();
        const newSelectedValues = [...value];
        newSelectedValues.pop();
        // setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: string) => {
      const newSelectedValues = value.includes(option)
        ? value.filter((value) => value !== option)
        : [...value, option];
      // setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      // setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      const newSelectedValues = value.slice(0, maxCount);
      // setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
      if (value.length === options.length) {
        handleClear();
      } else {
        const allValues = options.map((option) => option.value);
        // setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };
    // flex w-full rounded-none rounded-l-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm
    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={handleTogglePopover}
            className={cn(
              "flex h-auto w-full items-center justify-between rounded-md border border-input bg-inherit px-3 py-2 hover:bg-inherit focus:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent [&_svg]:pointer-events-auto",
              className,
            )}
          >
            {loading ? (
              <div className="mx-auto flex w-full items-center justify-between">
                <LoadingSpinner className="size-4 shrink-0" />
              </div>
            ) : value.length > 0 ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-wrap items-center">
                  {value.slice(0, maxCount).map((value) => {
                    const option = options.find((o) => o.value === value);
                    return (
                      <Badge
                        key={value}
                        className={cn(
                          isAnimating ? "animate-bounce" : "",
                          multiSelectVariants({ variant }),
                        )}
                        style={{ animationDuration: `${animation}s` }}
                      >
                        {option?.label}
                        <XCircle
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleOption(value);
                          }}
                        />
                      </Badge>
                    );
                  })}
                  {value.length > maxCount && (
                    <Badge
                      className={cn(
                        "border-foreground/1 bg-transparent text-foreground hover:bg-transparent",
                        isAnimating ? "animate-bounce" : "",
                        multiSelectVariants({ variant }),
                      )}
                      style={{ animationDuration: `${animation}s` }}
                    >
                      {`+ ${value.length - maxCount} more`}
                      <XCircle
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation();
                          clearExtraOptions();
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <XIcon
                    className="mx-2 h-4 cursor-pointer text-muted-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClear();
                    }}
                  />
                  <Separator
                    orientation="vertical"
                    className="flex h-full min-h-6"
                  />
                  <ChevronDownIcon className="ml-2 h-4 w-4 cursor-pointer text-muted-foreground opacity-50" />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  {placeholder}
                </span>
                <ChevronDownIcon className="h-4 w-4 cursor-pointer text-muted-foreground opacity-50" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 sm:w-[600px] sm:max-w-[35rem]"
          align="start"
          onEscapeKeyDown={() => setIsPopoverOpen(false)}
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className={cn(
                "grow border-0 py-3 pl-4 pr-2 outline-none placeholder:text-neutral-400 focus:ring-0 sm:text-sm",
                inputClassName,
              )}
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  key="all"
                  onSelect={toggleAll}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      value.length === options?.length
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </div>
                  <span>(Select All)</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {loading ? (
                  <CommandItem className="justify-center">
                    <LoadingSpinner className="size-4 shrink-0" />
                  </CommandItem>
                ) : options.length > 0 ? (
                  options.map((option) => {
                    const isSelected = value.includes(option.value);
                    const IconComponent = option.icon;
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleOption(option.value)}
                        className="cursor-pointer gap-2"
                        data-Value={option.value}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </div>
                        {IconComponent && isReactNode(IconComponent) ? (
                          IconComponent
                        ) : typeof IconComponent === "function" ? (
                          <IconComponent className="h-5 w-4" />
                        ) : null}
                        <span>{option.label}</span>
                        {option.meta?.description && (
                          <BadgeTooltip content={option.meta?.description}>
                            <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
                          </BadgeTooltip>
                        )}
                      </CommandItem>
                    );
                  })
                ) : (
                  <CommandItem className="justify-center">
                    <span>No tags available</span>
                  </CommandItem>
                )}
              </CommandGroup>
              {search.length > 0 && onCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      className={cn(
                        "flex cursor-pointer items-center gap-2 whitespace-nowrap",
                        optionClassName,
                      )}
                      onSelect={async () => {
                        setIsCreating(true);
                        const success = await onCreate?.(search);
                        if (success) {
                          setSearch("");
                          setIsPopoverOpen(false);
                        }
                        setIsCreating(false);
                      }}
                    >
                      {isCreating ? (
                        <LoadingSpinner className="size-4 shrink-0" />
                      ) : (
                        <PlusIcon className="size-4 shrink-0" />
                      )}
                      <p className="grow truncate">
                        {createLabel?.(search) || `Create "${search}"`}
                      </p>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {value.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={handleClear}
                        className="flex-1 cursor-pointer justify-center"
                      >
                        Clear
                      </CommandItem>
                      <Separator
                        orientation="vertical"
                        className="flex h-full min-h-6"
                      />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="max-w-full flex-1 cursor-pointer justify-center"
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        {animation > 0 && value.length > 0 && (
          <WandSparkles
            className={cn(
              "my-2 h-3 w-3 cursor-pointer bg-background text-foreground",
              isAnimating ? "" : "text-muted-foreground",
            )}
            onClick={() => setIsAnimating(!isAnimating)}
          />
        )}
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

const isReactNode = (element: any): element is React.ReactNode =>
  React.isValidElement(element);
