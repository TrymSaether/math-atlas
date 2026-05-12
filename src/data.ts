import raw from "./data/topology.json";
import { cleanTopologyData } from "./lib/cleanTopologyData";
import { TopoData, type TopoData as TopoDataType } from "./types";

export const data: TopoDataType = cleanTopologyData(TopoData.parse(raw));
export const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
export const edgeById = new Map(data.edges.map((e) => [e.id, e]));
