import { useSearchParams } from "next/navigation";

import { PropsWithChildren, useMemo, useRef } from "react";
import { useQueryState } from "nuqs";

import { LinkWithViews, TagColorProps, TagProps } from "@/lib/types";



import { BadgeTooltip } from "@/components/ui/tooltip";

import TagBadge from "./tag-badge";


function useOrganizedTags(tags: LinkWithViews["tags"]) {
  const searchParams = useSearchParams();

  const [primaryTag, additionalTags] = useMemo(() => {
    const filteredTagNames =
      searchParams?.get("tags")?.split(",")?.filter(Boolean) ?? [];

    const sortedTags =
      filteredTagNames.length > 0
        ? [...tags].sort(
            (a, b) =>
              filteredTagNames.indexOf(b.name) -
              filteredTagNames.indexOf(a.name),
          )
        : tags;

    return [sortedTags?.[0], sortedTags.slice(1)];
  }, [tags, searchParams]);

  return { primaryTag, additionalTags };
}

export function TagColumn({
  link,
  onClose,
}: {
  link: LinkWithViews;
  onClose?: () => void;
}) {
  const { tags } = link;

  const ref = useRef<HTMLDivElement>(null);

  const { primaryTag, additionalTags } = useOrganizedTags(tags);

  return (
    <div ref={ref} className="flex items-center gap-2 sm:gap-5">
      {primaryTag ? (
        <TagsTooltip additionalTags={additionalTags} onClose={onClose}>
          <TagButton
            tag={primaryTag}
            plus={additionalTags.length}
            onClose={onClose}
          />
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
  onClose,
}: PropsWithChildren<{ additionalTags: TagProps[]; onClose?: () => void }>) {
  return !!additionalTags.length ? (
    <BadgeTooltip
      align="end"
      content={
        <div className="flex flex-wrap gap-1.5 rounded-md p-1">
          {additionalTags.map((tag) => (
            <TagButton key={tag.id} tag={tag} onClose={onClose} />
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

function TagButton({
  tag,
  plus,
  onClose,
}: {
  tag: TagProps;
  plus?: number;
  onClose?: () => void;
}) {
  const [tags, setTags] = useQueryState<string[]>("tags", {
    parse: (value: string) => value.split(",").filter(Boolean),
    serialize: (value: string[]) => value.join(","),
  });

  const selectedTagNames = useMemo(() => tags ?? [], [tags]);

  const handleClick = () => {
    const newTagNames = selectedTagNames.includes(tag.name)
      ? selectedTagNames.filter((name: string) => name !== tag.name)
      : [...selectedTagNames, tag.name];

    if (newTagNames.length === 0) {
      setTags(null);
    } else {
      setTags(newTagNames);
    }
    onClose?.();
  };

  return (
    <button onClick={handleClick}>
      <TagBadge
        {...tag}
        color={tag.color as TagColorProps}
        withIcon
        plus={plus}
        isSelected={selectedTagNames.includes(tag.name)}
      />
    </button>
  );
}