import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { useDomainLink } from "@/lib/swr/use-link";
import NotFound from "@/pages/404";
import { useSession } from "next-auth/react";

export default function ViewPage() {
  const { link, error } = useDomainLink();
  const { data: session, status } = useSession();

  if (error && error.status === 404) {
    return <NotFound />;
  }

  if (!link || status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  const {
    expiresAt,
    emailProtected,
    password: linkPassword,
    isArchived,
  } = link;

  const { email: userEmail } = session?.user || {};

  // If the link is expired, show a 404 page
  if (expiresAt && new Date(expiresAt) < new Date()) {
    <NotFound message="Sorry, the link you're looking for is expired." />;
  }

  if (isArchived) {
    return (
      <NotFound message="Sorry, the file you're looking for is archived." />
    );
  }

  if (emailProtected || linkPassword) {
    return (
      <DocumentView link={link} userEmail={userEmail} isProtected={true} />
    );
  }

  return <DocumentView link={link} userEmail={userEmail} isProtected={false} />;
}
