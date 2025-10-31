import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import { useDataroom } from "@/lib/swr/use-dataroom";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import DeleteDataroom from "@/components/datarooms/settings/delete-dataroooom";
import DuplicateDataroom from "@/components/datarooms/settings/duplicate-dataroom";
import SettingsTabs from "@/components/datarooms/settings/settings-tabs";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function Settings() {
  const { dataroom } = useDataroom();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const [isCopied, setIsCopied] = useState(false);

  const { isBusiness, isDatarooms, isDataroomsPlus } = usePlan();

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        {/* Settings */}
        <div className="mx-auto grid w-full gap-2">
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <SettingsTabs dataroomId={dataroom.id} />
          <div className="grid gap-6">
            <Form
              title="Dataroom Name"
              description="This is the name of your data room on Papermark."
              inputAttrs={{
                name: "name",
                placeholder: "My Dataroom",
                maxLength: 156,
              }}
              defaultValue={dataroom.name}
              helpText="Max 156 characters"
              handleSubmit={(updateData) =>
                fetch(`/api/teams/${teamId}/datarooms/${dataroom.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updateData),
                }).then(async (res) => {
                  if (res.status === 200) {
                    await Promise.all([
                      mutate(`/api/teams/${teamId}/datarooms`),
                      mutate(`/api/teams/${teamId}/datarooms/${dataroom.id}`),
                    ]);
                    toast.success("Successfully updated dataroom name!");
                  } else {
                    const { error } = await res.json();
                    toast.error(error.message);
                  }
                })
              }
            />
            <Form
              title="Show Last Updated"
              description="Display the last updated date on your dataroom banner."
              inputAttrs={{
                name: "showLastUpdated",
                type: "checkbox",
                placeholder: "Show last updated date",
              }}
              defaultValue={String(dataroom.showLastUpdated ?? true)}
              helpText="When enabled, visitors will see when the dataroom was last updated."
              handleSubmit={(updateData) =>
                fetch(`/api/teams/${teamId}/datarooms/${dataroom.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    showLastUpdated: updateData.showLastUpdated === "true",
                  }),
                }).then(async (res) => {
                  if (res.status === 200) {
                    await Promise.all([
                      mutate(`/api/teams/${teamId}/datarooms`),
                      mutate(`/api/teams/${teamId}/datarooms/${dataroom.id}`),
                    ]);
                    toast.success("Successfully updated display settings!");
                  } else {
                    const { error } = await res.json();
                    toast.error(error.message);
                  }
                })
              }
            />
            <DuplicateDataroom dataroomId={dataroom.id} teamId={teamId} />
            <Card className="bg-transparent">
              <CardHeader>
                <CardTitle>Dataroom ID</CardTitle>
                <CardDescription>
                  Unique ID of your dataroom on Papermark.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="relative w-full max-w-md">
                    <Input
                      value={dataroom.id}
                      className="pr-10 font-mono"
                      readOnly
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(dataroom.id);
                        toast.success("Dataroom ID copied to clipboard");
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-6">
                <p className="text-sm text-muted-foreground transition-colors">
                  Used to identify your dataroom when interacting with the
                  Papermark API.
                </p>
              </CardFooter>
            </Card>

            {isBusiness || isDatarooms || isDataroomsPlus ? (
              <DeleteDataroom
                dataroomId={dataroom.id}
                dataroomName={dataroom.name}
              />
            ) : null}
            {/* <Card>
                  <CardHeader className="relative">
                    <CardTitle>Feedback Question</CardTitle>
                    <CardDescription>
                      This question will be shown to visitors after the last
                      page of your document.
                    </CardDescription>
                    <div className="absolute right-8 top-6">
                      <span
                        className="relative ml-auto flex h-4 w-4"
                        title={`Feedback is ${feedback?.enabled ? "" : "not"} active`}
                      >
                        <span
                          className={cn(
                            "absolute inline-flex h-full w-full rounded-full opacity-75",
                            feedback?.enabled
                              ? "animate-ping bg-green-400"
                              : "",
                          )}
                        />
                        <span
                          className={cn(
                            "relative inline-flex rounded-full h-4 w-4",
                            feedback?.enabled ? "bg-green-500" : "bg-red-500",
                          )}
                        />
                      </span>
                      <span className="sr-only">
                        {feedback?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </CardHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (value == "" || isNotBusiness) return null;

                      setLoading(true);

                      try {
                        const response = await fetch(
                          `/api/teams/${teamId}/documents/${id}/feedback`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ questionText: value }),
                          },
                        );

                        if (response.status === 200) {
                          await mutate(
                            `/api/teams/${teamId}/documents/${id}/feedback`,
                          );
                          toast.success(
                            "Successfully added a feedback question!",
                          );
                        } else {
                          const { error } = await response.json();
                          toast.error(error.message);
                        }
                      } catch (error) {
                        // Handle any errors that might occur during fetch
                        toast.error(
                          "An error occurred while adding the question.",
                        );
                        console.error("Fetch error:", error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <CardContent>
                      <div className="grid w-full items-start gap-6 overflow-x-visible pb-4 pt-0">
                        <div className="grid gap-3">
                          <Label>Question Type</Label>
                          <Select defaultValue="yes-no">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes-no">Yes / No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="question">Question</Label>
                          <Input
                            id="question"
                            type="text"
                            name="question"
                            required={!isNotBusiness}
                            placeholder="Are you interested?"
                            value={value || ""}
                            onChange={(e) => setValue(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t py-3 bg-muted rounded-b-lg justify-end gap-x-2">
                      {feedback ? (
                        <Button
                          type="button"
                          variant="outline"
                          loading={loadingStatus}
                          onClick={async (e) => {
                            try {
                              e.preventDefault();
                              setLoadingStatus(true);

                              const response = await fetch(
                                `/api/teams/${teamId}/documents/${id}/feedback`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    enabled: !feedback?.enabled,
                                  }),
                                },
                              );

                              if (response.status === 200) {
                                await mutate(
                                  `/api/teams/${teamId}/documents/${id}/feedback`,
                                );
                                toast.success(
                                  `${feedback?.enabled ? "Turned off" : "Turned on"} feedback question`,
                                );
                              } else {
                                const { error } = await response.json();
                                toast.error(error.message);
                              }
                            } catch (error) {
                              // Handle any errors that might occur during fetch
                              toast.error("An error occurred.");
                              console.error("Fetch error:", error);
                            } finally {
                              setLoadingStatus(false);
                            }
                          }}
                        >
                          {feedback?.enabled ? "Turn off" : "Turn on"}
                        </Button>
                      ) : null}
                      {isNotBusiness ? (
                        <UpgradePlanModal
                          clickedPlan={"Business"}
                          trigger={"feedback_question"}
                        >
                          <Button type="submit" loading={loading}>
                            {feedback ? "Update question" : "Create question"}
                          </Button>
                        </UpgradePlanModal>
                      ) : (
                        <Button type="submit" loading={loading}>
                          {feedback ? "Update question" : "Create question"}
                        </Button>
                      )}
                    </CardFooter>
                  </form>
                </Card> */}
            {/* <Card className="border-red-500">
              <CardHeader>
                <CardTitle>Delete Document</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This actions deletes the document and any associates links and
                  analytics.
                </p>
              </CardContent>
              <CardFooter className="justify-end rounded-b-lg border-t border-red-500 px-6 py-3">
                <Button variant="destructive">Delete document</Button>
              </CardFooter>
            </Card> */}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
