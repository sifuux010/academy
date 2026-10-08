/* =====================================================================
   Apparition au défilement
   ---------------------------------------------------------------------
   Un `IntersectionObserver` pose `data-revealed` sur l'élément dès qu'il
   entre dans la fenêtre ; le CSS fait le reste. L'observateur se
   débranche aussitôt après : une section déjà vue ne doit pas rejouer son
   entrée si on remonte.

   Deux garde-fous, parce qu'une animation d'apparition est l'un des
   motifs les plus faciles à rendre nuisible :

   - si la personne a demandé moins de mouvement, l'élément est révélé
     immédiatement, sans transition ;
   - si l'API n'existe pas, l'élément est révélé aussi. Le contenu n'est
     jamais masqué par défaut au point d'être perdu si le script échoue.
   ===================================================================== */
import { useEffect, useRef, type RefObject } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';

export function useReveal<T extends HTMLElement = HTMLDivElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reveal = () => node.setAttribute('data-revealed', 'true');

    const prefersReduced =
      typeof window.matchMedia === 'function' && window.matchMedia(REDUCED).matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      reveal();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal();
          observer.disconnect();
        });
      },
      // Déclenché un peu avant le bord : l'élément est déjà en place quand
      // il devient visible, plutôt que d'apparaître sous les yeux.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Suivi du curseur sur une carte.
 *
 * Écrit la position du pointeur dans deux variables CSS, que la carte
 * utilise pour placer une lueur. Tout le rendu reste en CSS : le
 * JavaScript ne fait que transmettre deux nombres.
 *
 * Ignoré au doigt et au stylet — un halo qui suit le toucher n'apporte
 * rien et coûte des rendus.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (
      typeof window.matchMedia === 'function' &&
      (window.matchMedia(REDUCED).matches || !window.matchMedia('(hover: hover)').matches)
    ) {
      return undefined;
    }

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const box = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${((event.clientX - box.left) / box.width) * 100}%`);
        node.style.setProperty('--my', `${((event.clientY - box.top) / box.height) * 100}%`);
      });
    };

    const onLeave = () => {
      node.style.removeProperty('--mx');
      node.style.removeProperty('--my');
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}
