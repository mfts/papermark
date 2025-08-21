import { useRouter } from "next/router";

import { useDocumentThumbnail } from "@/lib/swr/use-document";

import { getColorForVersion, timeFormatter } from "./utils";

const CustomTooltip = ({
  payload,
  active,
  documentId: propDocumentId,
}: {
  payload: any;
  active: boolean | undefined;
  documentId?: string;
}) => {
  const router = useRouter(); // Call useRouter at the top level
  // Use prop documentId if provided, otherwise fall back to router
  const documentId = propDocumentId || (router.query.id as string);

  // Safely extract pageNumber and versionNumber with validation
  const pageNumberStr =
    payload && payload.length > 0 ? payload[0]?.payload?.pageNumber : null;

  const pageNumber = pageNumberStr ? parseInt(pageNumberStr, 10) : 0;
  // For thumbnails, don't specify version number - let the API use the primary/latest version
  const versionNumber = undefined;

  // Only fetch thumbnail if we have valid documentId and pageNumber
  const shouldFetchThumbnail =
    documentId && pageNumber > 0 && !isNaN(pageNumber);

  // Always call the hook - this is required by React rules of hooks
  const { data, error, loading } = useDocumentThumbnail(
    shouldFetchThumbnail ? pageNumber : 0, // Pass 0 to disable the hook if invalid
    documentId || "",
    versionNumber, // undefined means use primary/latest version
  );

  const imageUrl =
    shouldFetchThumbnail && data && !error ? data.imageUrl : null;

  // Early return after hooks are called
  if (!active || !payload || payload.length === 0) return null;

  return (
    <>
      <div className="w-52 rounded-md border border-tremor-border bg-tremor-background text-sm leading-6 dark:border-dark-tremor-border dark:bg-dark-tremor-background">
        <div className="rounded-t-md border-b border-tremor-border bg-tremor-background px-2.5 py-2 dark:border-dark-tremor-border dark:bg-dark-tremor-background">
          <p className="font-medium text-tremor-content dark:text-dark-tremor-content">
            Page {pageNumber || "Unknown"}
          </p>
          {shouldFetchThumbnail && (
            <>
              {loading && (
                <div className="mt-2 flex items-center justify-center p-4">
                  <div className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                    Loading thumbnail...
                  </div>
                </div>
              )}
              {imageUrl && !loading && (
                <img
                  src={imageUrl}
                  alt={`Page ${pageNumber} Thumbnail`}
                  className="mt-2 max-w-full"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              {error && !loading && (
                <div className="mt-2 text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                  Thumbnail unavailable
                </div>
              )}
            </>
          )}
        </div>
        {payload
          .filter(
            (item: any) =>
              // Only show items that are not metadata fields
              item.dataKey !== "versionNumber" &&
              item.dataKey !== "pageNumber" &&
              typeof item.value === "number" &&
              item.value > 0,
          )
          .map((item: any, idx: number) => (
            <div
              className="flex w-full items-center justify-between space-x-4 px-2.5 py-2"
              key={idx}
            >
              <div className="text-overflow-ellipsis flex items-center space-x-2 overflow-hidden whitespace-nowrap">
                <span
                  className={`bg-${getColorForVersion(item.dataKey)}-500 h-2.5 w-2.5 flex-shrink-0 rounded-full`}
                  aria-hidden="true"
                ></span>
                <p className="text-overflow-ellipsis overflow-hidden whitespace-nowrap text-tremor-content dark:text-dark-tremor-content">
                  {item.dataKey}
                </p>
              </div>
              <p className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                {timeFormatter(item.value)}
              </p>
            </div>
          ))}
      </div>
    </>
  );
};

export default CustomTooltip;
