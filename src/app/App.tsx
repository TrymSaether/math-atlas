import { ReactFlowProvider } from "@xyflow/react";
import { AppShell } from "./AppShell";
import { ShellActionsProvider } from "./ShellActions";

export default function App() {
  return (
    <ReactFlowProvider>
      <ShellActionsProvider>
        <AppShell />
      </ShellActionsProvider>
    </ReactFlowProvider>
  );
}
