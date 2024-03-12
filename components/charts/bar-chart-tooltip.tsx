import { getColorForVersion, timeFormatter } from "./utils";
import { useDocumentThumbnail } from "@/lib/swr/use-document";
import { useRouter } from "next/router";

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
  const { data, error } = useDocumentThumbnail(pageNumber, documentId);

  const imageUrl = data && !error ? data.imageUrl : null; // Always called, regardless of `active` or `payload`

  if (!active || !payload || payload.length === 0) return null;

  return (
    <>
      <div className="bg-tremor-background dark:bg-dark-tremor-background border border-tremor-border dark:border-dark-tremor-border rounded-md w-52 text-sm leading-6">
        <div className="py-2 px-2.5 bg-tremor-background dark:bg-dark-tremor-background border-b border-tremor-border dark:border-dark-tremor-border rounded-t-md">
          <p className="text-tremor-content dark:text-dark-tremor-content font-medium">
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
            className="py-2 px-2.5 justify-between items-center w-full flex space-x-4"
            key={idx}
          >
            <div className="whitespace-nowrap overflow-hidden text-overflow-ellipsis items-center flex space-x-2">
              <span
                className={`bg-${getColorForVersion(item.dataKey)}-500 rounded-full flex-shrink-0 w-2.5 h-2.5`}
                aria-hidden="true"
              ></span>
              <p className="text-tremor-content dark:text-dark-tremor-content whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                {item.dataKey}
              </p>
            </div>
            <p className="text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis font-medium">
              {timeFormatter(item.value)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default CustomTooltip;
