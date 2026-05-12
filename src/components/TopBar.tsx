import { Compass, Search } from "lucide-react";
import { useStore } from "../store";

export function TopBar() {
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);

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
        <button
          type="button"
          className="top-search-kbd"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
        >
          ⌘K
        </button>
      </label>
    </header>
  );
}
