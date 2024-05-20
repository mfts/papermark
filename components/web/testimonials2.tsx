import Image from "next/image";

import dominikimage from "@/public/testimonials/dominik.jpg";
import jaskiimage from "@/public/testimonials/jaski.jpeg";
import vatanyutaimage from "@/public/testimonials/vatanyuta.png";
import aleximage from "@/public/testimonials/alex.jpeg";

export default function Testimonials() {
  return (
    <div className="bg-white py-24">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <h2 className="text-balance text-4xl">
          Loved by over 5000 companies
          <br />
          <span className="text-gray-500">
            Here&apos;s what customers and users have to say about us.
          </span>
        </h2>
        <div className="flex w-full justify-center bg-white">
          <div className="flex w-full max-w-7xl  py-12">
            <div className="flex w-full justify-center rounded-3xl bg-white">
              <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
                {/* Column 1 */}
                <div className="flex flex-col items-center">
                  {/* Image container */}
                  <div className="flex flex-col items-center overflow-hidden rounded-3xl bg-white shadow-xl">
                    {/* Image container */}
                    <Image
                      className="h-80 w-full object-cover"
                      src={jaskiimage}
                      alt="Testimonial 1"
                    />
                    {/* Text content */}
                    <div className="p-8">
                      <blockquote className="text-lg text-gray-700">
                        <p>
                          Papermark team listens to their users. Thanks for
                          solving a big pain. DocSend monopoly will end soon!
                        </p>
                      </blockquote>
                      <figcaption className="mt-4 ">
                        <div className="font-semibold">Jaski</div>
                        <div className="text-sm text-gray-500">
                          Founder, Townhall Network (web3)
                        </div>
                      </figcaption>
                    </div>
                  </div>
                </div>
                {/* Column 2 (duplicate of Column 1) */}
                <div className="flex flex-col items-center">
                  {/* Image container */}
                  {/* Image container */}
                  <div className="flex flex-col items-center overflow-hidden rounded-3xl bg-white shadow-xl">
                    {/* Image container */}
                    <Image
                      className="h-80 w-full object-cover"
                      src={vatanyutaimage}
                      alt="Testimonial 1"
                    />
                    {/* Text content */}
                    <div className="p-8">
                      <blockquote className="text-lg text-gray-700">
                        <p>
                          We actively use Papermark to create many links and
                          track analytics for our branded data room!
                        </p>
                      </blockquote>
                      <figcaption className="mt-4 ">
                        <div className="font-semibold">Vatanyuta</div>
                        <div className="text-sm text-gray-500">
                          Manager, Banyan Property
                        </div>
                      </figcaption>
                    </div>
                  </div>
                </div>
                {/* Column 3 (duplicate of Column 1) */}
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center overflow-hidden rounded-3xl bg-white shadow-xl">
                    <Image
                      className="h-80 w-full object-cover"
                      src={aleximage}
                      alt="Testimonial 1"
                    />

                    <div className="p-8">
                      <blockquote className="text-lg text-gray-700">
                        <p>
                          Our transition to Papermark was smooth. We love the
                          product and data rooms with custom domains.
                        </p>
                      </blockquote>
                      <figcaption className="mt-4 ">
                        <div className="font-semibold">Alex</div>
                        <div className="text-sm text-gray-500">
                          Partner at VC Fund
                        </div>
                      </figcaption>
                    </div>
                  </div>
                </div>
                {/* <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center overflow-hidden rounded-3xl bg-white shadow-xl">
                    <Image
                      className="h-80 w-full object-cover"
                      src={dominikimage}
                      alt="Testimonial 1"
                    />

                    <div className="p-8">
                      <blockquote className="text-lg text-gray-700">
                        <p>
                          I am using Papermark daily sharing documents to LPs
                          and viewing the pitch decks from founders.
                        </p>
                      </blockquote>
                      <figcaption className="mt-4 ">
                        <div className="font-semibold">Dominik</div>
                        <div className="text-sm text-gray-500">
                          Partner at VC Fund
                        </div>
                      </figcaption>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
