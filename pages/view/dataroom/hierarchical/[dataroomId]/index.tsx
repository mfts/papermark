import LoadingSpinner from "@/components/ui/loading-spinner";
import DataroomSinglePageView from "@/components/view/datarooms/paged";
import { useDataroom, useHierarchicalDataroom } from "@/lib/swr/use-dataroom";
import NotFound from "@/pages/404";
import { useSession } from "next-auth/react";

export default function ViewHierarchicalDataroom() {
  const { dataroom, authenticationCode, error } = useHierarchicalDataroom();
  const { data: session, status } = useSession();
  
  if (error && error.status === 404) {
    return <NotFound />;
  }

  if (!dataroom || status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  const { emailProtected, password: linkPassword } = dataroom;

  const { email: userEmail } = session?.user || {};

  if (emailProtected || linkPassword) {
    return (
      <DataroomSinglePageView dataroom={dataroom} userEmail={userEmail} isProtected={true} authenticationCode={authenticationCode} />
    );
  }

  return <DataroomSinglePageView dataroom={dataroom} userEmail={userEmail} isProtected={false} authenticationCode={authenticationCode} />;
}
