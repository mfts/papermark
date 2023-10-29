import Link from "next/link"
import Background from "../background/background"

const TestHeader = () => {
    return (
        
        <div className="relative flex max-w-8xl card bg-gradient-circle w-full justify-between px-4 sm:px-8 sm:py-10 pb-8 from-gray-50 to-gray-200 sm:border dark:border-stone-900 dark:from-brand-900/20 dark:to-stone-950/80 sm:min-h-fit md:px-16 md:py-12  md:pt-16 rounded-3xl">
            <section className="flex flex-col space-y-8">
                <Background />
                <div
                    className=" space-y-4"
                    // onClick={() => loglib.track("github", { from: "hero section" })}
                >
                    <Link
                        href={siteConfig.links.github}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4"
                    >
                        <div className="mx-auto flex items-center gap-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="text-foreground h-5 w-5"
                            >
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                            </svg>

                            <h2 className="font-heading text-lg leading-[1.1] md:text-xl  ">
                                Proudly Open Source
                            </h2>
                        </div>
                    </Link>
                    {/* <Hero /> */}
                </div>
                <div className=" mt-8 space-y-4">
                    <div className="flex flex-col gap-3 font-semibold">
                        <p className="max-w-xl text-left text-xl tracking-wider text-orange-500">
                            3 Easy Step To Setup
                        </p>
                        <div className="text-md flex flex-col gap-4 text-black dark:text-white sm:flex-row 2xl:text-lg">
                            <div className="flex gap-2">
                                <span className="bg-gradient-to-br from-indigo-300 to-orange-600 bg-clip-text text-transparent">
                                    01
                                </span>
                                <span className=" ">Create account</span>
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                className="hidden aspect-square w-5 stroke-orange-300 stroke-2 sm:block"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                />
                            </svg>
                            <div className="flex gap-2">
                                <span className="bg-gradient-to-br from-indigo-300 to-orange-600 bg-clip-text text-transparent">
                                    02
                                </span>
                                <span className="">Add your website</span>
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                className="hidden aspect-square w-5 stroke-orange-300 stroke-2 sm:block"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                />
                            </svg>
                            <div className="flex gap-2">
                                <span className="bg-gradient-to-br from-indigo-300 to-orange-600 bg-clip-text text-transparent">
                                    03
                                </span>
                                <span className="">Start tracking</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex  flex-col gap-6 font-semibold sm:flex-row">
                        <Link
                            className={cn(
                                "  text-white cursor-pointer font-bold transition-all duration-[0.3s] ease-[ease] relative inline-block shadow-[inset_2px_2px_2px_0px_rgba(255,255,255,0.1),7px_7px_20px_0px_rgba(26, 35, 126, 0.3),4px_4px_5px_0px_rgba(0,0,0,0.1)] px-4 md:px-[25px] py-2.5 rounded-[5px] bg-transparent",
                                "dark:text-white text-stone-900 border-[none] after:absolute after:content-[''] after:w-0 after:h-full after:z-[-1] after:shadow-[-7px_-7px_20px_0px_#1a237e,-4px_-4px_5px_0px_#000,7px_7px_20px_0px_#0002,4px_4px_5px_0px_#0001] after:transition-all after:duration-[0.3s] after:ease-[ease] after:left-0 after:top-0 hover:text-black hover:after:w-full border-stone-100 dark:border-stone-700 hover:dark:text-white hover:after:left-auto hover:after:right-0 active:top-0.2 border w-max",
                            )}
                            href="/login"
                            // onClick={() => loglib.track("get started", { from: "hero section" })}
                        >
                            Get Started
                        </Link>

                        <Link
                            href="/demo"
                            className=" flex items-center gap-4 rounded-md bg-gradient-to-tr from-stone-700/80 to-orange-600/60 bg-clip-text text-transparent transition-all duration-500 hover:gap-8 hover:text-gray-800 dark:from-white/70 dark:to-purple-700 hover:dark:text-gray-400"
                            // onClick={() => loglib.track("live demo", { from: "hero section" })}
                        >
                            <span>Live Demo</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                className="aspect-square w-5 stroke-orange-300 stroke-2 "
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
            {/* <LandingGraph /> */}
        </div>
    )
}
export default TestHeader