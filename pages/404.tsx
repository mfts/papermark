import Link from "next/link";

export default function NotFound({ message }: { message?: string }) {
  return (
    <>
      <div className="min-h-screen pt-16 pb-12 flex flex-col">
        <main className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16">
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                404 error
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-gray-100 tracking-tight sm:text-5xl">
                Page not found.
              </h1>
              <p className="mt-2 text-base text-gray-600">
                {message ||
                  "Sorry, we couldn’t find the page you’re looking for."}
              </p>
              <div className="mt-6">
                <Link
                  href="/"
                  className="text-base font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Go back home <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
