import raw from "./data/topology.json";
import { TopoData, type TopoData as TopoDataType } from "./types";

export const data: TopoDataType = TopoData.parse(raw);
export const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
