const SIDEBAR_ITEMS = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "zodiac", label: "Zodiac Compatibility", icon: "♈" },
  { id: "friends", label: "Friends", icon: "👥" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "dreammaker", label: "Dreammaker", icon: "🌙" },
  { id: "cardgame", label: "Mystic Elements", icon: "🧠" },
  { id: "storyteller", label: "Profile", icon: "✨" },
];

export default function Sidebar({
  active,
  setActive,
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogin,
  onLogout,
}) {
  const handleProfileOrStorytellerClick = () => {
    setActive("storyteller");
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet, shown on large screens */}
      <aside className="hidden lg:flex lg:w-64 bg-gradient-to-b from-purple-950 via-indigo-950 to-blue-950 text-white flex-col shadow-2xl border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🌟</span>
            <h2 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Stargazer
            </h2>
          </div>
          {user && (
            <div className="mt-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <span className="text-xs font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-purple-200 truncate">
                  {user.username}
                </span>
              </div>
            </div>
          )}
        </div>
        <nav className="flex flex-col flex-grow mt-2 px-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "storyteller") {
                  handleProfileOrStorytellerClick();
                } else {
                  setActive(item.id);
                }
              }}
              className={`text-left px-4 py-3 my-0.5 rounded-lg transition-all duration-200 flex items-center gap-3
                ${
                  active === item.id
                    ? "bg-gradient-to-r from-purple-600/80 to-indigo-600/80 shadow-lg shadow-purple-900/50 font-semibold text-white border border-purple-500/30"
                    : "hover:bg-white/10 text-purple-200 hover:text-white"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Authentication Section */}
        <div className="p-4 border-t border-white/10">
          {user ? (
            <button
              onClick={onLogout}
              className="w-full bg-red-600/80 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm border border-red-500/30 hover:border-red-400"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm shadow-lg shadow-purple-900/50"
            >
              Sign In
            </button>
          )}
        </div>

        <div className="px-6 pb-4 text-xs text-purple-400/60 text-center">
          &copy; 2025 Stargazer
        </div>
      </aside>

      {/* Mobile/Tablet Top Navigation - Hidden on large screens */}
      <div className="lg:hidden">
        {/* Top Header with Toggle Button */}
        <header className="bg-gradient-to-r from-purple-950 via-indigo-950 to-blue-950 text-white shadow-lg border-b border-white/10 z-50 relative">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                🌟 Stargazer
              </h1>
              {user && (
                <div className="text-xs text-indigo-200 mt-1">
                  Welcome, {user.username}
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="Toggle navigation menu"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  sidebarOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Dropdown Navigation — absolutely positioned so it overlays content */}
          <div
            className={`absolute left-0 right-0 top-full z-50 transition-all duration-300 ease-in-out overflow-hidden ${
              sidebarOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <nav className="bg-gradient-to-b from-purple-950 to-blue-950 text-white shadow-2xl border-b border-white/10">
              <div className="px-4 py-3 space-y-1">
                {SIDEBAR_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "storyteller") {
                        handleProfileOrStorytellerClick();
                      } else {
                        setActive(item.id);
                      }
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3
                      ${
                        active === item.id
                          ? "bg-gradient-to-r from-purple-600/80 to-indigo-600/80 font-semibold text-white border border-purple-500/30"
                          : "hover:bg-white/10 text-purple-200 hover:text-white"
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm">
                      {item.id === "storyteller" && user
                        ? "Profile"
                        : item.label}
                    </span>
                  </button>
                ))}

                {/* Authentication Button in Mobile Menu */}
                <div className="pt-2 border-t border-white/10">
                  {user ? (
                    <button
                      onClick={() => {
                        onLogout?.();
                        setSidebarOpen(false);
                      }}
                      className="w-full bg-red-600/80 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm border border-red-500/30"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onLogin?.();
                        setSidebarOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              {/* Footer in dropdown */}
              <div className="px-6 py-3 border-t border-white/10 text-xs text-purple-400/60 text-center">
                &copy; 2025 Stargazer
              </div>
            </nav>
          </div>
        </header>

        {/* Backdrop — closes menu when tapping outside */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}
