"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex items-center select-none touch-none w-[200px] h-5",
      className,
    )}
    defaultValue={[100]}
    max={100}
    step={1}
    {...props}
  >
    <SliderPrimitive.Track className="bg-blackA7 relative grow rounded-full h-[3px]">
      <SliderPrimitive.Range className="absolute bg-white rounded-full h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block w-4 h-4 bg-white shadow-[0_2px_10px] shadow-blackA4 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA5"
      aria-label="Volume"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
