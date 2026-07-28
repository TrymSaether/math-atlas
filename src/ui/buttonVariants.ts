import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm border border-transparent text-footnote font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-destructive/20 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-primary-foreground shadow-[0_1px_1px_rgb(0_0_0/0.12),inset_0_1px_rgb(255_255_255/0.16)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]",
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_1px_1px_rgb(0_0_0/0.12),inset_0_1px_rgb(255_255_255/0.16)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]",
        bordered:
          "border-input bg-card text-foreground shadow-[0_1px_1px_rgb(0_0_0/0.08),inset_0_1px_rgb(255_255_255/0.34)] hover:bg-secondary",
        tinted: "border-primary/12 bg-primary/12 text-primary-text hover:bg-primary/18 active:bg-primary/22",
        plain: "text-primary-text hover:bg-primary/10 active:bg-primary/16",
        borderless: "text-foreground hover:bg-accent active:bg-secondary",
        destructive:
          "border-destructive bg-destructive text-white shadow-[0_1px_1px_rgb(0_0_0/0.12)] hover:bg-destructive/90 focus-visible:ring-destructive/25",
        "destructive-secondary":
          "border-destructive/18 bg-destructive/12 text-destructive hover:bg-destructive/18 focus-visible:ring-destructive/25",
        outline: "border-input bg-card text-foreground shadow-[0_1px_1px_rgb(0_0_0/0.08)] hover:bg-secondary",
        secondary: "border-input/60 bg-secondary text-secondary-foreground hover:bg-[var(--secondary-hover)]",
        ghost: "text-foreground hover:bg-accent active:bg-secondary",
        link: "border-0 text-primary-text underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        mini: "h-(--control-h-mini) gap-1 px-1.5 text-caption-2 has-[>svg]:px-1 [&_svg:not([class*='size-'])]:size-3",
        small: "h-(--control-h-sm) gap-1 px-2 text-caption-1 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        regular: "h-(--control-h-md) px-3 has-[>svg]:px-2.5",
        large: "h-(--control-h-lg) px-4 text-subhead has-[>svg]:px-3",
        default: "h-(--control-h-md) px-3 has-[>svg]:px-2.5",
        xs: "h-(--control-h-xs) gap-1 px-2 text-caption-2 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-(--control-h-sm) gap-1 px-2.5 text-caption-1 has-[>svg]:px-2",
        lg: "h-(--control-h-lg) px-4 text-subhead has-[>svg]:px-3",
        icon: "size-(--control-h-md) p-0",
        "icon-mini": "size-(--control-h-mini) p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-xs": "size-(--control-h-xs) p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-(--control-h-sm) p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-(--control-h-lg) p-0 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
