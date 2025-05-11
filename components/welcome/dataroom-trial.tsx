import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { E164Number } from "libphonenumber-js";
import { motion } from "motion/react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { Input } from "../ui/input";

export default function DataroomTrial() {
  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const router = useRouter();

  const [useCase, setUseCase] = useState<string>("");
  const [customUseCase, setCustomUseCase] = useState<string>("");
  const [companySize, setCompanySize] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [tools, setTools] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!name || !companyName || !useCase || !companySize || !tools) {
      toast.error("Please fill out all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/trial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Dataroom #1",
            fullName: name,
            companyName,
            useCase: useCase === "other" ? customUseCase.trim() : useCase,
            companySize,
            tools,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { id: dataroomId } = await response.json(); // Assuming the API returns the created dataroom's ID

      if (!dataroomId) {
        throw new Error("No dataroom ID returned from the server");
      }

      analytics.capture("Dataroom Trial Created", {
        dataroomName: "Dataroom #1",
        useCase: useCase === "other" ? customUseCase.trim() : useCase,
        companySize,
        dataroomId,
      });
      toast.success("Dataroom successfully created! 🎉");

      await mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms`);

      // Instead of redirecting to "/datarooms", we'll navigate to the dataroom-upload page
      router.push(`/welcome?type=dataroom-upload&dataroomId=${dataroomId}`);
    } catch (error) {
      toast.error("Error adding dataroom. Please try again.");
      console.error("Error creating dataroom:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="z-10 mx-5 flex flex-col items-center space-y-10 text-center sm:mx-auto"
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: {
          opacity: 1,
          scale: 1,
          transition: {
            staggerChildren: 0.2,
          },
        },
      }}
      initial="hidden"
      animate="show"
      exit="hidden"
      transition={{ duration: 0.3, type: "spring" }}
    >
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="flex flex-col items-center space-y-10 text-center"
      >
        <p className="text-2xl font-bold tracking-tighter text-foreground">
          Papermark
        </p>
        <h1 className="font-display max-w-lg text-3xl font-semibold transition-colors sm:text-4xl">
          Start a 7-day free trial!
        </h1>
      </motion.div>
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="mx-auto mt-24 w-full max-w-md text-left"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="opacity-80">
              Your Full Name*
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="off"
              data-1p-ignore
              placeholder="John Doe"
              className="mb-4 mt-1 w-full"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company-name" className="opacity-80">
              Company Name*
            </Label>
            <Input
              id="company-name"
              type="text"
              autoComplete="off"
              data-1p-ignore
              placeholder="ACME Inc."
              className="mb-4 mt-1 w-full"
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          {/* <div className="space-y-1">
            <Label className="opacity-80">Industry</Label>
            <Select onValueChange={(value) => setIndustry(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finance-banking">
                  Finance and Banking
                </SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="consulting">
                  Consulting and Professional Services
                </SelectItem>
                <SelectItem value="government">
                  Government and Public Sector
                </SelectItem>
                <SelectItem value="entertainment">
                  Entertainment and Media
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          <div className="space-y-1">
            <Label className="opacity-80">Company Size*</Label>
            <Select onValueChange={(value) => setCompanySize(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 employee</SelectItem>
                <SelectItem value="2-10">2-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                <SelectItem value="1001-5000">1,001-5,000 employees</SelectItem>
                <SelectItem value="5001-10000">
                  5,001-10,000 employees
                </SelectItem>
                <SelectItem value="10001+">10,001+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="opacity-80">Use Case*</Label>
            <Select
              onValueChange={(value) => {
                setUseCase(value);
                if (value !== "other") {
                  setCustomUseCase("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your use case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mergers-and-acquisitions">
                  Mergers and Acquisitions
                </SelectItem>
                <SelectItem value="startup-fundraising">
                  Startup Fundraising
                </SelectItem>
                <SelectItem value="fund-management">
                  Fund management & Fundraising
                </SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="project-management">
                  Project management
                </SelectItem>
                <SelectItem value="operations">Operations</SelectItem>

                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {useCase === "other" && (
              <input
                type="text"
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="Please specify your use case"
                value={customUseCase}
                onChange={(e) => setCustomUseCase(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="tools" className="opacity-80">
              Tools*
            </Label>
            <Input
              id="tools"
              type="text"
              autoComplete="off"
              data-1p-ignore
              placeholder="Current software you are using for data rooms"
              className="mb-4 mt-1 w-full"
              onChange={(e) => setTools(e.target.value)}
            />
          </div>
          {/* <div className="space-y-1">
            <Label className="opacity-80">Phone Number</Label>
            <PhoneInput
              placeholder="+1 123 456 7890"
              onChange={(value) => setPhoneNumber(value)}
              defaultCountry="US"
            />
          </div> */}

          <div className="space-y-4 text-center">
            <Button
              type="submit"
              className="h-9 w-full"
              disabled={
                !tools ||
                !companySize ||
                !useCase ||
                !name ||
                !companyName ||
                (useCase === "other" && !customUseCase.trim())
              }
              loading={loading}
            >
              Access your data room
            </Button>

            <div className="text-xs text-muted-foreground">
              {/* Data rooms are available on our{" "}
              <UpgradePlanModal clickedPlan={PlanEnum.Business}>
                <button className="underline">Business</button>
              </UpgradePlanModal>{" "}
              plan. <br /> */}
              No credit card is required. After the trial, upgrade to{" "}
              <UpgradePlanModal clickedPlan={PlanEnum.Business}>
                <button className="underline">
                  Papermark Business or Data Rooms
                </button>
              </UpgradePlanModal>{" "}
              to continue using data rooms.
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
