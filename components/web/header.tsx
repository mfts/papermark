import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/site";
import LookingDigger from "../../public/_static/looking-diggers.png";
import Image from "next/image";
import styles from "./header.module.css";
import { cn } from "@/lib/utils";
import useScroll from "@/lib/hooks/usescroll";
import { useEffect } from "react";
export default function Header() {
  const scrolled = useScroll(50);
  const fadeInConfig = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  };
  useEffect(() => {
    let index = 0;
    const interval = 1000;

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const animate = (star: HTMLElement) => {
      star.style.setProperty("--star-left", `${rand(-10, 100)}%`);
      star.style.setProperty("--star-top", `${rand(-40, 80)}%`);
      star.style.animation = "none";
      star.offsetHeight;
      star.style.animation = "";
    };
    const stars: any = document.getElementsByClassName("star");
    for (const star of stars) {
      setTimeout(() => {
        animate(star as HTMLElement);
        setInterval(() => animate(star as HTMLElement), 1000);
      }, index++ * (interval / 3));
    }
  }, []);
  return (
    <div className="relative mt-[-100px] font-inter bg-gradient-to-br from-purple-100 via-blue-50 to-rose-100 mb-[-40px]">
      <div className=" text-center mx-auto max-w-7xl flex flex-col justify-center items-center lg:gap-x-8 lg:px-8">
        <div className="px-6 pb-24 pt-10 sm:pb-32 lg:col-span-7 lg:px-0 lg:pb-56 lg:pt-48 xl:col-span-6">
          <div className="mx-auto max-w-full lg:mx-0">
            <div className="hidden sm:mt-32 sm:flex lg:mt-16"></div>
            <div className="mt-24 sm:mt-10">
              <a
                target="_blank"
                href="https://www.producthunt.com/posts/papermark-3?utm_source=badge-top-post-badge&amp;utm_medium=badge&amp;utm_souce=badge-papermark"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=411605&amp;theme=light&amp;period=daily"
                  alt="Papermark - The open-source DocSend alternative | Product Hunt"
                  className="w-[250px] h-[54px] mx-auto "
                />
              </a>
            </div>
            <div className="mt-2 mx-auto text-black py-4 flex justify-center items-center h-5 rounded-2xl  backdrop-blur-xl bg-accent/20 dark:bg-transparent  w-40">
              <p className="flex items-center bg-acc  text-gray-800 mr-2">Lastest Blogs </p>
              
              <Link href={"/blog"}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="aspect-square w-5 stroke-black stroke-2 "
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                />
              </svg>
              </Link>
            </div>
            <motion.h1
              //@ts-ignore
              variants={fadeInConfig}
              className="font-display mt-5 text-6xl font-bold tracking-tight text-gray-900 sm:text-6xl"
            >
              <span className=" relative inline-block">
                <span className={styles.star}>
                  <svg viewBox="0 0 512 512">
                    <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
                  </svg>
                </span>
                <span className={styles.star}>
                  <svg viewBox="0 0 512 512">
                    <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
                  </svg>
                </span>
                <span className={styles.star}>
                  <svg viewBox="0 0 512 512">
                    <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
                  </svg>
                </span>
              </span>
              <span
                className={cn(
                  "bg-gradient-to-tr outline-none  from-purple-400 to-orange-300 via-rose-300 text-transparent bg-clip-text ",
                  styles.magicText
                )}
              >
                Papermark
              </span>{" "}
              will make your <br />
              pitchdeck stand out
            </motion.h1>
            <p className="font-display2 mt-2 font-thin text-lg leading-8 text-gray-600">
              The Open-Source Docsend Alternative to securely share documents
              with real-time analytics.
            </p>
            <div className="mt-10 flex justify-center items-center gap-x-6">
              <Link
                className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                href={"/login"}
              >
                Get started
              </Link>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md  px-3.5 py-2.5 text-sm font-semibold text-black hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 flex items-center"
                href={siteConfig.links.github}
              >
                <GitHubIcon className="mr-2 h-5 w-5" /> Star on Github
              </Link>
            </div>
          </div>
          {/* <div className="relative md:col-span-5 lg:-mr-8 xl:absolute xl:inset-0 xl:left-1/2 xl:mr-0 mt-6   ">
            <img
              className="aspect-[3/2] w-full  object-contain lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:w-3/4"
              src={LookingDigger}
              alt="Looking diggers"
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}
