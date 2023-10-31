export default function Section3() {
  return (
    <div className="bg-white">
      <div className="px-6 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            We're Passionate About Building Beautiful Products
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xl leading-7 text-gray-600">
            Our focus is on crafting exceptional products, which is why this landing page is simple and functional <span className="font-bold">:)</span>
          </p>
        </div>
        {/* Video added below */}
        <div className="mt-10 mx-auto w-full max-w-6xl">
          <video
            width="100%"
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
