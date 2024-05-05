import jaskiimage from "@/public/testimonials/jaski.jpeg";
import vatanyutaimage from "@/public/testimonials/vatanyuta.png";
import dominikimage from "@/public/testimonials/dominik.jpg";
import Image from "next/image";

export default function Testimonials() {
  return (
    <div className="bg-white py-24">
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="text-4xl text-balance">
          Loved by over 5000 customers and users.
          <br />
          <span className="text-gray-500">
            Here&apos;s what they have to say about us.
          </span>
        </h2>
        <div className="flex justify-center w-full bg-white">
          <div className="flex w-full max-w-7xl  py-12">
            <div className="flex w-full justify-center bg-white rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {/* Column 1 */}
                <div className="flex flex-col items-center">
                  {/* Image container */}
                  <div className="flex flex-col items-center bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Image container */}
                    <Image
                      className="w-full h-80 object-cover"
                      src={jaskiimage}
                      alt="Testimonial 1"
                    />
                    {/* Text content */}
                    <div className="p-8">
                      <blockquote className="text-gray-700 text-lg">
                        <p>
                          Papermark team listens to their users. Thanks for
                          solving a big pain. DocSend monopoly will end soon!
                        </p>
                      </blockquote>
                      <figcaption className="mt-4 ">
                        <div className="font-semibold">Jaski</div>
                        <div className="text-sm text-gray-500">
                          Founder, Townhall Network
                        </div>
                      </figcaption>
                    </div>
                  </div>
                </div>
                {/* Column 2 (duplicate of Column 1) */}
                <div className="flex flex-col items-center">
                  {/* Image container */}
                  {/* Image container */}
                  <div className="flex flex-col items-center bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Image container */}
                    <Image
                      className="w-full h-80 object-cover"
                      src={vatanyutaimage}
                      alt="Testimonial 1"
                    />
                    {/* Text content */}
                    <div className="p-8">
                      <blockquote className="text-gray-700 text-lg">
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
                  {/* Image container */}
                  {/* Image container */}
                  <div className="flex flex-col items-center bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Image container */}
                    <Image
                      className="w-full h-80 object-cover"
                      src={dominikimage}
                      alt="Testimonial 1"
                    />
                    {/* Text content */}
                    <div className="p-8">
                      <blockquote className="text-gray-700 text-lg">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
