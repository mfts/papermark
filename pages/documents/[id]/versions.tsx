import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { ArrowLeft, Loader2 } from "lucide-react";

import { DocumentVersionManager } from "@/components/documents/document-version-manager";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";

export default function DocumentVersionsPage() {
  const router = useRouter();
  const { id: documentId } = router.query as { id: string };
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);
    const handleRouteChangeComplete = () => setIsNavigating(false);
    const handleRouteChangeError = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]);

  const handleBack = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      if (window.history.length > 1) {
        router.back();
      } else {
        await router.push("/documents");
      }
    } catch (error) {
      await router.push("/documents");
    }
  };

  if (!documentId) {
    return null;
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 lg:mx-7 xl:mx-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isNavigating}
            className="mb-4"
          >
            {isNavigating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            {isNavigating ? "Going back..." : "Back"}
          </Button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Version Management
            </h1>
            <p className="text-muted-foreground">
              Manage different versions of your document
            </p>
          </div>
        </div>
        <DocumentVersionManager documentId={documentId} />
      </main>
    </AppLayout>
  );
}
