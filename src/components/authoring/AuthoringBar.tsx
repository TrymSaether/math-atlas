import { useRef, useState } from "react";
import {
  PlusIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useStore } from "../../store";
import { MAPS } from "../../data";

/**
 * Floating authoring toolbar, shown only in edit mode. Create nodes, and manage
 * the local edit overlay: export the edited source (to commit back into the real
 * build pipeline), import a source file, or revert to the built-in map.
 */
export function AuthoringBar() {
  const editMode = useStore((s) => s.editMode);
  const mapId = useStore((s) => s.mapId);
  const editedMaps = useStore((s) => s.editedMaps);
  const openNodeEditor = useStore((s) => s.openNodeEditor);
  const currentEditSource = useStore((s) => s.currentEditSource);
  const importSource = useStore((s) => s.importSource);
  const revertMap = useStore((s) => s.revertMap);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!editMode) return null;
  const isEdited = editedMaps.has(mapId);

  const exportSource = () => {
    const source = currentEditSource();
    if (!source) return;
    const blob = new Blob([JSON.stringify(source, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapId}.source.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        const result = importSource(parsed);
        setNotice(result.ok ? "Imported." : `Import failed: ${result.error}`);
      } catch {
        setNotice("Import failed: not valid JSON.");
      }
      window.setTimeout(() => setNotice(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      {notice && (
        <div
          className="pointer-events-auto rounded-[var(--radius-md)] border px-3 py-1.5 text-ui-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-2)", boxShadow: "var(--shadow-2)" }}
        >
          {notice}
        </div>
      )}
      <div
        className="map-popover pointer-events-auto flex items-center gap-1 rounded-[var(--radius-xl)] p-1.5"
        style={{ boxShadow: "var(--shadow-3)" }}
      >
        <span className="flex items-center gap-1.5 px-2 font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--accent)" }}>
          <PencilSimpleIcon className="h-3.5 w-3.5" weight="fill" />
          Editing
        </span>
        <div className="mx-0.5 h-5 w-px" style={{ background: "var(--border)" }} />
        <BarButton label="New concept" onClick={() => openNodeEditor({ mode: "create" })} primary>
          <PlusIcon className="h-4 w-4" /> New
        </BarButton>
        <BarButton label="Export source JSON" onClick={exportSource}>
          <DownloadSimpleIcon className="h-4 w-4" /> Export
        </BarButton>
        <BarButton label="Import source JSON" onClick={() => fileRef.current?.click()}>
          <UploadSimpleIcon className="h-4 w-4" /> Import
        </BarButton>
        {isEdited &&
          (confirmRevert ? (
            <span className="flex items-center gap-1 pl-1 text-ui-xs" style={{ color: "var(--fg-2)" }}>
              Discard local edits?
              <button
                type="button"
                onClick={() => {
                  void revertMap();
                  setConfirmRevert(false);
                }}
                className="rounded-[var(--radius-sm)] px-2 py-1 font-semibold"
                style={{ color: "var(--danger, #c0392b)" }}
              >
                Revert
              </button>
              <button type="button" onClick={() => setConfirmRevert(false)} className="px-1" style={{ color: "var(--fg-3)" }}>
                No
              </button>
            </span>
          ) : (
            <BarButton label={`Revert ${MAPS[mapId].label} to built-in`} onClick={() => setConfirmRevert(true)}>
              <ArrowCounterClockwiseIcon className="h-4 w-4" /> Revert
            </BarButton>
          ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function BarButton({
  label,
  onClick,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex items-center gap-1.5 rounded-[var(--radius-lg)] px-2.5 py-1.5 text-ui-sm font-medium transition-colors"
      style={
        primary
          ? { background: "var(--accent)", color: "var(--fg-on-color)" }
          : { color: "var(--fg-2)" }
      }
    >
      {children}
    </button>
  );
}
