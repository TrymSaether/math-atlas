import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/** Standard panel header: a title plus an optional trailing action cluster. */
export function ShellPanelHeader({
  title,
  children,
  className,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={cn("shell-panel-header", className)} {...rest}>
      <span className="shell-panel-title">{title}</span>
      {children && <div className="shell-panel-actions">{children}</div>}
    </header>
  );
}
