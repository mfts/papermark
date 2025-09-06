import { NextPage } from "next";

import { useState, useEffect } from "react";
import { z } from "zod";

import {
  type CredentialCreationOptionsJSON,
  create,
} from "@github/webauthn-json";
import { Trash2, Lock } from "lucide-react";
import { toast } from "sonner";

import { usePasskeys } from "@/lib/swr/use-passkeys";
import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";
import { cn } from "@/lib/utils";

import { AccountHeader } from "@/components/account/account-header";
import AppLayout from "@/components/layouts/app";
import Passkey from "@/components/shared/icons/passkey";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfilePage: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { passkeys, loading: isLoadingPasskeys, mutate } = usePasskeys();

  // Password management state
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
  const passwordValidation = passwordSchema.safeParse(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Check if user has password set
  useEffect(() => {
    async function checkPasswordStatus() {
      try {
        const response = await fetch("/api/account/password");
        const data = await response.json();
        setHasPassword(data.hasPassword);
      } catch (error) {
        console.error("Error checking password status:", error);
      }
    }
    checkPasswordStatus();
  }, []);

  async function setPassword() {
    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password set successfully!");
        setHasPassword(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to set password");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsPasswordLoading(false);
    }
  }

  async function changePassword() {
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsPasswordLoading(false);
    }
  }

  async function registerPasskey() {
    setIsLoading(true);
    const createOptionsResponse = await fetch("/api/passkeys/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: true, finish: false, credential: null }),
    });

    const { createOptions } = await createOptionsResponse.json();

    // Open "register passkey" dialog
    const credential = await create(
      createOptions as CredentialCreationOptionsJSON,
    );

    const response = await fetch("/api/passkeys/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: false, finish: true, credential }),
    });

    if (response.ok) {
      toast.success("Registered passkey successfully!");
      mutate(); // Refresh the list
      setIsLoading(false);
      return;
    }
    // Now the user has registered their passkey and can use it to log in.
    setIsLoading(false);
  }

  async function removePasskey(credentialId: string) {
    try {
      const response = await fetch("/api/account/passkeys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      });

      if (response.ok) {
        toast.success("Passkey removed successfully!");
        mutate(); // Refresh the list
      } else {
        toast.error("Failed to remove passkey");
      }
    } catch (error) {
      console.error("Error removing passkey:", error);
      toast.error("Failed to remove passkey");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <AccountHeader />
        <div className="space-y-6">
          {/* Password Management Section */}
          {hasPassword !== null && (
            <div className="rounded-lg border border-muted p-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <h2 className="text-xl font-medium">
                      {hasPassword ? "Change password" : "Set password"}
                    </h2>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {hasPassword
                      ? "Update your current password for enhanced security."
                      : "Set a password to enable password-based login alongside your existing sign-in methods."}
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  {hasPassword && (
                    <div className="relative">
                      <Label htmlFor="currentPassword" className="text-sm font-medium">
                        Current Password
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={isPasswordLoading}
                          className="pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showCurrentPassword ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      {hasPassword ? "New Password" : "Password"}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isPasswordLoading}
                        className={cn(
                          "pr-10",
                          newPassword.length > 0 && !passwordValidation.success ? "border-red-500" : ""
                        )}
                        placeholder="Enter new password (8+ characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showNewPassword ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isPasswordLoading}
                        className={cn(
                          "pr-10",
                          confirmPassword.length > 0 && !passwordsMatch ? "border-red-500" : ""
                        )}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showConfirmPassword ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={hasPassword ? changePassword : setPassword}
                    disabled={
                      isPasswordLoading ||
                      !passwordValidation.success ||
                      !passwordsMatch ||
                      (hasPassword && !currentPassword)
                    }
                    loading={isPasswordLoading}
                    className="flex items-center space-x-2"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{hasPassword ? "Change Password" : "Set Password"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Register Passkey Section */}
          <div className="rounded-lg border border-muted p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium">Register a passkey</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Never use a password or oauth again. Register a passkey to
                  make logging in easy.
                </p>
              </div>
              <Button
                onClick={() => registerPasskey()}
                className="flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                <Passkey className="h-4 w-4" />
                <span>Register a new passkey</span>
              </Button>
            </div>
          </div>

          {/* Existing Passkeys Section */}
          <div className="rounded-lg border border-muted p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium">Your passkeys</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Manage your registered passkeys. You can remove passkeys you
                  no longer use.
                </p>
              </div>

              {isLoadingPasskeys ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    Loading passkeys...
                  </div>
                </div>
              ) : passkeys.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    No passkeys registered yet.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Passkey className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {passkey.name || "Unnamed Passkey"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(passkey.created_at)}
                            {passkey.last_used_at && (
                              <span className="ml-4">
                                Last used: {formatDate(passkey.last_used_at)}
                              </span>
                            )}
                          </div>
                          {passkey.transports &&
                            passkey.transports.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Transports: {passkey.transports.join(", ")}
                              </div>
                            )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove passkey</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this passkey? This
                              action cannot be undone. You will need to register
                              a new passkey to continue using passwordless
                              authentication.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removePasskey(passkey.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default ProfilePage;
