import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useStore } from "../../store";
import { NodeEditorPanel } from "../authoring/NodeEditorPanel";
import { Glass } from "./Glass";
import { ShellButton } from "./Controls";

/**
 * Shell-native Edit Mode inspector. The authoring engine still lives in
 * `NodeEditorPanel`; this component owns where editing appears in the Liquid Glass
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

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key={editingId ?? "new"}
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="shell-dock shell-dock-left pointer-events-auto"
        >
          <Glass
            material="thick"
            className="shell-panel edit-inspector flex h-full w-[min(460px,calc(100vw-24px))] flex-col"
          >
            <NodeEditorPanel editingId={editingId} map={map} mapId={mapId} onClose={close} />
          </Glass>
        </motion.aside>
      ) : (
        <motion.aside
          key="empty"
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="shell-dock shell-dock-left pointer-events-auto"
        >
          <Glass
            material="thick"
            className="shell-panel flex w-[min(340px,calc(100vw-24px))] flex-col gap-3 px-4 py-4"
            role="dialog"
            aria-label="Edit mode"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-fg-2">
              <PencilSimpleIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-fg-1">Edit mode</h2>
              <p className="mt-1 text-ui-sm leading-relaxed text-fg-3">
                Select a concept to inspect its source, relations, proof steps, and examples.
              </p>
            </div>
            <ShellButton
              primary
              className="min-h-[44px] rounded-full px-3"
              onClick={() => openNodeEditor({ mode: "create" })}
            >
              <PlusIcon className="h-4 w-4" weight="bold" />
              New concept
            </ShellButton>
          </Glass>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
