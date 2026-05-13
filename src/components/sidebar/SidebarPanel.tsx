import type { ReactNode } from "react";
import { Section } from "../ui";

export function SidebarPanel({ title, icon, aside, children }: { title: string; icon?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return <Section title={title} icon={icon} aside={aside}>{children}</Section>;
}
