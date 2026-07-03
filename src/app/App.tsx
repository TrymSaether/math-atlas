import { ReactFlowProvider } from "@xyflow/react";
import { AppShell } from "./AppShell";

export default function App() {
  return (
    <ReactFlowProvider>
      <AppShell />
    </ReactFlowProvider>
  );
}
