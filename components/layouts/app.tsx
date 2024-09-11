import Sidebar from "../Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black lg:flex-row">
        <Sidebar />
        <main className="h-dvh flex-1 lg:p-2">
          <div className="h-full overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
