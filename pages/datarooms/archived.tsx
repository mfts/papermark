import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect } from "react";

import { EmptyArchivedDataroom } from "@/components/datarooms/empty-archived-dataroom";
import { EmptyDataroom } from "@/components/datarooms/empty-dataroom";
import AppLayout from "@/components/layouts/app";
import { NavMenu } from "@/components/navigation-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import useArchivedDatarooms from "@/lib/swr/use-archived-datarooms";
import { usePlan } from "@/lib/swr/use-billing";

export default function ArchivedDataroomsPage() {
  const router = useRouter();
  const { plan, trial } = usePlan();
  const { archivedDatarooms } = useArchivedDatarooms();

  useEffect(() => {
    if (trial == null && plan == "free") router.push("/documents");
  }, [trial, plan, router]);

  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:px-4 sm:py-4">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Archived Datarooms
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              View your archived datarooms
            </p>
          </div>
        </section>

        <NavMenu
          navigation={[
            {
              label: "Datarooms",
              href: `/datarooms`,
              segment: "X", // Added X because it was causing a conflict with the segment (active tab)
            },
            {
              label: "Archived",
              href: `/datarooms/archived`,
              segment: "archived",
            },
          ]}
        />

        <div className="mt-8 space-y-4">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
            {archivedDatarooms &&
              archivedDatarooms.map((dataroom) => (
                <Link key={dataroom.id} href={`/datarooms/${dataroom.id}`}>
                  <Card className="group relative overflow-hidden duration-500 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="truncate">
                          {dataroom.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="divide-y divide-gray-100 text-sm leading-6">
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
                        <div className="flex justify-between gap-x-4 py-3">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Views
                          </dt>
                          <dd className="flex items-start gap-x-2">
                            <div className="font-medium text-gray-900 dark:text-gray-200">
                              {dataroom._count.views ?? 0}
                            </div>
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </ul>

          {archivedDatarooms && archivedDatarooms.length === 0 && (
            <div className="flex items-center justify-center">
              <EmptyArchivedDataroom />
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
