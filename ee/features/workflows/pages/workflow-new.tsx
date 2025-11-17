import { useState } from "react";
import { useRouter } from "next/router";
import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Domain {
  id: string;
  slug: string;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<string>("papermark.com");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: domains } = useSWR<Domain[]>(
    teamId ? `/api/teams/${teamId}/domains` : null,
    fetcher,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    if (domain !== "papermark.com" && !slug.trim()) {
      toast.error("Entry link slug is required for custom domains");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/workflows?teamId=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          domain: domain === "papermark.com" ? undefined : domain,
          slug: domain === "papermark.com" ? undefined : slug.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create workflow");
      }

      const workflow = await response.json();
      toast.success("Workflow created successfully");
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create workflow",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Create Workflow
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up a new routing workflow with an entry link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Client Dashboard Routing"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Entry Link</h3>
              <p className="text-sm text-muted-foreground">
                This is the single URL visitors will use to access the workflow
              </p>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="papermark.com (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="papermark.com">papermark.com</SelectItem>
                    {domains?.map((d) => (
                      <SelectItem key={d.id} value={d.slug}>
                        {d.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {domain !== "papermark.com" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) =>
                        setSlug(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                        )
                      }
                      placeholder="dashboard"
                      pattern="[a-z0-9_-]+"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Entry URL: {domain}/{slug || "your-slug"}
                    </p>
                  </div>
                </>
              )}

              {domain === "papermark.com" && (
                <p className="text-xs text-muted-foreground">
                  Entry URL will be generated automatically (e.g., papermark.com/view/clxxx...)
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Workflow"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}

