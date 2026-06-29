/**
 * Control-layer primitives. One file per primitive, one ownership boundary:
 * each owns its behavior/ARIA and maps variants to the shared `.shell-*` /
 * `.glass-*` rules, which own geometry and theming. Import everything from this
 * barrel (`../primitives`) rather than reaching into individual files.
 */
export { Glass, GlassControlGroup, type GlassProps, type GlassVariant } from "./Glass";
export { Material, type MaterialProps, type MaterialThickness } from "./Material";
export { ShellButton, ShellIconButton, type ShellButtonProps } from "./Button";
export {
  ShellSegmented,
  type SegmentedControlSize,
  type SegmentedOption,
  type SegmentedSelectionRole,
  type ShellSegmentedProps,
} from "./Segmented";
export { ShellSlider, type ShellSliderProps, type SliderTick } from "./Slider";
export { ShellSwitch } from "./Switch";
export { ShellChip, type ShellChipProps } from "./Chip";
export { ShellPanelHeader } from "./Panel";
export { ConfirmDialog } from "./ConfirmDialog";
