import { useRouter } from "next/router";
import { motion } from "framer-motion";

const STAGGER_CHILD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "spring" } },
};

export default function Intro() {
  const router = useRouter();

  return (
    <motion.div
      className="z-10"
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      <motion.div
        variants={{
          show: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="mx-5 flex flex-col items-center space-y-10 text-center sm:mx-auto"
      >
        <motion.h1
          className="font-display text-4xl font-bold text-white transition-colors sm:text-5xl"
          variants={STAGGER_CHILD_VARIANTS}
        >
          Welcome to{" "}
          <span className="font-bold tracking-tighter">Papermark</span>
        </motion.h1>
        <motion.p
          className="max-w-md text-gray-200 transition-colors sm:text-lg"
          variants={STAGGER_CHILD_VARIANTS}
        >
          Papermark makes you look cool when fundraising and helps you keep
          track of your investors.
        </motion.p>
        <motion.button
          variants={STAGGER_CHILD_VARIANTS}
          className="rounded  px-10 py-2 font-medium transition-colors text-gray-900 bg-gray-100 hover:text-gray-100 hover:bg-gray-500"
          onClick={() =>
            router.push({
              pathname: "/welcome",
              query: {
                type: "next",
              },
            })
          }
        >
          Get Started
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
