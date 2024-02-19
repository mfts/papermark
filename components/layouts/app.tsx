import Sidebar from "../Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-col lg:flex-row bg-gray-50 dark:bg-black min-h-screen">
        <Sidebar />
        <main className="grow w-full overflow-y-auto bg-white dark:bg-gray-900 ring-gray-200 dark:ring-gray-800 dark:border-none lg:m-2 rounded-xl ring-1">
          {children}
        </main>
      </div>
    </div>
  );
}
