/* =====================================================================
   Ornements
   ---------------------------------------------------------------------
   Griffonnages, soulignés et mots manuscrits : ce qui donne à la page sa
   voix, par opposition à une grille de cartes correcte mais muette.

   Trois règles, sans exception :

   1. **Un ornement ne porte jamais d'information.** Tout est
      `aria-hidden` : une flèche griffonnée ne remplace pas un libellé, un
      souligné ne remplace pas un titre. Retirez-les tous, la page se lit
      encore.
   2. **Le texte reste du texte.** `Accent` change la police d'un mot, il
      ne le transforme pas en image : la recherche, la traduction et la
      sélection continuent de fonctionner.
   3. **L'arabe ne prend pas la manuscrite.** Caveat ne couvre pas l'arabe
      et produirait un repli illisible ; en RTL, le mot accentué garde la
      police arabe et n'est marqué que par la couleur et le souligné.
   ===================================================================== */
import type { ReactNode } from 'react';

/* --------------------------------------------------- mots manuscrits -- */

export interface AccentProps {
  children: ReactNode;
  /** Ajoute un trait tracé sous le mot. */
  underline?: boolean;
}

/**
 * Mot mis en relief : manuscrite, couleur de marque, souligné facultatif.
 *
 * Le trait est un `::after` en CSS plutôt qu'un SVG dans le flux : il suit
 * la largeur réelle du mot, y compris après traduction.
 */
export function Accent({ children, underline = false }: AccentProps) {
  return (
    <span className={`lp-accent${underline ? ' lp-accent-underline' : ''}`}>{children}</span>
  );
}

/**
 * Mot surligné.
 *
 * `box-decoration-break: clone` en CSS : si le mot passe à la ligne, les
 * deux fragments gardent chacun leurs coins arrondis au lieu d'un bloc
 * coupé net.
 */
export function Mark({ children }: { children: ReactNode }) {
  return <span className="lp-mark">{children}</span>;
}

/* --------------------------------------------------------- surtitre -- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="lp-eyebrow">{children}</p>;
}

/* ------------------------------------------------------ griffonnages -- */

type DoodleName = 'squiggle' | 'arrow' | 'sparkle' | 'heart' | 'rays' | 'dots';

/** Tracés des ornements, dans une boîte 100×100 sauf mention. */
const DOODLES: Record<DoodleName, { box: string; path: ReactNode }> = {
  /* Trait ondulé, posé sous un mot. */
  squiggle: {
    box: '0 0 120 12',
    path: (
      <path
        d="M2 8c14-7 26-7 40 0s26 7 40 0 26-7 38-1"
        fill="none"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    )
  },
  /* Flèche courbe manuscrite, pour pointer un bloc. */
  arrow: {
    box: '0 0 72 48',
    path: (
      <>
        <path
          d="M4 10c18 2 34 10 46 26"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M36 40c7 0 12-1 15-4M50 36c-1-5-3-9-6-13"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    )
  },
  /* Étoile à quatre branches. */
  sparkle: {
    box: '0 0 24 24',
    path: (
      <path
        d="M12 2c.7 5.4 3.9 8.6 9.3 9.3-5.4.7-8.6 3.9-9.3 9.3-.7-5.4-3.9-8.6-9.3-9.3C8.1 10.6 11.3 7.4 12 2z"
        strokeWidth="1.4"
      />
    )
  },
  heart: {
    box: '0 0 24 24',
    path: (
      <path
        d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20z"
        strokeWidth="1.6"
      />
    )
  },
  /* Petits rayons, à poser près d'un titre. */
  rays: {
    box: '0 0 40 40',
    path: (
      <>
        <path d="M20 3v8M20 29v8M3 20h8M29 20h8" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M8 8l5 5M27 27l5 5M32 8l-5 5M13 27l-5 5" strokeWidth="2.6" strokeLinecap="round" />
      </>
    )
  },
  /* Semis de points, pour habiller un angle. */
  dots: {
    box: '0 0 60 40',
    path: (
      <g strokeWidth="0" fill="currentColor">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <circle key={`${row}-${col}`} cx={6 + col * 12} cy={6 + row * 10} r="2.3" />
          ))
        )}
      </g>
    )
  }
};

export interface DoodleProps {
  name: DoodleName;
  /** Classe de position ; les ornements sont placés par leur contexte. */
  className?: string;
  width?: number;
}

/**
 * Ornement décoratif.
 *
 * `aria-hidden` et `focusable="false"` : rien ici n'est annoncé ni
 * atteignable au clavier. La couleur vient de `currentColor`, donc du
 * contexte — un griffonnage sur fond sombre s'éclaircit tout seul.
 */
export function Doodle({ name, className, width }: DoodleProps) {
  const doodle = DOODLES[name];
  return (
    <svg
      className={className ? `lp-doodle ${className}` : 'lp-doodle'}
      viewBox={doodle.box}
      width={width}
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {doodle.path}
    </svg>
  );
}

/* -------------------------------------------------------------- blob -- */

/**
 * Tache organique posée derrière une illustration.
 *
 * Quatre formes fixes plutôt qu'un tracé aléatoire : un décor qui change
 * à chaque rendu empêche de reconnaître une page déjà vue.
 */
const BLOBS = [
  'M43 -58C57 -47 70 -36 75 -21C80 -6 76 12 68 28C60 44 47 57 31 63C15 69 -4 67 -22 61C-40 55 -57 44 -66 28C-75 12 -75 -9 -68 -26C-61 -43 -47 -55 -31 -63C-15 -71 3 -74 18 -71C33 -68 29 -69 43 -58Z',
  'M38 -54C51 -44 63 -33 70 -19C77 -5 78 12 72 27C66 42 52 55 36 62C20 69 2 70 -15 65C-32 60 -48 49 -59 34C-70 19 -76 0 -72 -17C-68 -34 -54 -49 -38 -58C-22 -67 -3 -70 12 -68C27 -66 25 -64 38 -54Z',
  'M45 -60C59 -49 69 -34 73 -18C77 -2 75 15 67 30C59 45 45 58 29 64C13 70 -5 69 -23 63C-41 57 -59 46 -68 30C-77 14 -77 -7 -70 -24C-63 -41 -49 -54 -33 -62C-17 -70 1 -73 16 -71C31 -69 31 -71 45 -60Z',
  'M40 -56C54 -46 67 -35 73 -20C79 -5 78 13 71 29C64 45 51 58 35 64C19 70 1 69 -17 64C-35 59 -52 48 -62 33C-72 18 -75 -1 -70 -19C-65 -37 -52 -51 -36 -60C-20 -69 -1 -72 14 -70C29 -68 26 -66 40 -56Z'
];

export function Blob({ seed = 0, className }: { seed?: number; className?: string }) {
  return (
    <svg
      className={className ? `lp-blob ${className}` : 'lp-blob'}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <path d={BLOBS[Math.abs(seed) % BLOBS.length]} fill="currentColor" />
    </svg>
  );
}
