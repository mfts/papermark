"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { signInWithPasskey } from "@teamhanko/passkeys-next-auth-provider/client";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";
import Passkey from "@/components/shared/icons/passkey";
import { useState } from "react";
import { toast } from "sonner";
import LinkedIn from "@/components/shared/icons/linkedin";
import { Loader } from "lucide-react";

export default function Login() {
  const { next } = useParams as { next?: string };
  const [isLoginWithEmail, setIsLoginWithEmail] = useState<boolean>(false);
  const [isLoginWithGoogle, setIsLoginWithGoogle] = useState<boolean>(false);
  const [isLoginWithLinkedIn, setIsLoginWithLinkedIn] =
    useState<boolean>(false);

  const [email, setEmail] = useState<string>("");

  return (
    <div className="flex h-screen w-full flex-wrap ">
      {/* Left part */}
      <div className="flex w-full justify-center bg-white  sm:w-2/5">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mt-[calc(20vh)] h-fit w-full mx-5 sm:mx-0 max-w-md overflow-hiddenbg-gray-50 rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
            <Link href="/">
              <span className=" text-2xl font-semibold text-gray-800 text-balance ">
                Welcome to Papermark
              </span>
            </Link>
            <h3 className="text-sm text-gray-800 text-balance ">
              Start sharing documents documents and create custom data room
            </h3>
          </div>
          <form
            className="flex flex-col p-4 pt-8 sm:px-16 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoginWithEmail(true);
              signIn("email", {
                email: email,
                redirect: false,
                ...(next && next.length > 0 ? { callbackUrl: next } : {}),
              }).then((res) => {
                if (res?.ok && !res?.error) {
                  setEmail("");
                  toast.success("Email sent - check your inbox!");
                } else {
                  toast.error("Error sending email - try again?");
                }
                setIsLoginWithEmail(false);
              });
            }}
          >
            <Input
              className="border-1 bg-white border-gray-100 hover:border-gray-200 text-gray-800"
              placeholder="jsmith@company.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {/* <Button type="submit" disabled={isLoginWithEmail}>
              {isLoginWithEmail && (
                <Loader className="h-5 w-5 mr-2 animate-spin bg-gray-800 hover:bg-gray-900" />
              )}
              Continue with Email
            </Button> */}

            <Button
              type="submit"
              disabled={isLoginWithEmail}
              className={`${
                isLoginWithEmail ? "bg-black" : "bg-gray-800 hover:bg-gray-900 "
              } text-white  py-2 px-4 rounded focus:outline-none focus:shadow-outline transform transition-colors duration-300 ease-in-out`}
            >
              {isLoginWithEmail && (
                <Loader className="h-5 w-5 mr-2 animate-spin" />
              )}
              Continue with Email
            </Button>
          </form>
          <p className="text-center">or</p>
          <div className="flex flex-col px-4 py-8 sm:px-16 space-y-2">
            <Button
              onClick={() => {
                setIsLoginWithGoogle(true);
                signIn("google", {
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                }).then((res) => {
                  if (res?.status) {
                    setIsLoginWithGoogle(false);
                  }
                });
              }}
              disabled={isLoginWithGoogle}
              className="flex justify-center items-center space-x-2 border border-gray-200 hover:bg-gray-200 "
            >
              {isLoginWithGoogle ? (
                <Loader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                </svg>
              )}

              <span>Continue with Google</span>
            </Button>
            <Button
              onClick={() => {
                setIsLoginWithLinkedIn(true);
                signIn("linkedin", {
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                }).then((res) => {
                  if (res?.status) {
                    setIsLoginWithLinkedIn(false);
                  }
                });
              }}
              disabled={isLoginWithLinkedIn}
              className="flex justify-center items-center space-x-2 border border-gray-200 hover:bg-gray-200 "
            >
              {isLoginWithLinkedIn ? (
                <Loader className="w-5 h-5 mr-2 animate-spin " />
              ) : (
                <LinkedIn />
              )}
              <span>Continue with LinkedIn</span>
            </Button>
            <Button
              onClick={() =>
                signInWithPasskey({
                  tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID as string,
                })
              }
              variant="outline"
              className="flex justify-center items-center space-x-2 border border-gray-200 hover:bg-gray-200 bg-gray-100 text-gray-900 hover:text-gray-900 "
            >
              <Passkey className="w-4 h-4 " />
              <span>Continue with a passkey</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex hidden w-full justify-center bg-gray-800 sm:flex sm:w-3/5  justify-center ">
        <div className="flex w-full max-w-5xl px-4 md:px-8 py-20">
          <div
            className="flex w-full mx-auto max-w-5xl px-4 md:px-8 py-20 bg-gray-800 rounded-3xl  justify-center "
            id="features"
          >
            <div className="flex flex-col items-center">
              {/* Image container */}
              <div className="w-64 h-64 mb-4">
                <img
                  className="object-cover w-full h-full rounded-2xl shadow-2xl"
                  src="https://www.papermark.io/_static/testimonials/jaski.jpeg"
                  alt="Jaski"
                />
              </div>
              {/* Text content */}
              <div className="max-w-xl text-center">
                <blockquote className="text-l leading-8 text-gray-100 sm:text-xl sm:leading-9 text-balance">
                  <p>
                    True builders listen to their users and build what they
                    need. Thanks Papermark team for solving a big pain point.
                    DocSend monopoly will end soon!
                  </p>
                </blockquote>
                <figcaption className="mt-4">
                  <div className="font-semibold text-white text-balance ">
                    Jaski
                  </div>
                  <div className="text-gray-400 text-balance ">Founder </div>
                </figcaption>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { Button } from "@/components/ui/button";
// import { signIn } from "next-auth/react";
// import { signInWithPasskey } from "@teamhanko/passkeys-next-auth-provider/client";
// import Link from "next/link";
// import { Input } from "@/components/ui/input";
// import { useParams } from "next/navigation";
// import Passkey from "@/components/shared/icons/passkey";
// import { useState } from "react";
// import { toast } from "sonner";
// import LinkedIn from "@/components/shared/icons/linkedin";
// import { Loader } from "lucide-react";

// export default function Login() {
//   const { next } = useParams as { next?: string };
//   const [isLoginWithEmail, setIsLoginWithEmail] = useState<boolean>(false);
//   const [isLoginWithGoogle, setIsLoginWithGoogle] = useState<boolean>(false);
//   const [isLoginWithLinkedIn, setIsLoginWithLinkedIn] =
//     useState<boolean>(false);

//   const [email, setEmail] = useState<string>("");

//   return (
//     <div className="flex h-screen w-full justify-center">
//       <div
//         className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
//         aria-hidden="true"
//       >
//         <div
//           className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
//           style={{
//             clipPath:
//               "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
//           }}
//         />
//       </div>
//       <div className="z-10 mt-[calc(20vh)] h-fit w-full mx-5 sm:mx-0 max-w-md overflow-hidden border border-border bg-gray-50 dark:bg-gray-900 rounded-lg sm:shadow-xl">
//         <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
//           <Link href="/">
//             <span className="text-xl font-bold tracking-tighter text-foreground">
//               Papermark
//             </span>
//           </Link>
//           <h3 className="text-2xl text-foreground font-medium">
//             Start sharing documents
//           </h3>
//         </div>
//         <form
//           className="flex flex-col p-4 pt-8 sm:px-16 gap-4"
//           onSubmit={(e) => {
//             e.preventDefault();
//             setIsLoginWithEmail(true);
//             signIn("email", {
//               email: email,
//               redirect: false,
//               ...(next && next.length > 0 ? { callbackUrl: next } : {}),
//             }).then((res) => {
//               if (res?.ok && !res?.error) {
//                 setEmail("");
//                 toast.success("Email sent - check your inbox!");
//               } else {
//                 toast.error("Error sending email - try again?");
//               }
//               setIsLoginWithEmail(false);
//             });
//           }}
//         >
//           <Input
//             className=" border-4"
//             placeholder="jsmith@company.co"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <Button type="submit" disabled={isLoginWithEmail}>
//             {isLoginWithEmail && (
//               <Loader className="h-5 w-5 mr-2 animate-spin" />
//             )}
//             Continue with Email
//           </Button>
//         </form>
//         <p className="text-center">or</p>
//         <div className="flex flex-col px-4 py-8 sm:px-16 space-y-2">
//           <Button
//             onClick={() => {
//               setIsLoginWithGoogle(true);
//               signIn("google", {
//                 ...(next && next.length > 0 ? { callbackUrl: next } : {}),
//               }).then((res) => {
//                 if (res?.status) {
//                   setIsLoginWithGoogle(false);
//                 }
//               });
//             }}
//             disabled={isLoginWithGoogle}
//             className="flex justify-center items-center space-x-2"
//           >
//             {isLoginWithGoogle ? (
//               <Loader className="w-5 h-5 mr-2 animate-spin" />
//             ) : (
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 488 512"
//                 fill="currentColor"
//                 className="h-4 w-4"
//               >
//                 <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
//               </svg>
//             )}

//             <span>Continue with Google</span>
//           </Button>
//           <Button
//             onClick={() => {
//               setIsLoginWithLinkedIn(true);
//               signIn("linkedin", {
//                 ...(next && next.length > 0 ? { callbackUrl: next } : {}),
//               }).then((res) => {
//                 if (res?.status) {
//                   setIsLoginWithLinkedIn(false);
//                 }
//               });
//             }}
//             disabled={isLoginWithLinkedIn}
//             className="flex justify-center items-center space-x-2"
//           >
//             {isLoginWithLinkedIn ? (
//               <Loader className="w-5 h-5 mr-2 animate-spin" />
//             ) : (
//               <LinkedIn />
//             )}
//             <span>Continue with LinkedIn</span>
//           </Button>
//           <Button
//             onClick={() =>
//               signInWithPasskey({
//                 tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID as string,
//               })
//             }
//             variant="outline"
//             className="flex justify-center items-center space-x-2"
//           >
//             <Passkey className="w-4 h-4" />
//             <span>Continue with a passkey</span>
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
