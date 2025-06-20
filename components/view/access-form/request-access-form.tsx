import { useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { determineTextColor } from "@/lib/utils/determine-text-color";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function RequestAccessForm({
  email,
  linkId,
  brand,
  useCustomAccessForm,
  logoOnAccessForm,
}: {
  email: string;
  linkId: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  useCustomAccessForm?: boolean;
  logoOnAccessForm?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/file-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          email,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError(data.message || "Failed to send access request");
      }
    } catch (error) {
      setError("Failed to send access request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div
        className="flex h-full min-h-dvh flex-col justify-between pb-4"
        style={{
          backgroundColor:
            brand && brand.accentColor ? brand.accentColor : "black",
        }}
      >
        {/* Light Navbar */}
        {logoOnAccessForm && brand && brand.logo && typeof brand.logo === 'string' && (
          <nav
            className="w-full"
            style={{
              backgroundColor: brand.brandColor ? brand.brandColor : "black",
            }}
          >
            <div className="flex h-16 items-center justify-start px-2 sm:px-6 lg:px-8">
              <img
                src={brand.logo}
                alt="Brand Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
          </nav>
        )}

        <div className="flex flex-1 flex-col px-6 pb-12 pt-8 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <h1
                className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white"
                style={{
                  color: determineTextColor(brand?.accentColor),
                }}
              >
                Access Request Sent
              </h1>
              <p
                className="mt-4 text-sm text-gray-300"
                style={{
                  color: determineTextColor(brand?.accentColor),
                }}
              >
                Your request has been sent to the content owner. You will be
                notified via email when access is granted.
              </p>
            </div>
          </div>
        </div>

        {!useCustomAccessForm ? (
          <div className="flex justify-center">
            <p className="text-center text-sm tracking-tight text-gray-500">
              This document is securely shared with you using{" "}
              <a
                href="https://www.papermark.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold"
              >
                Papermark
              </a>
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-dvh flex-col justify-between pb-4"
      style={{
        backgroundColor:
          brand && brand.accentColor ? brand.accentColor : "black",
      }}
    >
      {/* Light Navbar */}
      {logoOnAccessForm && brand && brand.logo && typeof brand.logo === 'string' && (
        <nav
          className="w-full"
          style={{
            backgroundColor: brand.brandColor ? brand.brandColor : "black",
          }}
        >
          <div className="flex h-16 items-center justify-start px-2 sm:px-6 lg:px-8">
            <img
              src={brand.logo}
              alt="Brand Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
        </nav>
      )}

      <div className="flex flex-1 flex-col px-6 pb-12 pt-8 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1
            className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white"
            style={{
              color: determineTextColor(brand?.accentColor),
            }}
          >
            Request Access
          </h1>
          <p
            className="mt-2 text-sm text-gray-300"
            style={{
              color: determineTextColor(brand?.accentColor),
            }}
          >
            Your email ({email}) is not authorized to access this content. You
            can request access from the content owner.
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="message"
                className="block text-sm font-medium leading-6 text-white"
                style={{
                  color: determineTextColor(brand?.accentColor),
                }}
              >
                Message (optional)
              </label>
              <Textarea
                id="message"
                name="message"
                rows={4}
                className="flex w-full rounded-md border-0 bg-black py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
                style={{
                  backgroundColor:
                    brand && brand.accentColor ? brand.accentColor : "black",
                  color: determineTextColor(brand?.accentColor),
                }}
                placeholder="Please let me know why you need access to this content..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-center pt-5">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-1/3 min-w-fit bg-white text-gray-950 hover:bg-white/90"
                loading={isLoading}
                style={{
                  backgroundColor: determineTextColor(brand?.accentColor),
                  color:
                    brand && brand.accentColor ? brand.accentColor : "black",
                }}
              >
                {isLoading ? "Sending..." : "Request Access"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {!useCustomAccessForm ? (
        <div className="flex justify-center">
          <p className="text-center text-sm tracking-tight text-gray-500">
            This document is securely shared with you using{" "}
            <a
              href="https://www.papermark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
            >
              Papermark
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
