const files = [
  {
    title: "Papermark",
    size: "Open Source Docsend alternative",
    source: "https://www.papermark.io/_static/meta-image.png",
    link: "/login",
  },
  {
    title: "Google Drive",
    size: "Document hosting platform",
    source:
      "https://dknlay9ljaq1f.cloudfront.net/alterantives/google-drive.jpg",
    link: "/alternatives/google-drive",
  },
  {
    title: "Pitch",
    size: "Presentation creation platform",
    source: "https://dknlay9ljaq1f.cloudfront.net/alterantives/pitch.webp",
    link: "/alternatives/pitch",
  },
  {
    title: "PandaDoc",
    size: "Optimizization of agreements and workflows",
    source: "https://dknlay9ljaq1f.cloudfront.net/alterantives/pandadoc.png",
    link: "/alternatives/pandadoc",
  },
];

export default function Gridalternatives() {
  return (
    <div className="bg-gray-100 py-10 sm:py-10 px-6 sm:px-8 lg:px-20 my-20 ">
      <div className="px-6 py-12 sm:px-6 sm:py-20 lg:px-8 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Learn more about 4 Docsend Alternatives in 2023
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Papermark, PandaDoc and other Docsend alternatives to fit your
            business needs
          </p>
        </div>
      </div>
      <ul
        role="list"
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
      >
        {files.map((file) => (
          <li key={file.source} className="relative">
            <a href={file.link} className="block focus:outline-none">
              <div className="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
                <img
                  src={file.source}
                  alt=""
                  className="pointer-events-none object-cover group-hover:opacity-75"
                />
                <span className="sr-only">View details for {file.title}</span>
              </div>
              <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
                {file.title}
              </p>
              <p className="pointer-events-none block text-sm font-medium text-gray-500">
                {file.size}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
