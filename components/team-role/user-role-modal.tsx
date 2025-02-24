import { useState } from "react";

import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";

import useDatarooms from "@/lib/swr/use-datarooms";
import { useGetTeam } from "@/lib/swr/use-team";

import { MultiSelect } from "../ui/multi-select-v1";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import SelectField from "./SelectField";

export enum USER_ROLE {
  MANAGER = "MANAGER",
  DATAROOM_MEMBER = "DATAROOM_MEMBER",
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

export const roleOptions = [
  { value: USER_ROLE.MANAGER, label: "Manager" },
  { value: USER_ROLE.MEMBER, label: "Member" },
  { value: USER_ROLE.DATAROOM_MEMBER, label: "Dataroom Member" },
];

interface CreateUserRoleModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
  dataroomId: string[];
  role: USER_ROLE;
  changeRole: (
    teamId: string,
    userId: string,
    selectedRole: USER_ROLE,
    selectedDatarooms: string[],
  ) => Promise<void>;
  teamId: string;
  userId: string;
}

const UserRoleSchema = z
  .object({
    selectedRole: z.nativeEnum(USER_ROLE, {
      required_error: "Role is required.",
    }),
    selectedDatarooms: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.selectedRole === USER_ROLE.DATAROOM_MEMBER) {
      console.log(
        data.selectedRole,
        USER_ROLE.DATAROOM_MEMBER,
        data.selectedRole === USER_ROLE.DATAROOM_MEMBER,
      );

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

export const CreateUserRoleModal: React.FC<CreateUserRoleModalProps> = ({
  open,
  teamId,
  setOpen,
  userId,
  children,
  changeRole,
  role,
  dataroomId,
}) => {
  const { datarooms } = useDatarooms();
  const { team } = useGetTeam();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<USER_ROLE>(role);
  const [selectedDatarooms, setSelectedDatarooms] =
    useState<string[]>(dataroomId);

  const dataroomsList =
    datarooms
      ?.filter((room) => room.teamId === team?.id)
      .map(({ id, name }) => ({ label: name, value: id })) ?? [];

  const handleCreatePermission = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setLoading(true);

    try {
      UserRoleSchema.parse({ selectedRole, selectedDatarooms });

      await changeRole(teamId, userId, selectedRole, selectedDatarooms);

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
      <DialogContent>
        <DialogHeader className="text-start">
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Modify user UserRoles within the team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreatePermission}>
          <div className="flex flex-col gap-4 py-4">
            {/* Role Selection */}
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

          <DialogFooter className="flex sm:justify-center">
            <Button
              type="submit"
              className="mt-5 h-9 w-full max-w-[400px]"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
