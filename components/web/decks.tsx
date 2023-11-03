import Background from "./background/background";

export default function Decks() {
  return (
    <div className="bg-white mt-[-100px] px-6 py-24 sm:py-36 lg:px-8">
    
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          <span className='bg-gradient-to-tr from-purple-500 to-rose-300 bg-clip-text text-transparent'>
          2500+  {' '}
            </span>Pitchdecks
        </h2>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          that investors receive per year. How they will remember yours?
        </p>
      </div>
    </div>
  );
}
