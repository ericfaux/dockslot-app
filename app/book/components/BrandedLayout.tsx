'use client';

interface BrandedLayoutProps {
  accentColor: string;
  children: React.ReactNode;
}

/**
 * Wraps booking page content and injects CSS custom properties for the
 * captain's brand accent color. All booking components read these variables
 * via inline style attributes since Tailwind can't generate dynamic color
 * classes at runtime.
 */
export function BrandedLayout({ accentColor, children }: BrandedLayoutProps) {
  const color = accentColor || '#0891b2';

  return (
    <div
      style={{
        '--brand-accent': color,
        '--brand-accent-hover': adjustBrightness(color, -15),
        '--brand-accent-light': color + '1a',
        '--brand-accent-ring': color + '40',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Darken or lighten a hex color by a percentage (-100 to 100). */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(255 * percent / 100);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
