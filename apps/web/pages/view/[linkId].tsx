import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { useLink } from "@/lib/swr/use-link";
import NotFound from "@/pages/404";

export default function ViewPage() {
  const { link, error } = useLink();

  if (error && error.status === 404) {
    return <NotFound />;
  }

  if (!link) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="mr-1 h-20 w-20" />
      </div>
    );
  }

  return <DocumentView link={link} error={error} />;
}
