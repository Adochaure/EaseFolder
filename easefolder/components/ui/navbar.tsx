interface NavbarProps {
  isLightMode: boolean;
}

export default function Navbar({ isLightMode }: NavbarProps) {
  const navItems = [
    {
      name: "Features",
      href: "#features",
    },
    {
      name: "How It Works",
      href: "#how-it-works",
    },
   
  ];

  return (
    <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-2">
      <div
        className={`flex max-w-full flex-wrap items-center gap-2 overflow-x-auto rounded-xl border p-1 shadow-lg backdrop-blur-2xl sm:flex-nowrap ${
          isLightMode
            ? "border-white/40 bg-white/25 text-zinc-900 shadow-black/5"
            : "border-zinc-700 bg-zinc-900/60 text-white"
        }`}
      >
        
          <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-xl" />
        

        <div
          className={`flex min-w-0 items-center gap-1 rounded-xl border ${
            isLightMode
              ? "border-white/40 bg-white/15"
              : "border-zinc-700 bg-zinc-900/80"
          }`}
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-xs transition duration-200 sm:px-4 sm:py-3 sm:text-sm ${
                isLightMode
                  ? "text-zinc-700 hover:bg-white/30 hover:text-zinc-950"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>


        <button
          type="button"
          className={`rounded-xl px-3 py-2 text-xs transition duration-200 sm:px-4 sm:py-3 sm:text-sm ${
            isLightMode
              ? "border border-white/40 bg-black text-white hover:bg-white/30"
              : "border border-zinc-700 bg-zinc-900/80 text-white hover:bg-zinc-800"
          }`}
        >
          Sign In
        </button>

        <a
          href="#create"
          className="hidden items-center justify-center rounded-xl bg-[#fffefd] px-3 py-2 text-xs font-medium text-black transition duration-200 hover:bg-[#99f3f9] sm:px-4 sm:py-3 sm:text-sm lg:flex"
        >
          <span className="text-shimmer">Create Project</span>
        </a>

        
      </div>
    </nav>
  );
}
