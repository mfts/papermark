export default function Banner() {
  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gray-900 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#00FFD0] opacity-20"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>
      <div
        className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#00FFD0] opacity-30"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>
      <div className="flex items-center  justify-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-white">
          <strong className="font-semibold">Papermark AI</strong> on Product
          Hunt
          {/* <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg> */}
          {/* 04.12-08.12 */}
        </p>
        {/* <a
          href="https://www.papermark.io/launch-week"
          className="flex-none rounded-md bg-green-600 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Follow this madness <span aria-hidden="true"></span>
        </a> */}
        <a
          href="https://www.producthunt.com/posts/papermark-ai?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-papermark&#0045;ai"
          target="_blank"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=427633&theme=light"
            alt="Papermark&#0032;AI - Open&#0032;source&#0032;AI&#0032;document&#0032;assistant | Product Hunt"
            style={{ width: "200px", height: "54px" }}
            width="200"
            height="54"
          />
        </a>
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
        >
          {/* <span className="sr-only">Dismiss</span> */}
          {/* <XMarkIcon className="h-5 w-5 text-gray-900" aria-hidden="true" /> */}
        </button>
      </div>
    </div>
  );
}
