import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";
import { Label } from "@/components/ui/label";
import { Logo } from "@prisma/client";
import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { mutate } from "swr";
import Link from "next/link";
import { useTeam } from "@/context/team-context";
import { AddLogoModal } from "@/components/logos/add-logo-modal";

export default function LogoSection({
  data,
  setData,
  logo,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  logo?: Logo[];
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const teamInfo = useTeam();

  const handleLogoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    if (value === "add_logo") {
      // Redirect to the add logo page
      setModalOpen(true);
      return;
    }

    setData({ ...data, logo: value });
  };

  const handleSelectFocus = () => {
    // Assuming your fetcher key for logo is '/api/teams/:teamId/logo'
    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/logo`);
  };

  return (
    <>
      <Label htmlFor="link-domain">Logo</Label>
      <div className="flex">
        <select
          value={data.logo || "papermark-logo"}
          onChange={handleLogoChange}
          onFocus={handleSelectFocus}
          className={cn(
            "w-48 rounded-l-md border border-r-0 border-border bg-secondary px-5 text-sm text-secondary-foreground focus:border-border focus:outline-none focus:ring-0",
            data.logo && data.logo !== "papermark-logo"
              ? ""
              : "rounded-r-md border-r-1",
          )}
        >
          <option key="papermark-logo" value="papermark-logo">
            papermark-logo
          </option>
          {logo?.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
          <option value="add_logo">Add your own logo ✨</option>
        </select>
      </div>

      <AddLogoModal open={isModalOpen} setOpen={setModalOpen} />
    </>
  );
}
