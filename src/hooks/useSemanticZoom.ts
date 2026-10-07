import { useDeferredValue, useMemo } from "react";
import { useViewport } from "reactflow";

export type SemanticDetail = "dot" | "title" | "card";

export function useSemanticDetail(): SemanticDetail {
  const { zoom } = useViewport();
  const deferred = useDeferredValue(zoom);
  return useMemo(() => {
    if (deferred < 0.4) return "dot";
    if (deferred < 0.9) return "title";
    return "card";
  }, [deferred]);
}
