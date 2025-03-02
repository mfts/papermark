import { NextPage } from "next";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { AccountHeader } from "@/components/account/account-header";
import UploadAvatar from "@/components/account/upload-avatar";
import AppLayout from "@/components/layouts/app";
import { Form } from "@/components/ui/form";

import { validateEmail } from "@/lib/utils/validate-email";

const ProfilePage: NextPage = () => {
  const { data: session, update } = useSession();

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <AccountHeader />
        <div className="space-y-6">
          <Form
            title="Your Name"
            description="This will be your display name on Papermark."
            inputAttrs={{
              name: "name",
              placeholder: "Dino Hems",
              maxLength: 32,
            }}
            defaultValue={session?.user?.name ?? ""}
            helpText="Max 32 characters."
            handleSubmit={(data) =>
              fetch("/api/account", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }).then(async (res) => {
                if (res.status === 200) {
                  update();
                  toast.success("Successfully updated your name!");
                } else {
                  const { error } = await res.json();
                  toast.error(error?.message);
                }
              })
            }
          />
          <Form
            title="Your Email"
            description="This will be the email you use to log in to Papermark and receive notification. A confirmation is required for changes."
            inputAttrs={{
              name: "email",
              placeholder: "name@example.com",
              maxLength: 52,
              type: "email",
            }}
            defaultValue={session?.user?.email ?? ""}
            // TODO: MAIL SUBSCRIPTION
            // helpText={<UpdateMailSubscribe />}
            validate={validateEmail}
            helpText=""
            handleSubmit={(data) =>
              fetch("/api/account", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }).then(async (res) => {
                if (res.status === 200) {
                  toast.success(
                    `A confirmation email has been sent to ${session?.user?.email}.`,
                  );
                } else {
                  const { error } = await res.json();
                  toast.error(error);
                }
              })
            }
          />
          <UploadAvatar
            title="Your Avatar"
            description="This is your avatar image on Papermark."
            helpText="Square image recommended. Accepted file types: .png, .jpg. Max file
          size: 2MB."
          />
        </div>
      </main>
    </AppLayout>
  );
};

export default ProfilePage;
