import { useCallback, useMemo, useState } from "react";

import { Check, Link2, Mail, SlidersHorizontal, Users, X } from "lucide-react";
import { useQueryState } from "nuqs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface AnalyticsFiltersProps {
  documentId: string;
  availableLinks?: Array<{ id: string; name: string }>;
  availableViewers?: Array<{ email: string; viewerId?: string }>;
}

export default function AnalyticsFilters({
  documentId,
  availableLinks = [],
  availableViewers = [],
}: AnalyticsFiltersProps) {
  const [linksSearch, setLinksSearch] = useState("");
  const [viewersSearch, setViewersSearch] = useState("");

  const [excludeInternal, setExcludeInternal] = useQueryState(
    "excludeInternal",
    {
      defaultValue: false,
      parse: (value) => value === "true",
      serialize: (value) => value.toString(),
    },
  );

  const [filterByViewer, setFilterByViewer] = useQueryState("filterByViewer", {
    defaultValue: "",
  });

  const [excludeLinks, setExcludeLinks] = useQueryState("excludeLinks", {
    defaultValue: "",
  });

  const [includeLinks, setIncludeLinks] = useQueryState("includeLinks", {
    defaultValue: "",
  });

  const [excludeViewers, setExcludeViewers] = useQueryState("excludeViewers", {
    defaultValue: "",
  });

  const excludedLinksList = useMemo(
    () => excludeLinks.split(",").filter(Boolean),
    [excludeLinks],
  );

  const includedLinksList = useMemo(
    () => includeLinks.split(",").filter(Boolean),
    [includeLinks],
  );

  const excludedViewersList = useMemo(
    () => excludeViewers.split(",").filter(Boolean),
    [excludeViewers],
  );

  const toggleIncludeLink = useCallback(
    (linkId: string) => {
      if (includedLinksList.includes(linkId)) {
        const newList = includedLinksList.filter((id) => id !== linkId);
        setIncludeLinks(newList.join(","));
      } else {
        setIncludeLinks([...includedLinksList, linkId].join(","));
      }
    },
    [includedLinksList, setIncludeLinks],
  );

  const toggleExcludeViewer = useCallback(
    (viewerEmail: string) => {
      if (excludedViewersList.includes(viewerEmail)) {
        const newList = excludedViewersList.filter(
          (email) => email !== viewerEmail,
        );
        setExcludeViewers(newList.join(","));
      } else {
        setExcludeViewers([...excludedViewersList, viewerEmail].join(","));
      }
    },
    [excludedViewersList, setExcludeViewers],
  );

  const clearAllFilters = useCallback(() => {
    setExcludeInternal(false);
    setFilterByViewer("");
    setIncludeLinks("");
    setExcludeLinks("");
    setExcludeViewers("");
  }, [
    setExcludeInternal,
    setFilterByViewer,
    setIncludeLinks,
    setExcludeLinks,
    setExcludeViewers,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      excludeInternal ||
      filterByViewer ||
      includeLinks ||
      excludeLinks ||
      excludeViewers,
    [
      excludeInternal,
      filterByViewer,
      includeLinks,
      excludeLinks,
      excludeViewers,
    ],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (excludeInternal) count++;
    if (filterByViewer) count++;
    if (includedLinksList.length > 0) count++;
    if (excludedLinksList.length > 0) count++;
    if (excludedViewersList.length > 0) count++;
    return count;
  }, [
    excludeInternal,
    filterByViewer,
    includedLinksList.length,
    excludedLinksList.length,
    excludedViewersList.length,
  ]);

  const getActiveFilterBadges = () => {
    const badges: JSX.Element[] = [];

    const renderBadge = (
      key: string,
      label: string,
      onRemove: (e: React.MouseEvent) => void,
    ) => (
      <div
        key={key}
        className="flex h-6 items-center overflow-hidden rounded-md border bg-background"
      >
        <span className="pl-2 pr-1 text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div className="h-full w-px bg-border" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className="flex h-full items-center justify-center px-1 text-muted-foreground transition-colors hover:bg-destructive/20"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );

    if (excludeInternal) {
      badges.push(
        renderBadge("internal", "Exclude internal", () =>
          setExcludeInternal(false),
        ),
      );
    }

    if (filterByViewer) {
      badges.push(
        renderBadge("viewer", `Viewer: ${filterByViewer}`, () =>
          setFilterByViewer(""),
        ),
      );
    }

    includedLinksList.forEach((linkId) => {
      const link = availableLinks.find((l) => l.id === linkId);
      if (link) {
        badges.push(
          renderBadge(`include-${linkId}`, `Link: ${link.name}`, () =>
            toggleIncludeLink(linkId),
          ),
        );
      }
    });

    excludedViewersList.forEach((email) => {
      badges.push(
        renderBadge(`exclude-${email}`, `Exclude: ${email}`, () =>
          toggleExcludeViewer(email),
        ),
      );
    });

    return badges;
  };

  return (
    <div className="!mt-2.5 flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <SlidersHorizontal className="mr-2 h-2 w-2" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <>
                <div className="mx-2 h-4 w-px bg-border" />
                <Badge variant="secondary" className="rounded-sm px-1 text-xs">
                  {activeFiltersCount}
                </Badge>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Internal visits filter */}
          <DropdownMenuItem
            onClick={() => setExcludeInternal(!excludeInternal)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Exclude internal visits
            </div>
            {excludeInternal && <Check className="h-4 w-4" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {availableLinks.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Link2 className="mr-2 h-4 w-4" />
                Links
                {includedLinksList.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {includedLinksList.length}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <div className="px-2 py-1">
                  <Input
                    placeholder="Search links..."
                    value={linksSearch}
                    onChange={(e) => setLinksSearch(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableLinks.filter(
                    (link) =>
                      linksSearch === "" ||
                      link.name
                        .toLowerCase()
                        .includes(linksSearch.toLowerCase()),
                  ).length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No results found.
                    </div>
                  ) : (
                    availableLinks
                      .filter(
                        (link) =>
                          linksSearch === "" ||
                          link.name
                            .toLowerCase()
                            .includes(linksSearch.toLowerCase()),
                      )
                      .map((link) => (
                        <DropdownMenuItem
                          key={link.id}
                          onClick={() => toggleIncludeLink(link.id)}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{link.name}</span>
                          {includedLinksList.includes(link.id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </DropdownMenuItem>
                      ))
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {availableViewers.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Mail className="mr-2 h-4 w-4" />
                Exclude viewers
                {excludedViewersList.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {excludedViewersList.length}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <div className="px-2 py-1">
                  <Input
                    placeholder="Search viewers..."
                    value={viewersSearch}
                    onChange={(e) => setViewersSearch(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableViewers.filter(
                    (viewer) =>
                      viewersSearch === "" ||
                      viewer.email
                        .toLowerCase()
                        .includes(viewersSearch.toLowerCase()),
                  ).length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No results found.
                    </div>
                  ) : (
                    availableViewers
                      .filter(
                        (viewer) =>
                          viewersSearch === "" ||
                          viewer.email
                            .toLowerCase()
                            .includes(viewersSearch.toLowerCase()),
                      )
                      .map((viewer) => (
                        <DropdownMenuItem
                          key={viewer.email}
                          onClick={() => toggleExcludeViewer(viewer.email)}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{viewer.email}</span>
                          {excludedViewersList.includes(viewer.email) && (
                            <Check className="h-4 w-4" />
                          )}
                        </DropdownMenuItem>
                      ))
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={(e) => e.preventDefault()} className="p-0">
            <div className="flex w-full items-center p-2">
              <Mail className="mr-2 h-4 w-4" />
              <Input
                placeholder="Filter by viewer email..."
                value={filterByViewer}
                onChange={(e) => setFilterByViewer(e.target.value)}
                className="h-7 flex-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </DropdownMenuItem>

          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear all filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {getActiveFilterBadges()}
        </div>
      )}
    </div>
  );
}
