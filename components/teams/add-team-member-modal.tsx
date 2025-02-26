import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

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

import { useAnalytics } from "@/lib/analytics";
import useDatarooms from "@/lib/swr/use-datarooms";

import SelectField from "../team-role/SelectField";
import { USER_ROLE, roleOptions } from "../team-role/user-role-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const schema = z
  .object({
    email: z
      .string()
      .min(3, { message: "Please enter a valid email." })
      .email({ message: "Please enter a valid email." }),
    selectedRole: z.nativeEnum(USER_ROLE, {
      required_error: "Role is required.",
    }),
    selectedDatarooms: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.selectedRole === USER_ROLE.DATAROOM_MEMBER) {
      if (!data.selectedDatarooms || data.selectedDatarooms.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "array",
          inclusive: true,
          message:
            "At least one dataroom must be selected for Dataroom Member.",
          path: ["selectedDatarooms"],
        });
      }
    }
  });

export function AddTeamMembers({
  open,
  setOpen,
  children,
  teamId,
}: {
  open: boolean;
  teamId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const [selectedRole, setSelectedRole] = useState<USER_ROLE>(USER_ROLE.MEMBER);
  const [email, setEmail] = useState<string>("");
  const { datarooms } = useDatarooms();
  const [selectedDatarooms, setSelectedDatarooms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const dataroomsList =
    datarooms
      ?.filter((room) => room.teamId === teamId)
      .map(({ id, name }) => ({ label: name, value: id })) ?? [];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setLoading(true);
    try {
      schema.safeParse({
        email,
        selectedRole,
        selectedDatarooms,
      });
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, selectedRole, selectedDatarooms }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error);
      }

      analytics.capture("Team Member Invitation Sent", {
        email,
        teamId: teamInfo?.currentTeam?.id,
      });

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/invitations`);

      toast.success("An invitation email has been sent!");
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors.map((err) => err.message).join(", "));
      } else {
        toast.error(
          error instanceof Error ? error.message : "An error occurred",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            You can easily add team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="domain" className="opacity-80">
            Email
          </Label>
          <Input
            id="email"
            placeholder="team@member.com"
            className="mt-1 w-full"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label className="opacity-80">Select Role</Label>
              <Select
                onValueChange={(value) => setSelectedRole(value as USER_ROLE)}
                value={selectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole === USER_ROLE.DATAROOM_MEMBER && (
              <SelectField
                label="Select Datarooms"
                options={dataroomsList}
                value={selectedDatarooms}
                onChange={setSelectedDatarooms}
                placeholder="Choose datarooms"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="h-9 w-full">
              {loading ? "Sending email..." : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
