"use client";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { CheckCircleIcon, PencilIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DEAL_TYPE_OPTIONS = [
  { value: "startup-fundraising", label: "Startup Fundraising" },
  { value: "fund-management", label: "Fundraising & Reporting" },
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [editDealType, setEditDealType] = useState<string | null>(null);
  const [editDealTypeOther, setEditDealTypeOther] = useState<string>("");
  const [showOtherInput, setShowOtherInput] = useState(false);
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
          
          // Set initial step based on existing data
          if (data.dealType && (data.dealSize || data.dealType === "project-management")) {
            setStep(3); // Show completed state
          } else if (data.dealType) {
            setEditDealType(data.dealType);
            setEditDealTypeOther(data.dealTypeOther || "");
            setStep(2); // Show deal size question
          } else {
            setStep(1); // Show deal type question
          }
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
    setShowOtherInput(false);
    setStep(1);
  };

  const handleDealTypeSelect = async (value: string) => {
    setEditDealType(value);
    setShowOtherInput(false);
    
    if (value === "project-management") {
      // Project management doesn't need deal size - save directly
      await handleSave(value, null, null);
    } else {
      setStep(2);
    }
  };

  const handleOtherSubmit = () => {
    if (!editDealTypeOther.trim()) return;
    setEditDealType("other");
    setShowOtherInput(false);
    setStep(2);
  };

  const handleDealSizeSelect = async (value: string) => {
    await handleSave(editDealType, value, editDealTypeOther || null);
  };

  const handleSave = async (
    type?: string | null,
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
          dealTypeOther: otherText,
          dealSize: size,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setDealType(finalDealType);
      setDealTypeOther(otherText || null);
      setDealSize(size || null);
      setStep(3);
      toast.success("Survey answers saved!");
    } catch (error) {
      console.error("Failed to save survey:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const getDealSizeQuestion = () => {
    switch (editDealType) {
      case "startup-fundraising":
      case "fund-management":
        return "How much are you raising?";
      case "mergers-acquisitions":
      case "real-estate":
      case "financial-operations":
        return "What's the deal size?";
      default:
        return "What's the typical deal size?";
    }
  };

  return (
    <Card id="team-survey">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Survey</CardTitle>
            <CardDescription>
              This will help us tailor your Papermark experience
            </CardDescription>
          </div>
          {step === 3 && (
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
        ) : step === 1 ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">What do you use Papermark for?</h3>
            </div>

            <div className="grid gap-2">
              {DEAL_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDealTypeSelect(option.value)}
                  disabled={isSaving}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/50"
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
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editDealTypeOther.trim()) {
                        handleOtherSubmit();
                      }
                    }}
                  />
                  <button
                    onClick={handleOtherSubmit}
                    disabled={!editDealTypeOther.trim() || isSaving}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowOtherInput(true)}
                  disabled={isSaving}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                  <span className="font-medium">Other</span>
                </button>
              )}
            </div>
          </>
        ) : step === 2 ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {getDealSizeQuestion()}
              </h3>
            </div>

            <div className="grid gap-2">
              {DEAL_SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDealSizeSelect(option.value)}
                  disabled={isSaving}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-semibold">Thanks for sharing!</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-muted-foreground">Use case</span>
                <span className="text-sm font-medium">
                  {getDealTypeLabel(dealType, dealTypeOther)}
                </span>
              </div>
              {dealSize && (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-sm text-muted-foreground">Deal size</span>
                  <span className="text-sm font-medium">
                    {getDealSizeLabel(dealSize)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
