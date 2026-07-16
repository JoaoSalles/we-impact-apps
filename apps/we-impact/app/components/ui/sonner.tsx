import { Toaster as Sonner, type ToasterProps } from "sonner";

// The app follows the OS color scheme via `color-scheme` (see app.css), so we
// don't wire a theme provider here — Sonner reads the design tokens below.
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
