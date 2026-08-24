import { ScanLine, ListOrdered } from "lucide-react";

export default function TopBar({ view, setView }) {
  return (
    <header className="border-b border-line bg-panel/70 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-ink border border-line flex items-center justify-center">
            <ScanLine size={16} className="text-amber" />
          </div>
          <div className="leading-tight">
            <p className="font-display font-semibold text-[15px] tracking-tight">Screener</p>
            <p className="text-[11px] text-muted font-mono -mt-0.5">resume intelligence</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-ink border border-line rounded-lg p-1">
          <TabButton active={view === "screen"} onClick={() => setView("screen")} icon={ScanLine} label="Screen" />
          <TabButton active={view === "results"} onClick={() => setView("results")} icon={ListOrdered} label="Results" />
        </nav>
      </div>
    </header>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? "bg-panel-2 text-text" : "text-muted hover:text-text"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
