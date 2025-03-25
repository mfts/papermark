import { useRouter } from "next/router";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function UnsubscribePage() {
  const router = useRouter();
  const { type, token } = router.query as { type: string; token: string };
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async () => {
    try {
      if (!token) {
        setStatus("error");
        setMessage("Token is required");
        return;
      }
      setLoading(true);
      const response = await fetch(`/api/unsubscribe/${type}?token=${token}`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to unsubscribe");
      }

      setStatus("success");
      setMessage(data.message);
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Unsubscribe from {type === "yir" ? "Year in Review" : "Dataroom "}
          Notifications
        </h1>

        {status === "error" ? (
          <div className="mb-4 text-center text-red-500">{message}</div>
        ) : status === "success" ? (
          <div className="mb-4 text-center text-green-500">{message}</div>
        ) : (
          <p className="mb-6 text-center text-gray-600">
            Click the button below to unsubscribe from notifications for this
            {type === "yir" ? "year in review" : " dataroom"}.
          </p>
        )}

        {status === "idle" && (
          <Button
            onClick={handleUnsubscribe}
            variant="destructive"
            className="w-full"
            loading={loading}
          >
            {loading ? "Unsubscribing..." : "Unsubscribe"}
          </Button>
        )}

        {status === "success" && (
          <p className="mt-4 text-center text-sm text-gray-500">
            You can close this window now.
          </p>
        )}
      </div>
    </div>
  );
}
