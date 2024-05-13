import Sidebar from "../Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black lg:flex-row">
        <Sidebar />
        <main className="w-full grow overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800 lg:m-2">
          {children}
        </main>
      </div>
    </div>
  );
}
