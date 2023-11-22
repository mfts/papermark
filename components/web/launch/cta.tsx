import Link from "next/link";

export default function CTA() {
  return (
    <div className="bg-gray-100">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Join our live updates here
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Lets have fun together if we survive this launch
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="https://t.me/+yxHQdNAyACszN2Rl"
              className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get in
            </Link>
            <Link
              href="https://twitter.com/papermarkio"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              on X <span aria-hidden="true"></span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
