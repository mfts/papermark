import { AddDataroomModal } from "@/components/datarooms/add-dataroom-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useDatarooms from "@/lib/swr/use-datarooms";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default function DataroomsPage() {
  const { datarooms } = useDatarooms();

  return (
    <AppLayout>
      <main className="p-4 sm:py-4 sm:px-4 sm:m-4">
        <section className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl text-foreground font-semibold tracking-tight">
              Datarooms
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your datarooms
            </p>
          </div>
          <div className="flex items-center gap-x-1">
            <AddDataroomModal>
              <Button
                className="flex-1 text-left group flex gap-x-3 items-center justify-start px-3"
                title="Add New Document"
              >
                <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Create New Dataroom</span>
              </Button>
            </AddDataroomModal>
          </div>
          {/* </div> */}
        </section>

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-4">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
            {datarooms &&
              datarooms.map((dataroom) => (
                <Link key={dataroom.id} href={`/datarooms/${dataroom.id}`}>
                  <Card className="hover:border-primary/50 group relative overflow-hidden duration-500 ">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="truncate">
                          {dataroom.name}
                        </CardTitle>
                      </div>
                      <CardDescription>{dataroom.pId}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="divide-y divide-gray-100 text-sm leading-6 ">
                        <div className="flex justify-between gap-x-4 py-3">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Documents
                          </dt>
                          <dd className="flex items-start gap-x-2">
                            <div className="font-medium text-gray-900 dark:text-gray-200">
                              {dataroom._count.documents ?? 0}
                            </div>
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </ul>
        </div>
      </main>
    </AppLayout>
  );
}
