import Link from "next/link";

const PapermarkText = () => {
  return (
    <>
      <div className="bg-gray-100 p-8 mt-16">
        <div className="max-w-3xl mx-auto space-y-6 bg-white text-black p-6 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold ">DocSend vs Papermark</h1>
          <p className="mb-4">
            Papermark emphasizes security and user interface, offering features
            like watermarking, password protection, and custom branding.
          </p>

          <ul className="list-disc list-inside mb-4">
            <li className="">Founder First</li>
            <li className="">Budget Friendly</li>
            <li className="">Open Source</li>
            <li className="">User-Friendly </li>
          </ul>
          <p className="mb-4">
            <a
              href="https://github.com/mfts/papermark"
              className="text-blue-600 underline px-2"
            >
              Self-host Papermark
            </a>
            or let us host it for you
            <Link href="/login" className="text-blue-600 underline px-2">
              for free
            </Link>
          </p>
          <h2 className="text-2xl font-bold mt-4">Papermark reviews</h2>

          <p>⭐️⭐️⭐️⭐️⭐️</p>

          <h3 className="text-2xl font-semi-bold mt-4">
            Users love our customer support
          </h3>
          <img
            src="https://dknlay9ljaq1f.cloudfront.net/alterantives/ptam9dpuu627c1hmsttz.png"
            alt="Papermark reviews"
            className="my-4"
          />
          <h3 className="text-2xl font-semi-bold mt-4">
            Papermark focuses on UI and core features
          </h3>
          <img
            src="https://dknlay9ljaq1f.cloudfront.net/alterantives/rukw13d22o50hfrdqa1y.png"
            alt="Papermark reviews"
            className="my-4"
          />
          <h3 className="text-2xl font-semi-bold mt-4">
            Actively used by founders, VC funds and developers
          </h3>
          <img
            src="https://dknlay9ljaq1f.cloudfront.net/alterantives/6gsr6kfo84srtzgu6nhe.png"
            alt="Papermark reviews"
            className="my-4"
          />
          <h2 className="text-2xl font-bold mt-4">
            Papermark plans and pricing
          </h2>
          <p>
            Papermark has a simple pricing structure. You can use Papermark for
            free or get the the subscribtion to your team for more advanced
            features. Including custom domain. We also respond on custom
            requests. As Papermark is open source first you can host it
            yourself.
          </p>

          <img
            src="https://dknlay9ljaq1f.cloudfront.net/alterantives/fibyns1yrayocc2pkydk.png"
            alt="Papermark plans and pricing"
            className="my-4"
          />

          <p>
            Papermark is a founder frinedly alternative to Docsend. Our team
            focuses on delivering value fast and supporting each customer.
          </p>
        </div>
      </div>
    </>
  );
};

export default PapermarkText;
