import AppLayout from "@/components/layouts/app";

const secondaryNavigation = [
  { name: "Account", href: "#", current: true },
  { name: "Domains", href: "/settings/domains", current: false },
  { name: "Billing", href: "#", current: false },
];

export default function Settings() {
  return (
    <AppLayout>
      <div>
        <header className="border-b border-white/5">
          {/* Secondary navigation */}
          <nav className="flex overflow-x-auto py-4">
            <ul
              role="list"
              className="flex min-w-full flex-none gap-x-6 px-4 text-sm font-semibold leading-6 text-muted-foreground sm:px-6 lg:px-8"
            >
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className={item.current ? 'text-emerald-500' : ''}>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        
      </div>
    </AppLayout>
  )
}