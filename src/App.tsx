import { ReactFlowProvider } from "@xyflow/react";
import { AppShell } from "./components/shell/AppShell";

export default function App() {
  return (
    <ReactFlowProvider>
      <AppShell />
    </ReactFlowProvider>
  );
}
