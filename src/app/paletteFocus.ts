let returnFocusTarget: HTMLElement | null = null;

export function rememberPaletteReturnFocus(target: HTMLElement | null) {
  returnFocusTarget = target;
}

export function restorePaletteReturnFocus() {
  const target = returnFocusTarget;
  returnFocusTarget = null;
  if (target?.isConnected) target.focus({ preventScroll: true });
}
