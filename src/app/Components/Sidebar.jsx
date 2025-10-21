const SIDEBAR_ITEMS = [
  { id: "zodiac", label: "Zodiac Compatibility" },
  { id: "storyteller", label: "User Profile" },
  { id: "dreammaker", label: "Dreammaker" },
  { id: "notes", label: "Notes" },
  { id: "cardgame", label: "Mystic Elements" },
];

export default function Sidebar({
  active,
  setActive,
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogin,
  onLogout,
  onProfileOpen,
}) {
  const handleProfileOrStorytellerClick = () => {
    if (user) {
      onProfileOpen?.();
    } else {
      setActive("storyteller");
    }
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet, shown on large screens */}
      <aside className="hidden lg:flex lg:w-64 bg-gradient-to-b from-indigo-700 via-indigo-800 to-indigo-900 text-white flex-col shadow-lg min-h-screen">
        <div className="p-6 border-b border-indigo-600">
          <h2 className="text-2xl font-extrabold tracking-wide">Dreamweaver</h2>
          {user && (
            <div className="mt-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-indigo-200">
                  Welcome, {user.username}
                </span>
              </div>
            </div>
          )}
        </div>
        <nav className="flex flex-col flex-grow mt-4">
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
              className={`text-left px-6 py-4 m-1 rounded-lg transition-colors duration-300
                ${
                  active === item.id
                    ? "bg-indigo-500 shadow-lg font-semibold"
                    : "hover:bg-indigo-600 hover:shadow-md"
                }`}
            >
              {item.id === "storyteller" && user ? "Your Profile" : item.label}
            </button>
          ))}
        </nav>

        {/* Authentication Section */}
        <div className="p-6 border-t border-indigo-600">
          {user ? (
            <button
              onClick={onLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all duration-300"
            >
              Sign In
            </button>
          )}
        </div>

        <div className="px-6 pb-6 text-sm opacity-70">
          &copy; 2025 Your Company
        </div>
      </aside>

      {/* Mobile/Tablet Top Navigation - Hidden on large screens */}
      <div className="lg:hidden relative">
        {/* Top Header with Toggle Button */}
        <header className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shadow-lg z-50 relative">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide">
                Dreamweaver
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
        </header>

        {/* Dropdown Navigation */}
        <nav
          className={`bg-gradient-to-b from-indigo-800 to-indigo-900 text-white shadow-lg transform transition-all duration-300 ease-in-out overflow-hidden z-40 ${
            sidebarOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-4 space-y-2">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "storyteller") {
                    handleProfileOrStorytellerClick();
                  } else {
                    setActive(item.id);
                  }
                  setSidebarOpen(false); // Close sidebar after selection
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-300 block
                  ${
                    active === item.id
                      ? "bg-indigo-500 shadow-lg font-semibold"
                      : "hover:bg-indigo-600 hover:shadow-md"
                  }`}
              >
                {item.id === "storyteller" && user
                  ? "Your Profile"
                  : item.label}
              </button>
            ))}

            {/* Authentication Button in Mobile Menu */}
            <div className="pt-2 border-t border-indigo-600">
              {user ? (
                <button
                  onClick={() => {
                    onLogout?.();
                    setSidebarOpen(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    onLogin?.();
                    setSidebarOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Footer in dropdown */}
          <div className="px-6 py-4 border-t border-indigo-600 text-sm opacity-70">
            &copy; 2025 Your Company
          </div>
        </nav>
      </div>
    </>
  );
}
