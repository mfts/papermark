import { useState } from "react";

import { DataroomTemplate } from "@/lib/swr/use-dataroom-templates";
import { DEFAULT_BANNER_IMAGE } from "@/lib/utils";

import { UseTemplateModal } from "@/components/datarooms/use-template-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TemplateCard({
  template,
  onTemplateCreated,
}: {
  template: DataroomTemplate;
  onTemplateCreated?: (dataroomId: string) => void;
}) {
  const [useTemplateModalOpen, setUseTemplateModalOpen] = useState(false);

  return (
    <Card className="group relative overflow-hidden duration-500 hover:border-primary/50">
      <div className="aspect-[3/1.3] w-full">
        <div
          className="h-full w-full rounded-t bg-slate-100 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${template.brand?.banner || DEFAULT_BANNER_IMAGE})`,
          }}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex min-w-0 flex-1 items-start justify-between">
          <CardTitle className="line-clamp-2 text-lg leading-tight">
            {template.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <UseTemplateModal
          open={useTemplateModalOpen}
          setOpen={setUseTemplateModalOpen}
          template={template}
          onTemplateCreated={onTemplateCreated}
        >
          <Button className="w-full cursor-pointer" variant="outline">
            Use Template
          </Button>
        </UseTemplateModal>
      </CardContent>
    </Card>
  );
}
