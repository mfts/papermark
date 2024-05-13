export default function Section3() {
  return (
    <div className="bg-white">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Upload, share and track documents
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            See Papermark in action
          </p>
        </div>
        {/* Video added below */}
        <div className="mx-auto mt-10 w-full max-w-6xl">
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
              src="https://assets.papermark.io/short-video.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>
    </div>
  );
}
