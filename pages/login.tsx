import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const { next } = router.query as { next?: string };

  return (
    <div className="flex h-screen w-screen justify-center">
      <div
        className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>
      <div className="z-10 mt-[calc(30vh)] h-fit w-full max-w-md overflow-hidden border border-gray-900 rounded-lg sm:shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl text-white font-semibold">Sign in to Papermark</h3>
          <p className="text-sm text-gray-400">
            Start sharing documents with insights.
          </p>
        </div>
        <div className="flex flex-col bg-gray-800 px-4 py-8 sm:px-16">
          <button
            onClick={() => {
              signIn("google", {
                ...(next && next.length > 0 ? { callbackUrl: next } : {}),
              });
            }}
            className="rounded px-10 py-2 font-medium transition-colors text-gray-900 bg-gray-100 hover:text-gray-100 hover:bg-gray-500"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
