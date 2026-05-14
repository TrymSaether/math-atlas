import type { GraphData } from "../types";
import { Panel, Badge } from "./ui";
import { BrandMark } from "./topbar/BrandMark";
import { MapSwitcher } from "./topbar/MapSwitcher";
import { CommandButton } from "./topbar/CommandButton";

export function TopBar({ map }: { map: GraphData }) {
  return (
    <Panel as="header" className="mb-4 flex h-16 w-full items-center justify-between px-4">
      <BrandMark />
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 md:flex">
          <Badge tone="muted">{map.nodes.length} concepts</Badge>
          <Badge tone="muted">{map.edges.length} links</Badge>
        </div>
        <MapSwitcher />
        <CommandButton />
      </div>
    </Panel>
  );
}
