import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import AgreementSection from "./agreement-section";
import EmailSection from "./email-section";
import NameSection from "./name-section";
import PasswordSection from "./password-section";

export const DEFAULT_ACCESS_FORM_DATA = {
  email: null,
  password: null,
};

export type DEFAULT_ACCESS_FORM_TYPE = {
  email: string | null;
  password: string | null;
  hasConfirmedAgreement?: boolean;
  name?: string | null;
};

export default function AccessForm({
  data,
  email,
  setData,
  onSubmitHandler,
  requireEmail,
  requirePassword,
  requireAgreement,
  agreementContent,
  isLoading,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  email: string | null | undefined;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  onSubmitHandler: React.FormEventHandler<HTMLFormElement>;
  requireEmail: boolean;
  requirePassword: boolean;
  requireAgreement?: boolean;
  agreementContent?: string;
  isLoading: boolean;
}) {
  useEffect(() => {
    const userEmail = email;
    if (userEmail) {
      setData((prevData: DEFAULT_ACCESS_FORM_TYPE) => ({
        ...prevData,
        email: userEmail || prevData.email,
      }));
    }
  }, [email]);

  return (
    <>
      <div className="flex h-screen flex-1 flex-col  bg-black px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
            Your action is requested to continue
          </h1>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={onSubmitHandler}>
            {requireAgreement && agreementContent ? (
              <NameSection {...{ data, setData }} />
            ) : null}
            {requireEmail ? <EmailSection {...{ data, setData }} /> : null}
            {requirePassword ? (
              <PasswordSection {...{ data, setData }} />
            ) : null}
            {requireAgreement && agreementContent ? (
              <AgreementSection
                {...{ data, setData }}
                agreementContent={agreementContent}
              />
            ) : null}

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={
                  (requireEmail && !data.email) ||
                  (requirePassword && !data.password) ||
                  (requireAgreement && !data.hasConfirmedAgreement) ||
                  (requireAgreement && !data.name)
                }
                className="w-1/3 min-w-fit bg-white text-gray-950 hover:bg-white/90"
                loading={isLoading}
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
