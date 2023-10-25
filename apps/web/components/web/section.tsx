export default function Section() {
  return (
    <div className="bg-white py-10 sm:py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 items-start gap-x-8 gap-y-16 sm:gap-y-24 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pr-4">
            <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 pb-9 pt-64 shadow-2xl sm:px-12 lg:max-w-lg lg:px-8 lg:pb-8 xl:px-10 xl:pb-10">
              <img
                className="absolute inset-0 h-full w-full object-cover  "
                src="https://www.papermark.io/_static/michael.webp"
                alt=""
              />

              <div
                className="absolute left-1/2 top-1/2 -ml-16 -translate-x-1/2 -translate-y-1/2 transform-gpu blur-3xl"
                aria-hidden="true"
              ></div>
              <figure className="relative isolate">
                <svg
                  viewBox="0 0 162 128"
                  fill="none"
                  aria-hidden="true"
                  className="absolute -left-2 -top-4 -z-10 h-32 stroke-white/20"
                >
                  <use href="#0ef284b8-28c2-426e-9442-8655d393522e" x={86} />
                </svg>

                <blockquote className="mt-6 text-xl font-semibold leading-none text-white ">
                  <p className="m-0 py-1">
                    “ I will make them remember me, I will ”
                  </p>
                </blockquote>

                <figcaption className="mt-6 text-sm leading-6 text-gray-300">
                  <strong className="font-semibold text-white">Michael</strong>{" "}
                  founder
                </figcaption>
              </figure>
            </div>
          </div>
          <div>
            <div className="text-base leading-7 text-gray-700 lg:max-w-lg">
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Send via Papermark = Share your personality
              </h1>
              <ul role="list" className="mt-8 space-y-2 text-gray-600">
                <li className="flex gap-x-3">
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Open Source
                    </strong>{" "}
                    Host it yourself
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Custom domain
                    </strong>{" "}
                    No more docsending you in the crowd
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Feedback
                    </strong>{" "}
                    For each slide
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Analytics
                    </strong>{" "}
                    Built in
                  </span>
                </li>

                <li className="flex gap-x-3">
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Free
                    </strong>{" "}
                    You can use it for free
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
