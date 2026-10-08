/* =====================================================================
   Logos de la marque
   ---------------------------------------------------------------------
   Deux jeux : bicolore pour les fonds clairs (« Kine » en bleu ardoise),
   monochrome turquoise pour les fonds sombres. Le symbole seul est
   identique dans les deux cas.

   Fichiers officiels : déposez-les dans public/brand/ en .png sous les
   mêmes noms (kinedok-logo-compact.png, kinedok-logo.png,
   kinedok-logo-stacked.png, kinedok-mark.png, et leurs variantes -dark) :
   detectOfficialLogos() les détecte au démarrage et bascule dessus.
   ===================================================================== */
import type { Appearance } from '../model/common';
import { notify } from '../state/store';

export type LogoVariant = 'compact' | 'horizontal' | 'stacked' | 'mark';

const SOURCES: Record<Appearance, Record<LogoVariant, string>> = {
  light: {
    compact: '/brand/kinedok-logo-compact.svg',
    horizontal: '/brand/kinedok-logo.svg',
    stacked: '/brand/kinedok-logo-stacked.svg',
    mark: '/brand/kinedok-mark.svg'
  },
  dark: {
    compact: '/brand/kinedok-logo-compact-dark.svg',
    horizontal: '/brand/kinedok-logo-dark.svg',
    stacked: '/brand/kinedok-logo-stacked-dark.svg',
    mark: '/brand/kinedok-mark.svg'
  }
};

export function logoSource(variant: LogoVariant, appearance: Appearance): string {
  return SOURCES[appearance][variant];
}

const CANDIDATES: { variant: LogoVariant; appearance: Appearance; url: string }[] = [
  { variant: 'compact', appearance: 'light', url: '/brand/kinedok-logo-compact.png' },
  { variant: 'horizontal', appearance: 'light', url: '/brand/kinedok-logo.png' },
  { variant: 'stacked', appearance: 'light', url: '/brand/kinedok-logo-stacked.png' },
  { variant: 'mark', appearance: 'light', url: '/brand/kinedok-mark.png' },
  { variant: 'mark', appearance: 'dark', url: '/brand/kinedok-mark.png' },
  { variant: 'compact', appearance: 'dark', url: '/brand/kinedok-logo-compact-dark.png' },
  { variant: 'horizontal', appearance: 'dark', url: '/brand/kinedok-logo-dark.png' },
  { variant: 'stacked', appearance: 'dark', url: '/brand/kinedok-logo-stacked-dark.png' }
];

/** Bascule sur les fichiers officiels s'ils ont été déposés. */
export function detectOfficialLogos(): void {
  CANDIDATES.forEach((candidate) => {
    const probe = new Image();
    probe.onload = () => {
      SOURCES[candidate.appearance][candidate.variant] = candidate.url;
      notify();
    };
    probe.src = candidate.url;
  });
}
