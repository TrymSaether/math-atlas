import { useDeferredValue, useMemo } from "react";
import { useViewport } from "reactflow";

export type SemanticDetail = "dot" | "title" | "card";

export function useSemanticDetail(): SemanticDetail {
  const { zoom } = useViewport();
  const deferredZoom = useDeferredValue(zoom);

  return useMemo(() => {
    if (deferredZoom < 0.38) return "dot";
    if (deferredZoom < 0.84) return "title";
    return "card";
  }, [deferredZoom]);
}
