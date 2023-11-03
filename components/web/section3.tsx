export default function Section3() {
  return (
    <div className="bg-white">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            We spend all our <span className="bg-gradient-to-tr from-purple-500 to-rose-300 bg-clip-text text-transparent">energy</span> {" "} on building <span className="bg-gradient-to-tr from-rose-400 to-purple-300 bg-clip-text text-transparent">beautiful</span> product
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            So no energy left for this landing page:)
          </p>
        </div>
        {/* Video added below */}
        <div className="mt-10 mx-auto w-full max-w-6xl">
          <video
            width="100%"
            id="video1"
            style={{ borderRadius: "6px" }}
            aria-hidden="true"
            playsInline
            autoPlay
            muted
            loop
          >
            <source
              src="https://dknlay9ljaq1f.cloudfront.net/short-video.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>
    </div>
  );
}
