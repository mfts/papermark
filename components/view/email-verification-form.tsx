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
      <div className="flex h-screen flex-1 flex-col  px-6 py-12 lg:px-8 bg-black">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="flex justify-center mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
            Please verify your email
          </h2>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h6 className="block text-sm font-medium leading-6 text-white">
            A verification link is send to your email {data.email}
          </h6>
        </div>
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={onSubmitHandler}>
            <div className="flex justify-center">
              <p className="text-sm text-gray-600">Didn't receive the email?</p>
            </div>
            <div className="flex justify-center">
              <Button type="submit" className="w-1/3" loading={isLoading}>
                Resend Link
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
