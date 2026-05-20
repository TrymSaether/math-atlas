import { LearningStatePanel } from "../sidebar/LearningStatePanel";
import type { LoadedMap } from "../../data/loadMap";

export function ProgressSection({ loaded }: { loaded: LoadedMap }) {
  return <LearningStatePanel data={loaded.data} />;
}
