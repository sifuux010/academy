/* =====================================================================
   Visuel de couverture
   ---------------------------------------------------------------------
   Les contenus n'ont pas encore d'image propre. À défaut, la carte prend
   le visuel **de sa rubrique** : un bilan montre une tablette d'évaluation,
   un webinaire une session en direct, une ressource une bibliothèque de
   fichiers.

   Choisir par rubrique plutôt qu'au hasard donne au visuel un sens : la
   couverture annonce la nature du contenu avant même la lecture du titre,
   et une rangée mixte se trie à l'œil.

   Dès qu'un contenu reçoit son propre visuel (`coverUrl`), celui-ci prend
   la place — la banque n'est qu'un repli.
   ===================================================================== */

/**
 * Visuel par rubrique.
 *
 * Les trois premiers illustrent directement leur section ; les trois
 * autres reprennent les visuels d'apprentissage, faute d'illustration
 * dédiée. Déposer un fichier dans `public/covers/` et l'inscrire ici
 * suffit à en changer.
 */
const SECTION_COVER: Record<string, string> = {
  resources: '/covers/documents.webp',
  tools: '/covers/bilans.webp',
  webinars: '/covers/webinaires.webp',
  courses: '/covers/apprentissage-ia.webp',
  exercises: '/covers/apprentissage-connecte.webp',
  pathologies: '/covers/clinique-hologrammes.webp'
};

const DEFAULT_COVER = '/covers/documents.webp';

export interface CoverArtProps {
  /** Image propre au contenu : elle a toujours la priorité. */
  src?: string;
  /** Rubrique du contenu — détermine le visuel de repli. */
  section?: string;
  /** Conservés pour la signature, sans effet depuis le passage aux photos. */
  seed?: string;
  specialty?: string;
  region?: string;
  /**
   * Décrit l'image seulement lorsqu'elle est propre au contenu. Un visuel
   * de rubrique est décoratif : il illustre sans informer, et le décrire
   * reviendrait à répéter la rubrique déjà écrite sur la carte.
   */
  alt?: string;
}

export function CoverArt({ src, section, alt }: CoverArtProps) {
  if (src) {
    return <img className="lp-cover-img" src={src} alt={alt ?? ''} loading="lazy" />;
  }

  const cover = SECTION_COVER[section ?? ''] ?? DEFAULT_COVER;
  return <img className="lp-cover-img" src={cover} alt="" loading="lazy" />;
}
