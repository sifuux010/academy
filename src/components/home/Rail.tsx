/* =====================================================================
   Rail — rangée de cartes qui défile horizontalement
   ---------------------------------------------------------------------
   Le défilement natif fait le gros du travail : `scroll-snap` au doigt et
   à la molette, flèches en complément sur grand écran. Les flèches sont
   masquées aux lecteurs d'écran (`aria-hidden`) parce qu'elles ne font que
   dupliquer un déplacement déjà possible au clavier — la rangée est
   focusable et se parcourt à la flèche directionnelle.

   Le sens de défilement suit la direction du document : en arabe, « page
   suivante » va vers la gauche, et `scrollLeft` est négatif.
   ===================================================================== */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';

interface RailProps {
  children: ReactNode;
  /** Nom de la rangée, lu par les technologies d'assistance. */
  label: string;
  /**
   * `panel` élargit les colonnes : un panneau groupé tient trois lignes
   * de contenu, il lui faut la largeur d'une colonne de lecture, pas
   * celle d'une carte.
   */
  variant?: 'card' | 'panel';
}

export function Rail({ children, label, variant = 'card' }: RailProps) {
  const { dir } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [pages, setPages] = useState(1);
  const [index, setIndex] = useState(0);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // En RTL, `scrollLeft` part de 0 et devient négatif : on raisonne sur
    // sa valeur absolue pour n'écrire qu'une seule logique.
    const offset = Math.abs(track.scrollLeft);
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(offset <= 1);
    setAtEnd(max <= 1 || offset >= max - 1);

    /* La pagination compte des écrans, pas des panneaux : un « point »
       correspond à ce qu'un coup de pouce fait défiler. Compter les
       panneaux donnerait huit points pour trois positions réelles. */
    const width = track.clientWidth;
    setPages(width > 0 ? Math.max(1, Math.ceil(track.scrollWidth / width)) : 1);
    setIndex(width > 0 ? Math.round(offset / width) : 0);
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, children]);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const step = Math.max(240, track.clientWidth * 0.8);
    track.scrollBy({ left: step * direction * (dir === 'rtl' ? -1 : 1), behavior: 'smooth' });
  };

  const goTo = (page: number) => {
    const track = trackRef.current;
    if (!track) return;
    const offset = page * track.clientWidth;
    track.scrollTo({ left: dir === 'rtl' ? -offset : offset, behavior: 'smooth' });
  };

  const hasOverflow = !(atStart && atEnd);

  return (
    <div className={variant === 'panel' ? 'lp-rail lp-rail-panels' : 'lp-rail'}>
      {hasOverflow ? (
        <button
          type="button"
          className="lp-rail-arrow lp-rail-arrow-start"
          onClick={() => scrollBy(-1)}
          disabled={atStart}
          aria-hidden="true"
          tabIndex={-1}
        >
          <Icon name="chevronLeft" size={20} />
        </button>
      ) : null}

      <div
        className="lp-rail-track"
        ref={trackRef}
        onScroll={measure}
        tabIndex={0}
        role="group"
        aria-label={label}
      >
        {children}
      </div>

      {hasOverflow ? (
        <button
          type="button"
          className="lp-rail-arrow lp-rail-arrow-end"
          onClick={() => scrollBy(1)}
          disabled={atEnd}
          aria-hidden="true"
          tabIndex={-1}
        >
          <Icon name="chevronRight" size={20} />
        </button>
      ) : null}

      {/* Les pastilles disent où l'on en est — ce que les flèches, elles,
          ne montrent pas. Elles restent de vrais boutons : contrairement
          aux flèches, elles mènent quelque part qu'on ne peut pas
          atteindre autrement d'un seul geste. */}
      {variant === 'panel' && pages > 1 ? (
        <div className="lp-dots lp-rail-dots" role="tablist" aria-label={label}>
          {Array.from({ length: pages }, (_, page) => (
            <button
              key={page}
              type="button"
              role="tab"
              className={`lp-dot${page === index ? ' is-active' : ''}`}
              aria-current={page === index}
              aria-label={`${page + 1} / ${pages}`}
              onClick={() => goTo(page)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
