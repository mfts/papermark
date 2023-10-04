import { usePlausible } from "next-plausible";
import { useRouter } from "next/router";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";


export function AddTeamModal({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const plausible = usePlausible();
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: handle team creation
  }

  return (
    <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="text-foreground bg-background">
          <DialogHeader>
            <DialogTitle>Create a Team</DialogTitle>
            <DialogDescription>
            <div className="py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                Start by naming your new team and inviting team members.
              </p>
            </div>
            <form 
              onSubmit={handleCreateTeam} 
              className="flex flex-col gap-8 mt-4"
            >   
              <div className="flex flex-col gap-3">
                <div>
                  <Label>Team name</Label>
                </div>
                <div>
                  <Input 
                    placeholder="Enter team's name"
                    onChange={(e) => setTeamName(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full lg:w-1/2"
                  loading={loading}
                  // disabled={uploading || !currentFile}
                >
                  Create
                  {/* {uploading ? "Uploading..." : "Upload Document"} */}
                </Button>
              </div>
            </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
    </Dialog>
  )
}