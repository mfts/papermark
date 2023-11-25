export default function Stats({ angelsLength }: { angelsLength: any }) {
  return (
    <div className="relative mt-10">
      <div className="absolute inset-0 h-1/2" />
      <div className="relative mx-auto max-w-7xl">
        <dl className="rounded-lg bg-white shadow-lg sm:grid sm:grid-cols-4">
          <div className="flex flex-col border-b border-gray-100 p-6 text-center sm:border-0 sm:border-r">
            <dt className="order-2 mt-2 text-lg font-medium leading-6 text-gray-500">
              Angel Investors
            </dt>
            <dd className="order-1 text-5xl font-bold tracking-tight text-black">
              {angelsLength}
            </dd>
          </div>
          <div className="flex flex-col border-t border-b border-gray-100 p-6 text-center sm:border-0 sm:border-l sm:border-r">
            <dt className="order-2 mt-2 text-lg font-medium leading-6 text-gray-500">
              Average Check Size
            </dt>
            <dd className="order-1 text-5xl font-bold tracking-tight text-black">
              $45k
            </dd>
          </div>
          <div className="flex flex-col border-t border-b border-gray-100 p-6 text-center sm:border-0 sm:border-l sm:border-r">
            <dt className="order-2 mt-2 text-lg font-medium leading-6 text-gray-500">
              Confirmed Investments
            </dt>
            <dd className="order-1 text-5xl font-bold tracking-tight text-black">
              {(angelsLength * 1.5).toFixed(0)}+
            </dd>
          </div>
          <div className="flex flex-col border-t border-gray-100 p-6 text-center sm:border-0 sm:border-l">
            <dt className="order-2 mt-2 text-lg font-medium leading-6 text-gray-500">
              Open Source Projects
            </dt>
            <dd className="order-1 text-5xl font-bold tracking-tight text-black">
              25
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
