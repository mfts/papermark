import Sidebar from "../Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-black">
        <Sidebar />
        <main className="lg:m-2 grow w-full bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
}
