import { GitBranchPlus, GitMerge, Sparkles } from "lucide-react";
import { Button, Section } from "../ui";
import { useStore } from "../../store";

export function HighlightPanel() {
  const highlight = useStore((s) => s.highlight);
  const setHighlight = useStore((s) => s.setHighlight);

  return (
    <Section title="Highlight" icon={<Sparkles className="h-3 w-3" />}>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={highlight === "immediate" ? "primary" : "quiet"} onClick={() => setHighlight("immediate")}><GitBranchPlus className="h-3.5 w-3.5" />Immediate</Button>
        <Button variant={highlight === "full" ? "primary" : "quiet"} onClick={() => setHighlight("full")}><GitMerge className="h-3.5 w-3.5" />Full path</Button>
      </div>
    </Section>
  );
}
