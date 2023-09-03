import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export function AddDomainModal({
  onAddition,
  children,
}: {
  onAddition: (newDomain: string) => void;
  children: React.ReactNode;
}) {
  const [domain, setDomain] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (domain == "") return;

    setLoading(true);
    const response = await fetch("/api/domains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setLoading(false);
      setOpen(false);
      toast.error(error);
    }

    const newDomain = await response.json();

    // console.log(newDomain);

    // Update local data with the new link
    onAddition(newDomain);

    setOpen(false);

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Domain</DialogTitle>
          <DialogDescription>
            You can easily add a custom domain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">
                Domain
              </Label>
              <Input
                id="domain"
                placeholder="yourdomain.com"
                className="col-span-3"
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add domain</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
