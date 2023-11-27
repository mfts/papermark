import Link from 'next/link'
import Background from './background/background';

const ChangelogSection = () => {
  return (
    <div className='w-full h-[400px] flex flex-col justify-center items-center  border-2 border-white bg-gradient-to-t from-accent/40 via-accent/20 to-accent/100'>

        
        <Background />
        <Background />
    <div className="flex flex-col items-center  gap-4">
      <h2 className="font-display text-4xl font-bold tracking-tight text-black dark:text-white sm:text-5xl">
        We have got
        <span className="mx-1 bg-gradient-to-tr from-purple-500 to-rose-300 bg-clip-text text-transparent">
          {" "}
          changelogs
        </span>
        for you
      </h2>

      <div>
        <Link
          className="rounded-md bg-white text-black px-4 py-3 text-sm font-semibold  shadow-sm hover:transition-opacity hover:animate-out hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          href={"/changelog"}
        >
          Explore Changelogs
        </Link>
      </div>
    </div>
    </div>
  );
};
export default ChangelogSection;
