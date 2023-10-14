{/* <.Provider>
    <.Root delayDuration={0}>
        <.Trigger asChild>
            <div className="w-10 p-1 h-7 flex justify-center items-center hover:bg-orange-100">
                <Eye className="w-7 h-7 text-slate-400 hover:cursor-pointer" />
            </div>
        </.Trigger>
        <.Portal>
            <.Content className="Content p-1 px-2 font-light  bg-slate-800 text-slate-200" sideOffset={5}>
                Preview
                <.Arrow className="Arrow" />
            </.Content>
        </.Portal>
    </.Root>
</.Provider> */}


"use client";

import * as React from "react";
import * as Primitives from "@radix-ui/react-"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

