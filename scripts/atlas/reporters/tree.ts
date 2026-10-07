/**
 * Box-drawing tree renderer for dependency / edge views.
 */
import { BOX } from "../utils/glyphs";
import { gray } from "../utils/color";

export interface TreeNode {
  label: string;
  children?: TreeNode[];
}

export function renderTree(node: TreeNode): string {
  const out: string[] = [node.label];
  const walk = (children: TreeNode[], prefix: string): void => {
    children.forEach((child, i) => {
      const last = i === children.length - 1;
      const branch = last ? BOX.last : BOX.tee;
      out.push(`${gray(prefix + branch)} ${child.label}`);
      if (child.children?.length) {
        walk(child.children, prefix + (last ? BOX.gap : BOX.pipe));
      }
    });
  };
  walk(node.children ?? [], "");
  return out.join("\n");
}

/** A flat two-level list under a header (one level of children). */
export function renderList(header: string, items: string[]): string {
  const out = [header];
  items.forEach((item, i) => {
    const last = i === items.length - 1;
    out.push(`${gray(last ? BOX.last : BOX.tee)} ${item}`);
  });
  return out.join("\n");
}
