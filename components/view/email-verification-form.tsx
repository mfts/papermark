import { Button } from "@/components/ui/button";
import { DEFAULT_ACCESS_FORM_TYPE } from "@/components/view/access-form";

export default function EmailVerificationMessage({
  onSubmitHandler,
  isLoading,
  data,
}: {
  onSubmitHandler: React.FormEventHandler<HTMLFormElement>;
  data: DEFAULT_ACCESS_FORM_TYPE;
  isLoading: boolean;
}) {
  return (
    <>
      <div className="flex h-screen flex-1 flex-col bg-black px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
            Please verify your email
          </h2>
          <p className="text-pretty text-sm leading-6 text-white">
            A verification link has been send to your email:{" "}
            <span className="font-medium">{data.email}</span>
          </p>
          <form className="mt-10 space-y-4" onSubmit={onSubmitHandler}>
            <div className="flex items-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the email?
              </p>{" "}
              <Button
                type="submit"
                variant="link"
                size="sm"
                className="text-sm font-normal text-gray-400"
                loading={isLoading}
              >
                Resend Link
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
