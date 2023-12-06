import Link from "next/link";

export default function UnauthorizedAccess({ message }: { message?: string }) {
  return (
    <div className="min-h-screen pt-16 pb-12 flex flex-col">
      <main className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              401 error
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-gray-100 tracking-tight sm:text-5xl">
              Unauthorized access
            </h1>
            <p className="mt-2 text-base text-gray-600">
              You are not authorized. Please contact the owner
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
