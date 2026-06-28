/**
 * Control-layer primitives. One file per primitive, one ownership boundary:
 * each owns its behavior/ARIA and maps variants to the shared `.shell-*` /
 * `.glass-*` rules, which own geometry and theming. Import everything from this
 * barrel (`../primitives`) rather than reaching into individual files.
 */
export { Glass, GlassControlGroup, type GlassMaterial, type GlassProps } from "./Glass";
export { ShellButton, ShellIconButton, type ShellButtonProps } from "./Button";
export { ShellSegmented } from "./Segmented";
export { ShellSwitch } from "./Switch";
export { ShellChip, type ShellChipProps } from "./Chip";
export { ShellPanelHeader } from "./Panel";
export { ConfirmDialog } from "./ConfirmDialog";
