import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { AddWebhookModal } from "@/components/webhooks/add-webhook-modal";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { Webhook } from "lucide-react";
import useWebhooks from "@/lib/swr/use-webhooks";
import { Skeleton } from "@/components/ui/skeleton";
import { WebhookTable } from "@/components/webhooks/webhook-table";

export default function Webhooks() {
  const { webhooks } = useWebhooks();

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl text-foreground font-semibold tracking-tight">
              Webhooks
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your Webhooks
            </p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddWebhookModal>
              <Button>Add New Webhook</Button>
            </AddWebhookModal>
          </ul>
        </div>

        <Separator className="my-6 bg-gray-200 dark:bg-gray-800" />

        {webhooks && webhooks.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <EmptyWebhooks />
          </div>
        ) : (
          <WebhookTable webhooks={webhooks || []} />
        )}
      </div>
    </AppLayout>
  );
}

export function EmptyWebhooks() {
  const [openModal, setOpenModal] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center">
      <Webhook className="h-16 w-16" />
      <h3 className="mt-2 text-sm font-medium text-foreground">No webhooks</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new webhook.
      </p>
      <div className="mt-6">
        <AddWebhookModal>
          <Button onClick={() => setOpenModal(true)}>
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Webhook
          </Button>
        </AddWebhookModal>
      </div>
    </div>
  );
}
