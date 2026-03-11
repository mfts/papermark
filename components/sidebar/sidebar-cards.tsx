"use client";

import Link from "next/link";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { MessageSquareIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { SlackIcon } from "@/components/shared/icons/slack-icon";

export interface SidebarCard {
  id: string;
  type: "upgrade" | "slack" | "changelog" | "survey";
  title: string;
  description: string;
  image?: string;
  href?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  icon?: React.ReactNode;
}

interface SidebarCardsProps {
  cards: SidebarCard[];
  onDismiss?: (cardId: string) => void;
}

const OFFSET_FACTOR = 4;
const SCALE_FACTOR = 0.03;
const OPACITY_FACTOR = 0.1;
const STORAGE_KEY = "papermark-dismissed-sidebar-cards";

function getDismissedCards(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDismissedCards(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 50)));
  } catch {}
}

export function SidebarCards({ cards, onDismiss }: SidebarCardsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setDismissedIds(getDismissedCards());
  }, []);

  const visibleCards = useMemo(
    () => cards.filter((card) => !dismissedIds.includes(card.id)),
    [cards, dismissedIds],
  );

  const cardCount = visibleCards.length;

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (cardCount === 0 && dismissedIds.length > 0) {
      setShowCompleted(true);
      timeout = setTimeout(() => setShowCompleted(false), 2700);
    }
    return () => clearTimeout(timeout);
  }, [cardCount, dismissedIds.length]);

  const handleDismiss = useCallback(
    (cardId: string) => {
      const updated = [cardId, ...dismissedIds];
      setDismissedIds(updated);
      setDismissedCards(updated);
      onDismiss?.(cardId);
    },
    [dismissedIds, onDismiss],
  );

  if (!cardCount && !showCompleted) return null;

  return (
    <div className="group/cards overflow-hidden border-t border-gray-200 p-3 pt-4 transition-all duration-200 hover:pt-6 dark:border-gray-800">
      <div className="relative size-full">
        {[...visibleCards].reverse().map((card, idx) => {
          const isTopCard = idx === cardCount - 1;

          return (
            <div
              key={card.id}
              className={cn(
                "absolute left-0 top-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-200",
                cardCount - idx > 3
                  ? [
                      "opacity-0 sm:group-hover/cards:translate-y-[var(--y)] sm:group-hover/cards:opacity-[var(--opacity)]",
                      "sm:group-has-[*[data-dragging=true]]/cards:translate-y-[var(--y)] sm:group-has-[*[data-dragging=true]]/cards:opacity-[var(--opacity)]",
                    ]
                  : "translate-y-[var(--y)] opacity-[var(--opacity)]",
              )}
              style={
                {
                  "--y": `-${(cardCount - (idx + 1)) * OFFSET_FACTOR}%`,
                  "--scale": 1 - (cardCount - (idx + 1)) * SCALE_FACTOR,
                  "--opacity":
                    cardCount - (idx + 1) >= 6
                      ? 0
                      : 1 - (cardCount - (idx + 1)) * OPACITY_FACTOR,
                } as CSSProperties
              }
              aria-hidden={!isTopCard}
            >
              <SidebarCardItem
                card={card}
                hideContent={!isTopCard}
                active={isTopCard}
                onDismiss={() => handleDismiss(card.id)}
              />
            </div>
          );
        })}

        {/* Invisible spacer to maintain height */}
        <div className="pointer-events-none invisible" aria-hidden>
          <SidebarCardItem
            card={{
              id: "spacer",
              type: "changelog",
              title: "Title",
              description: "Description placeholder",
              image: "data:,",
            }}
          />
        </div>

        {/* All caught up state */}
        {showCompleted && !cardCount && (
          <div
            className="animate-in fade-in absolute inset-0 flex size-full flex-col items-center justify-center gap-2 duration-500"
            style={{ "--offset": "10px" } as CSSProperties}
          >
            <div className="absolute inset-0 rounded-lg border border-gray-200 dark:border-gray-700" />
            <SparklesIcon className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              You&apos;re all caught up!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarCardItem({
  card,
  hideContent,
  active,
  onDismiss,
}: {
  card: SidebarCard;
  hideContent?: boolean;
  active?: boolean;
  onDismiss?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({
    start: 0,
    delta: 0,
    startTime: 0,
    maxDelta: 0,
  });
  const animationRef = useRef<Animation | undefined>(undefined);
  const [dragging, setDragging] = useState(false);

  const dismiss = () => {
    if (!ref.current) return;
    const cardWidth = ref.current.getBoundingClientRect().width;
    const translateX = Math.sign(drag.current.delta || 1) * cardWidth;

    animationRef.current = ref.current.animate(
      { opacity: 0, transform: `translateX(${translateX}px)` },
      { duration: 150, easing: "ease-in-out", fill: "forwards" },
    );
    animationRef.current.onfinish = () => onDismiss?.();
  };

  const onDragMove = (e: PointerEvent) => {
    if (!ref.current) return;
    const dx = e.clientX - drag.current.start;
    drag.current.delta = dx;
    drag.current.maxDelta = Math.max(drag.current.maxDelta, Math.abs(dx));
    ref.current.style.setProperty("--dx", dx.toString());
  };

  const onDragEnd = () => {
    if (!ref.current) return;
    unbindListeners();
    setDragging(false);

    const dx = drag.current.delta;
    if (Math.abs(dx) > ref.current.clientWidth / 3) {
      dismiss();
      return;
    }

    animationRef.current = ref.current.animate(
      { transform: "translateX(0)" },
      { duration: 150, easing: "ease-in-out" },
    );
    animationRef.current.onfinish = () =>
      ref.current?.style.setProperty("--dx", "0");
    drag.current = { start: 0, delta: 0, startTime: 0, maxDelta: 0 };
  };

  const onDragCancel = () => {
    if (!ref.current) return;
    unbindListeners();
    setDragging(false);

    const dx = drag.current.delta;
    if (Math.abs(dx) > ref.current.clientWidth / 2) {
      dismiss();
      return;
    }

    animationRef.current = ref.current.animate(
      { transform: "translateX(0)" },
      { duration: 150, easing: "ease-in-out" },
    );
    animationRef.current.onfinish = () =>
      ref.current?.style.setProperty("--dx", "0");
    drag.current = { start: 0, delta: 0, startTime: 0, maxDelta: 0 };
  };

  const bindListeners = () => {
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd);
    document.addEventListener("pointercancel", onDragCancel);
  };

  const unbindListeners = () => {
    document.removeEventListener("pointermove", onDragMove);
    document.removeEventListener("pointerup", onDragEnd);
    document.removeEventListener("pointercancel", onDragCancel);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (
      !active ||
      !ref.current ||
      animationRef.current?.playState === "running"
    )
      return;

    bindListeners();
    setDragging(true);
    drag.current.start = e.clientX;
    drag.current.startTime = Date.now();
    drag.current.delta = 0;
    drag.current.maxDelta = 0;
    ref.current.style.setProperty("--w", ref.current.clientWidth.toString());
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-full select-none rounded-lg border border-gray-200 bg-white p-3 text-[0.8125rem] dark:border-gray-700 dark:bg-gray-900",
        "translate-x-[calc(var(--dx,0)*1px)] rotate-[calc(var(--dx,0)*0.05deg)] opacity-[calc(1-max(var(--dx,0),-1*var(--dx,0))/var(--w,1)/2)]",
        "transition-shadow data-[dragging=true]:shadow-md",
      )}
      data-dragging={dragging}
      onPointerDown={onPointerDown}
    >
      <div className={cn("flex h-full flex-col", hideContent && "invisible")}>
        <div className="flex-1">
          <CardContent card={card} />
        </div>
        <div
          className={cn(
            "h-0 overflow-hidden opacity-0 transition-[height,opacity] duration-200",
            "sm:group-has-[*[data-dragging=true]]/cards:h-8 sm:group-has-[*[data-dragging=true]]/cards:opacity-100 sm:group-hover/cards:h-8 sm:group-hover/cards:opacity-100",
          )}
        >
          <div className="flex items-center justify-between pt-3 text-xs">
            {card.href ? (
              <Link
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                className="font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Read more
              </Link>
            ) : card.action ? (
              <CardAction card={card} />
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardContent({ card }: { card: SidebarCard }) {
  switch (card.type) {
    case "upgrade":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-amber-500" />
            <span className="line-clamp-1 font-semibold text-foreground">
              {card.title}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
            {card.description}
          </p>
        </div>
      );

    case "slack":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SlackIcon className="h-4 w-4" />
            <span className="line-clamp-1 font-semibold text-foreground">
              {card.title}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
            {card.description}
          </p>
        </div>
      );

    case "survey":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="h-4 w-4 text-blue-500" />
            <span className="line-clamp-1 font-semibold text-foreground">
              {card.title}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
            {card.description}
          </p>
        </div>
      );

    case "changelog":
      return (
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 font-semibold text-foreground">
            {card.title}
          </span>
          <p className="line-clamp-2 h-10 text-sm leading-5 text-muted-foreground">
            {card.description}
          </p>
          {card.image && (
            <div className="relative mt-2 aspect-[16/9] w-full shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image}
                alt=""
                className="h-full w-full rounded object-cover object-center"
                draggable={false}
              />
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

function CardAction({ card }: { card: SidebarCard }) {
  if (!card.action) return null;

  if (card.type === "upgrade") {
    return (
      <UpgradePlanModal
        clickedPlan={PlanEnum.Business}
        trigger="sidebar_card"
      >
        <button
          type="button"
          className="font-medium text-foreground transition-colors hover:text-foreground/80"
        >
          {card.action.label}
        </button>
      </UpgradePlanModal>
    );
  }

  if (card.action.href) {
    return (
      <Link
        href={card.action.href}
        className="font-medium text-foreground transition-colors hover:text-foreground/80"
      >
        {card.action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={card.action.onClick}
      className="font-medium text-foreground transition-colors hover:text-foreground/80"
    >
      {card.action.label}
    </button>
  );
}

// Changelog data - can be replaced with API call later
export const CHANGELOG_ENTRIES: SidebarCard[] = [
  {
    id: "changelog-workflows-2025",
    type: "changelog",
    title: "Automated Workflows",
    description:
      "Set up automated document workflows with triggers, conditions, and actions.",
    image: "https://www.papermark.com/_static/meta-image.png",
    href: "https://www.papermark.com/blog",
  },
  {
    id: "changelog-datarooms-plus-2025",
    type: "changelog",
    title: "Datarooms+ Plan",
    description:
      "Advanced data room features with granular permissions, watermarking, and more.",
    href: "https://www.papermark.com/blog",
  },
];

// Hook to build sidebar cards from app state
export function useSidebarCards({
  isFree,
  hasSlackIntegration,
  hasSurvey,
}: {
  isFree: boolean;
  hasSlackIntegration: boolean;
  hasSurvey: boolean;
}): SidebarCard[] {
  return useMemo(() => {
    const cards: SidebarCard[] = [];

    if (isFree) {
      cards.push({
        id: "upgrade-business",
        type: "upgrade",
        title: "Upgrade to Business",
        description:
          "Unlock custom branding, team members, domains and data rooms.",
        action: {
          label: "Upgrade",
        },
      });
    }

    if (!hasSlackIntegration) {
      cards.push({
        id: "connect-slack",
        type: "slack",
        title: "Connect Slack",
        description: "Get visit notifications in your Slack channel.",
        action: {
          label: "Set up Slack",
          href: "/settings/slack",
        },
      });
    }

    if (!hasSurvey) {
      cards.push({
        id: "complete-survey",
        type: "survey",
        title: "Quick question",
        description: "Help us tailor Papermark to your needs — takes 30 seconds.",
        action: {
          label: "Take survey",
          href: "/settings/general#team-survey",
        },
      });
    }

    cards.push(...CHANGELOG_ENTRIES);

    return cards;
  }, [isFree, hasSlackIntegration, hasSurvey]);
}
