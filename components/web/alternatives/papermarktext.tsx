import React from "react";

const DocSendAlternatives: React.FC = () => {
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
            <li className="font-bold">Founder Friendly</li>
            <li className="font-bold">Budget Friendly</li>
            <li className="font-bold">With Advanced Analytics</li>
            <li className="font-bold">User-Friendly Design</li>
          </ul>
          <p className="mb-4">
            Self host Papermark for you
            <a
              href="http://papermark.io/login"
              className="text-blue-600 underline px-2"
            >
              Start Now
            </a>
          </p>
          <h2 className="text-2xl font-bold mt-4">Papermark reviews</h2>

          <p>⭐️⭐️⭐️⭐️⭐️</p>

          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ptam9dpuu627c1hmsttz.png"
            alt="DocSend Pricing"
            className="my-4"
          />
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rukw13d22o50hfrdqa1y.png"
            alt="DocSend Pricing"
            className="my-4"
          />

          <p>
            Papermark is a founder frinedly alternative to Docsend. Team focuses
            on delivering value fast and supporting each customer.
          </p>
          {/* <p>
            <strong>Personal Plan</strong> - starts from $15 per month per
            person
          </p>
          <p>
            <strong>Standard Plan</strong> - starts from $65 a month
          </p>
          <p>
            <strong>Advanced Plan</strong> - starts from $250 a month
          </p>
          <p>
            <strong>Enterprise Plan</strong> - contact the team for pricing
          </p> */}
          {/* Add more content here as needed */}
        </div>
      </div>
      {/* Footer or other components can be added here */}
    </>
  );
};

export default DocSendAlternatives;
