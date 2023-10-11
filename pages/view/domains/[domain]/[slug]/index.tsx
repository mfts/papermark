import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { useDomainLink } from "@/lib/swr/use-link";

export default function ViewPage() {
  const { link, error } = useDomainLink();

  if (!link) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="mr-1 h-20 w-20" />
      </div>
    );
  }

  return <DocumentView link={link} error={error} />;
}
