const SIDEBAR_ITEMS = [
  { id: "zodiac", label: "Zodiac Compatibility" },
  { id: "storyteller", label: "Storyteller" },
  { id: "dreammaker", label: "Dreammaker" },
  { id: "notes", label: "Notes" },
];

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-700 via-indigo-800 to-indigo-900 text-white flex flex-col shadow-lg min-h-screen">
      <div className="p-6 border-b border-indigo-600">
        <h2 className="text-2xl font-extrabold tracking-wide">Dreamweaver</h2>
      </div>
      <nav className="flex flex-col flex-grow mt-4">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`text-left px-6 py-4 m-1 rounded-lg transition-colors duration-300
              ${
                active === item.id
                  ? "bg-indigo-500 shadow-lg font-semibold"
                  : "hover:bg-indigo-600 hover:shadow-md"
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-indigo-600 text-sm opacity-70">
        &copy; 2025 Your Company
      </div>
    </aside>
  );
}
