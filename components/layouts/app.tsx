import Sidebar from "../Sidebar";


export default function AppLayout({children}: {children: React.ReactNode}) {
  return (
    <div>
      <div className="flex flex-col lg:flex-row min-h-screen dark:bg-black bg-white">
        <Sidebar />
        <main className="lg:m-2 grow w-full bg-gray-100 dark:bg-gray-900 rounded-xl">
          {children}
        </main>
      </div>
    </div>
  )
}