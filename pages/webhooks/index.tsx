import Sidebar from "@/components/Sidebar";
import useDocuments from "@/lib/swr/use-documents";
import DocumentCard from "@/components/documents/document-card";
import Skeleton from "@/components/Skeleton";
import { PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app"
import { Button } from "@/components/ui/button";
import { Webhook } from "lucide-react";


export default function Documents() {
  // const { documents } = useDocuments();

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl text-foreground font-semibold tracking-tight">
              Webhooks
            </h2>
            <p className="text-sm text-muted-foreground">Manage your Webhooks</p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddDocumentModal>
              <Button>Add New Webhook</Button>
            </AddDocumentModal>
          </ul>
        </div>

        <Separator className="my-6 bg-gray-200 dark:bg-gray-800" />


          <div className="flex items-center justify-center h-96">
            <EmptyWebhooks />
          </div>

        {/* {documents && documents.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <EmptyWebhooks />
          </div>
        )} */}

        {/* Documents list */}
        {/* <ul role="list" className="space-y-4">
          {documents
            ? documents.map((document) => {
                return <DocumentCard key={document.id} document={document} />;
              })
            : Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
                >
                  <Skeleton key={i} className="h-5 w-20" />
                  <Skeleton key={i} className="mt-3 h-3 w-10" />
                </li>
              ))}
        </ul> */}
      </div>
    </AppLayout>
  );
}

export function EmptyWebhooks() {
  return (
    <div className="flex flex-col items-center">
      <Webhook className="h-16 w-16" />
      <h3 className="mt-2 text-sm font-medium text-foreground">No webhooks</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new webhook.
      </p>
      <div className="mt-6">
        <AddDocumentModal>
          <Button>
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Webhook
          </Button>
        </AddDocumentModal>
      </div>
    </div>
  );
}
