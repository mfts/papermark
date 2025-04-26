interface DocumentNotFoundProps {
  headline?: string;
  message?: string;
  actionText?: string;
}

export default function DocumentNotFound({
  headline = "This Document Isn’t Available",
  message = "The link you followed may be broken, expired, or the document is no longer publicly accessible.",
  actionText = "Reach out to the owner to grant access again",
}: DocumentNotFoundProps) {
  return (
    <>
      <div className="flex min-h-screen flex-col pb-12 pt-16">
        <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="py-16">
            <div className="space-y-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#fb7a00]">
                <span className="text-6xl">404</span>{" "}
                <sub className="text-lg">error</sub>
              </p>
              <div>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-gray-100 sm:text-5xl">
                  {headline}
                </h1>
                <p className="mt-2 text-base text-gray-400">{message}</p>
                <div className="mt-6">
                  <p className="text-base font-medium text-[#fb7a00] hover:text-[#fb7900]">
                    {actionText} <span aria-hidden="true"></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
