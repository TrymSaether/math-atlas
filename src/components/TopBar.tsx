import { CircleHelp, Compass, Search, Sun, UserCircle } from "lucide-react";
import { useStore } from "../store";

const navItems = ["Map", "Library", "Notes", "Paths", "Groups"];

export function TopBar() {
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);

  return (
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">
        <Compass className="h-5 w-5" />
      </div>

      <div className="brand-copy">
        <div className="brand-title">Topology Map</div>
        <div className="brand-subtitle">Concepts &amp; Dependencies</div>
      </div>

      <label className="top-search">
        <Search className="h-4 w-4" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search concepts, theorems, definitions..."
          aria-label="Search concepts"
        />
        <kbd>⌘K</kbd>
      </label>

      <nav className="top-nav" aria-label="Primary">
        {navItems.map((item) => (
          <button key={item} className={item === "Map" ? "active" : ""}>
            {item}
          </button>
        ))}
      </nav>

      <div className="top-actions" aria-label="Utilities">
        <button title="Help" aria-label="Help">
          <CircleHelp className="h-4 w-4" />
        </button>
        <button title="Light mode" aria-label="Light mode">
          <Sun className="h-4 w-4" />
        </button>
        <button title="Account" aria-label="Account">
          <UserCircle className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
