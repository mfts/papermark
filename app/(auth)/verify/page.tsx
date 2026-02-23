import { redirect } from "next/navigation";

// Legacy verify page - redirect to new auth email flow
export default async function VerifyPage() {
  redirect("/auth/email");
}
