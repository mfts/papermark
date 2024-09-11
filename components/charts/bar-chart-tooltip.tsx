import { useRouter } from "next/router";

import { useDocumentThumbnail } from "@/lib/swr/use-document";

import { getColorForVersion, timeFormatter } from "./utils";

const CustomTooltip = ({
  payload,
  active,
}: {
  payload: any;
  active: boolean | undefined;
}) => {
  const router = useRouter(); // Call useRouter at the top level
  const documentId = router.query.id as string;

  // Default pageNumber to 0 or a sensible default if payload is not available
  const pageNumber =
    payload && payload.length > 0 ? parseInt(payload[0].payload.pageNumber) : 0;

  // Default versionNumber to 0 or a sensible default if payload is not available
  const versionNumber =
    payload && payload.length > 0
      ? parseInt(payload[0].payload.versionNumber)
      : 1;
  const { data, error } = useDocumentThumbnail(
    pageNumber,
    documentId,
    versionNumber,
  );

  const imageUrl = data && !error ? data.imageUrl : null; // Always called, regardless of `active` or `payload`

  if (!active || !payload || payload.length === 0) return null;

  return (
    <>
      <div className="w-52 rounded-md border border-tremor-border bg-tremor-background text-sm leading-6 dark:border-dark-tremor-border dark:bg-dark-tremor-background">
        <div className="rounded-t-md border-b border-tremor-border bg-tremor-background px-2.5 py-2 dark:border-dark-tremor-border dark:bg-dark-tremor-background">
          <p className="font-medium text-tremor-content dark:text-dark-tremor-content">
            Page {payload[0].payload.pageNumber}
          </p>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Page ${payload[0].payload.pageNumber} Thumbnail`}
            />
          ) : null}
        </div>
        {payload.map((item: any, idx: number) => (
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
