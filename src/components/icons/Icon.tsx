/* Jeu d'icônes linéaires (1,7 px, coins arrondis), sans dépendance.
   Les tracés sont des constantes du code source : leur injection est sûre. */
import { ICON_PATHS, type IconName } from './paths';

export type { IconName };

interface IconProps {
  name: IconName;
  size?: number;
  /** « icon-flip » retourne l'icône en RTL (flèches, chevrons). */
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );
}
