export default function Logos() {
  return (
    <div className="bg-white ">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* <h2 className="text-center text-lg font-semibold leading-8 text-gray-900">
          Trusted by founders of the world’s most innovative companies
        </h2> */}
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-5 items-center gap-x-4 gap-y-6 sm:max-w-xl sm:grid-cols-6 sm:gap-x-6 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          {[
            "logo1.png",
            "logo2.png",
            "logo3.png",
            "logo4.png",
            "logo5.webp",
          ].map((logo, index) => (
            <img
              key={index}
              className="w-20 h-20 object-contain lg:w-32 lg:h-32"
              src={`/_static/${logo}`}
              alt=""
              // Note: These width and height attributes can be removed since we're using CSS to control the image size.
            />
          ))}
        </div>
      </div>
    </div>
  );
}
