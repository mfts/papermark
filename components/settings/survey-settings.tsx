"use client";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeftIcon, CheckCircle2Icon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEAL_TYPE_OPTIONS = [
  { value: "startup-fundraising", label: "Startup Fundraising" },
  { value: "fund-management", label: "Fund Management" },
  { value: "mergers-acquisitions", label: "Mergers & Acquisitions" },
  { value: "financial-operations", label: "Financial Operations" },
  { value: "real-estate", label: "Real Estate" },
  { value: "project-management", label: "Project Management" },
];

const DEAL_SIZE_OPTIONS = [
  { value: "0-500k", label: "$0 - $500K" },
  { value: "500k-5m", label: "$500K - $5M" },
  { value: "5m-10m", label: "$5M - $10M" },
  { value: "10m-100m", label: "$10M - $100M" },
  { value: "100m+", label: "$100M+" },
];

export function SurveySettings() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [dealType, setDealType] = useState<string | null>(null);
  const [dealTypeOther, setDealTypeOther] = useState<string | null>(null);
  const [dealSize, setDealSize] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [editDealType, setEditDealType] = useState<string | null>(null);
  const [editDealTypeOther, setEditDealTypeOther] = useState<string>("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [editDealSize, setEditDealSize] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!teamId) return;

      try {
        const response = await fetch(`/api/teams/${teamId}/survey`);
        if (response.ok) {
          const data = await response.json();
          setDealType(data.dealType);
          setDealTypeOther(data.dealTypeOther);
          setDealSize(data.dealSize);
        }
      } catch (error) {
        console.error("Failed to fetch survey data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [teamId]);

  const getDealTypeLabel = (value: string | null, otherText?: string | null) => {
    if (!value) return null;
    if (value === "other" && otherText) {
      return `Other: ${otherText}`;
    }
    return DEAL_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value;
  };

  const getDealSizeLabel = (value: string | null) => {
    if (!value) return null;
    return DEAL_SIZE_OPTIONS.find((opt) => opt.value === value)?.label || value;
  };

  const handleEdit = () => {
    setEditDealType(dealType);
    setEditDealTypeOther(dealTypeOther || "");
    setEditDealSize(dealSize);
    setEditStep(1);
    setShowOtherInput(false);
    setIsEditing(true);
  };

  const handleDealTypeSelect = (value: string) => {
    setEditDealType(value);
    setShowOtherInput(false);
    if (value === "project-management") {
      setEditDealSize(null);
      handleSave(value, null, null);
    } else {
      setEditStep(2);
    }
  };

  const handleOtherSubmit = () => {
    if (!editDealTypeOther.trim()) return;
    setEditDealType("other");
    setShowOtherInput(false);
    setEditStep(2);
  };

  const handleSave = async (
    type?: string,
    size?: string | null,
    otherText?: string | null,
  ) => {
    const finalDealType = type || editDealType;
    if (!finalDealType || !teamId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/survey`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealType: finalDealType,
          dealTypeOther:
            otherText !== undefined ? otherText : editDealTypeOther || null,
          dealSize: size !== undefined ? size : editDealSize,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setDealType(finalDealType);
      setDealTypeOther(
        otherText !== undefined ? otherText : editDealTypeOther || null,
      );
      setDealSize(size !== undefined ? size : editDealSize);
      setIsEditing(false);
      toast.success("Survey answers updated!");
    } catch (error) {
      console.error("Failed to save survey:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnswered = !!dealType;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Survey</CardTitle>
              <CardDescription>
                Information about your deal flow to help us improve Papermark
              </CardDescription>
            </div>
            {hasAnswered && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : hasAnswered ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2Icon className="mt-0.5 h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Deal Type</p>
                  <p className="text-sm text-muted-foreground">
                    {getDealTypeLabel(dealType, dealTypeOther)}
                  </p>
                </div>
              </div>
              {dealSize && (
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Deal Size</p>
                    <p className="text-sm text-muted-foreground">
                      {getDealSizeLabel(dealSize)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : editStep === 1 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                What do you use Papermark for?
              </p>
              <div className="grid gap-2">
                {DEAL_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDealTypeSelect(option.value)}
                    disabled={isSaving}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
                {/* Other - inline input */}
                {showOtherInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editDealTypeOther}
                      onChange={(e) => setEditDealTypeOther(e.target.value)}
                      placeholder="Please specify..."
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editDealTypeOther.trim()) {
                          handleOtherSubmit();
                        }
                      }}
                    />
                    <Button
                      onClick={handleOtherSubmit}
                      disabled={!editDealTypeOther.trim() || isSaving}
                    >
                      →
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOtherInput(true)}
                    disabled={isSaving}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
                  >
                    <span className="font-medium">Other</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditStep(1)}
                  className="rounded-full p-1 hover:bg-muted"
                  disabled={isSaving}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <p className="text-sm font-medium">
                  {editDealType === "mergers-acquisitions" ||
                  editDealType === "real-estate" ||
                  editDealType === "financial-operations" ||
                  editDealType === "other"
                    ? "What's the deal size?"
                    : "How much are you raising?"}
                </p>
              </div>
              <div className="grid gap-2">
                {DEAL_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditDealSize(option.value)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                      editDealSize === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition-colors ${
                        editDealSize === option.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave()}
                  disabled={!editDealSize || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          {editStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>What do you use Papermark for?</DialogTitle>
              </DialogHeader>

              <div className="grid gap-2 py-4">
                {DEAL_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDealTypeSelect(option.value)}
                    disabled={isSaving}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                      editDealType === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
                {/* Other - inline input */}
                {showOtherInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editDealTypeOther}
                      onChange={(e) => setEditDealTypeOther(e.target.value)}
                      placeholder="Please specify..."
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editDealTypeOther.trim()) {
                          handleOtherSubmit();
                        }
                      }}
                    />
                    <Button
                      onClick={handleOtherSubmit}
                      disabled={!editDealTypeOther.trim() || isSaving}
                    >
                      →
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOtherInput(true)}
                    disabled={isSaving}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                      editDealType === "other"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">Other</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editDealType === "mergers-acquisitions" ||
                  editDealType === "real-estate" ||
                  editDealType === "financial-operations" ||
                  editDealType === "other"
                    ? "What's the deal size?"
                    : "How much are you raising?"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-2 py-4">
                {DEAL_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditDealSize(option.value)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                      editDealSize === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition-colors ${
                        editDealSize === option.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setEditStep(1)}
                  disabled={isSaving}
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleSave()}
                  disabled={!editDealSize || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
