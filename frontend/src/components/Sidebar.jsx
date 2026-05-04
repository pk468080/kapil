/**
 * components/Sidebar.jsx — Navigation sidebar for the dashboard.
 */

export default function Sidebar({ active, onSelect }) {
  const items = [
    { id: "search", label: "Search", icon: "🔍" },
    { id: "saved", label: "Saved", icon: "🔖" },
    { id: "history", label: "History", icon: "🕐" },
  ];

  return (
    <nav className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col py-6 px-3 gap-1 hidden sm:flex">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            active === item.id
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
