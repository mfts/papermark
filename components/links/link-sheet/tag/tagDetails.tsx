import { useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";

import { PropsWithChildren, useMemo, useRef } from "react";

import { BadgeTooltip } from "@/components/ui/tooltip";

import { LinkWithViews, TagProps } from "@/lib/types";

import TagBadge from "./tagBadge";

function useOrganizedTags(tags: LinkWithViews["tags"]) {
  const searchParams = useSearchParams();

  const [primaryTag, additionalTags] = useMemo(() => {
    const filteredTagIds =
      searchParams?.get("tagIds")?.split(",")?.filter(Boolean) ?? [];

    const sortedTags =
      filteredTagIds.length > 0
        ? [...tags].sort(
            (a, b) =>
              filteredTagIds.indexOf(b.id) - filteredTagIds.indexOf(a.id),
          )
        : tags;

    return [sortedTags?.[0], sortedTags.slice(1)];
  }, [tags, searchParams]);

  return { primaryTag, additionalTags };
}

export function TagColumn({ link }: { link: LinkWithViews }) {
  const { tags } = link;

  const ref = useRef<HTMLDivElement>(null);

  const { primaryTag, additionalTags } = useOrganizedTags(tags);

  return (
    <div ref={ref} className="flex items-center gap-2 sm:gap-5">
      {primaryTag ? (
        <TagsTooltip additionalTags={additionalTags}>
          <TagButton tag={primaryTag} plus={additionalTags.length} />
        </TagsTooltip>
      ) : (
        <p>-</p>
      )}
    </div>
  );
}

function TagsTooltip({
  additionalTags,
  children,
}: PropsWithChildren<{ additionalTags: TagProps[] }>) {
  return !!additionalTags.length ? (
    <BadgeTooltip
      align="end"
      content={
        <div className="flex flex-wrap gap-1.5 p-3">
          {additionalTags.map((tag) => (
            <TagButton key={tag.id} tag={tag} />
          ))}
        </div>
      }
    >
      <div>{children}</div>
    </BadgeTooltip>
  ) : (
    children
  );
}

function TagButton({ tag, plus }: { tag: TagProps; plus?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTagIds =
    searchParams?.get("tagIds")?.split(",")?.filter(Boolean) ?? [];

  const handleClick = () => {
    const newTagIds = selectedTagIds.includes(tag.id)
      ? selectedTagIds.filter((id) => id !== tag.id)
      : [...selectedTagIds, tag.id];

    const params = new URLSearchParams(searchParams?.toString());

    if (newTagIds.length) {
      params.set("tagIds", newTagIds.join(","));
    } else {
      params.delete("tagIds");
    }

    router.push(`${pathname}?${params.toString()}`, undefined, {
      shallow: true,
    });
  };
  return (
    <button onClick={handleClick}>
      <TagBadge
        {...tag}
        withIcon
        plus={plus}
        isSelected={selectedTagIds.includes(tag.id)}
      />
    </button>
  );
}
