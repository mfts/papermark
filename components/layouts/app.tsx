import Sidebar from "../Sidebar";
import TrialBanner from "./trial-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black lg:flex-row">
      <Sidebar />
      <div className="h-dvh flex-1">
        {/* Trial banner shown only on trial */}
        <TrialBanner />
        <main className="h-[calc(100dvh-60px)] flex-1 lg:h-dvh lg:p-2">
          <div className="h-full overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
