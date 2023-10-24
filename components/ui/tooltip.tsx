import React, { MouseEventHandler, ReactNode } from 'react'
import * as Tooltip from "@radix-ui/react-tooltip";

interface TooltipProps {
    title: string;
    children: ReactNode
}

function TooltipBox({ title, children }: TooltipProps) {
    return (
        <Tooltip.Provider>
            <Tooltip.Root delayDuration={0}>

                <Tooltip.Trigger asChild>
                    {children}
                </Tooltip.Trigger>

                <Tooltip.Portal>
                    <Tooltip.Content
                        className="TooltipContent p-1 px-2 font-light  bg-slate-800 text-slate-200"
                        sideOffset={5}>
                        {title}
                        <Tooltip.Arrow className="TooltipArrow" />
                    </Tooltip.Content>
                </Tooltip.Portal>

            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export {TooltipBox}