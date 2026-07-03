import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pencil, Plus } from "lucide-react";
import { useStore } from "@/app/store";
import { NodeEditorPanel } from "./NodeEditorPanel";
import { Button } from "@/ui/button";
import { Surface } from "@/design";

/**
 * Shell-native Edit Mode inspector. The authoring engine still lives in
 * `NodeEditorPanel`; this component owns where editing appears in the material
 * shell and how empty/selected/create states are entered.
 */
export function EditInspector() {
  const reduceMotion = useReducedMotion();
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const selectedId = useStore((s) => s.selectedId);
  const nodeEditor = useStore((s) => s.nodeEditor);
  const openNodeEditor = useStore((s) => s.openNodeEditor);
  const closeNodeEditor = useStore((s) => s.closeNodeEditor);
  const select = useStore((s) => s.select);

  if (!map) return null;

  const editingId = nodeEditor?.mode === "create" ? null : nodeEditor?.mode === "edit" ? nodeEditor.nodeId : selectedId;
  const open = nodeEditor !== null || selectedId !== null;

  const close = () => {
    if (nodeEditor) closeNodeEditor();
    else select(null);
  };

  const transition = { duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.7, 0.2, 1] } as const;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key={editingId ?? "new"}
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
          transition={transition}
          className="ds-panel ds-panel--left"
        >
          <Surface material="thick" className="flex h-full w-[min(460px,calc(100vw-24px))] flex-col">
            <NodeEditorPanel editingId={editingId} map={map} mapId={mapId} onClose={close} />
          </Surface>
        </motion.aside>
      ) : (
        <motion.aside
          key="empty"
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
          transition={transition}
          className="ds-panel ds-panel--left"
        >
          <Surface
            material="thick"
            className="flex w-[min(340px,calc(100vw-24px))] flex-col gap-3 px-4 py-4"
            role="dialog"
            aria-label="Edit mode"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
              <Pencil className="size-4" />
            </div>
            <div>
              <h2 className="text-title-3 font-semibold text-foreground">Edit mode</h2>
              <p className="mt-1 text-footnote leading-relaxed text-muted-foreground">
                Select a concept to inspect its source, relations, proof steps, and examples.
              </p>
            </div>
            <Button className="gap-1.5" onClick={() => openNodeEditor({ mode: "create" })}>
              <Plus className="size-4" />
              New concept
            </Button>
          </Surface>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
