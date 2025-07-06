import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  ArrowLeftIcon,
  CopyIcon,
  FileTextIcon,
  FolderIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import useDataroomTemplates, {
  DataroomTemplate,
} from "@/lib/swr/use-dataroom-templates";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export function UseTemplateModal({
  children,
  template,
  open,
  setOpen,
  onTemplateCreated,
}: {
  children?: React.ReactNode;
  template?: DataroomTemplate;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onTemplateCreated?: (dataroomId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DataroomTemplate | null>(template || null);
  const [dataroomName, setDataroomName] = useState("");

  const { templates, loading: templatesLoading } = useDataroomTemplates();
  const router = useRouter();
  const teamInfo = useTeam();

  const handleUseTemplate = async () => {
    if (!selectedTemplate || !teamInfo?.currentTeam?.id) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/datarooms/duplicate-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            name: dataroomName || `${selectedTemplate.name}`,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.info === "trial_limit_reached") {
          window.location.replace("/datarooms");
        }
        throw new Error(
          errorData.message || "Failed to create dataroom from template",
        );
      }

      const newDataroom = await response.json();
      mutate(`/api/teams/${teamInfo.currentTeam.id}/datarooms`);

      const modalOpen = open !== undefined ? open : isOpen;
      if (open !== undefined && setOpen) {
        setOpen(false);
      } else {
        setIsOpen(false);
      }

      toast.success("Dataroom created successfully from template!");

      if (onTemplateCreated) {
        onTemplateCreated(newDataroom.id);
      } else {
        router.push(`/datarooms/${newDataroom.id}/documents`);
      }
    } catch (error) {
      console.error("Error creating dataroom from template:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create dataroom from template",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setSelectedTemplate(null);
    setDataroomName("");
  };

  const modalOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = open !== undefined && setOpen ? setOpen : setIsOpen;

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] max-w-2xl">
        <DialogHeader>
          {selectedTemplate ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="h-8 min-w-8 p-0"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <DialogTitle className="line-clamp-1">{`Use ${selectedTemplate.name}`}</DialogTitle>
            </div>
          ) : (
            <DialogTitle>Use Template</DialogTitle>
          )}
          <DialogDescription>
            {selectedTemplate
              ? "Configure your new dataroom settings"
              : "Choose a template to quickly create your dataroom with pre-built structure and documents."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedTemplate && (
            <div>
              <Label className="text-sm font-medium">Select Template</Label>
              <ScrollArea className="mt-2 max-h-80 w-full rounded-md border p-4">
                {templatesLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="text-sm text-muted-foreground">
                      Loading templates...
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {templates.map((tmpl) => (
                      <Card
                        key={tmpl.id}
                        className="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-muted/50"
                        onClick={() => setSelectedTemplate(tmpl)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{tmpl.name}</h4>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          {selectedTemplate && (
            <>
              <Card className="border-primary/50">
                <CardHeader className="p-4">
                  <CardTitle className="line-clamp-2 text-lg">
                    {selectedTemplate.name}
                  </CardTitle>
                </CardHeader>
              </Card>
              <div className="space-y-2">
                <Label htmlFor="dataroom-name">Dataroom Name</Label>
                <Input
                  id="dataroom-name"
                  placeholder={`${selectedTemplate.name}`}
                  value={dataroomName}
                  onChange={(e) => setDataroomName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default name: &quot;{selectedTemplate.name}
                  &quot;
                </p>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            {selectedTemplate && (
              <Button
                onClick={handleUseTemplate}
                disabled={isLoading}
                loading={isLoading}
                className="flex items-center gap-2"
              >
                Create Dataroom
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
