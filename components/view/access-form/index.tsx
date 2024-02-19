import { useEffect } from "react";
import PasswordSection from "./password-section";
import EmailSection from "./email-section";
import { Button } from "@/components/ui/button";

export const DEFAULT_ACCESS_FORM_DATA = {
  email: null,
  password: null,
};

export type DEFAULT_ACCESS_FORM_TYPE = {
  email: string | null;
  password: string | null;
};

export default function AccessForm({
  data,
  email,
  setData,
  onSubmitHandler,
  requireEmail,
  requirePassword,
  isLoading,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  email: string | null | undefined;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  onSubmitHandler: React.FormEventHandler<HTMLFormElement>;
  requireEmail: boolean;
  requirePassword: boolean;
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
      <div className="flex h-screen flex-1 flex-col  px-6 py-12 lg:px-8 bg-black">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
            Your action is requested to continue
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={onSubmitHandler}>
            {requireEmail ? <EmailSection {...{ data, setData }} /> : null}
            {requirePassword ? (
              <PasswordSection {...{ data, setData }} />
            ) : null}

            <div className="flex justify-center">
              <Button type="submit" className="w-1/3" loading={isLoading}>
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
