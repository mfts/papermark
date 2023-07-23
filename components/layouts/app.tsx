import Sidebar from "../Sidebar";


export default function AppLayout({children}: {children: React.ReactNode}) {
  return (
    <div>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-tl from-black to-gray-950">
        <Sidebar />
        <main className="lg:m-2 grow w-full bg-gray-900 shadow rounded-xl">
          {children}
        </main>
      </div>
    </div>
  )
}