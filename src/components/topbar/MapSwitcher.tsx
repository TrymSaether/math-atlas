import { Select } from "../ui";
import { MAPS, type MapId } from "../../data";
import { useStore } from "../../store";

export function MapSwitcher() {
  const mapId = useStore((s) => s.mapId);
  const setMapId = useStore((s) => s.setMapId);

  return (
    <Select value={mapId} onChange={(event) => setMapId(event.target.value as MapId)} aria-label="Select mathematical map" className="min-w-[210px]">
      {Object.values(MAPS).map((entry) => (
        <option key={entry.id} value={entry.id} className="bg-ink-950 text-white">
          {entry.label}
        </option>
      ))}
    </Select>
  );
}
