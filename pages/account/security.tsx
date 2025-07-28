import { NextPage } from "next";

import { useState } from "react";

import {
  type CredentialCreationOptionsJSON,
  create,
} from "@github/webauthn-json";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { usePasskeys } from "@/lib/swr/use-passkeys";

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

const ProfilePage: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { passkeys, loading: isLoadingPasskeys, mutate } = usePasskeys();

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
