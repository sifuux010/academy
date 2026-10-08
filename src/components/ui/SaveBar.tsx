/* =====================================================================
   Barre d'action collée au bas de l'écran pendant la saisie
   ---------------------------------------------------------------------
   Portée de `StickySaveBar` sur kinedok.dz, et pour la même raison :

   `position: sticky` ne suffit pas. La barre est le dernier élément de la
   page — il ne reste rien sous elle sur quoi « coller », et elle dérive
   avec le contenu au lieu de rester à l'écran.

   Elle est donc **fixe**, et sa largeur est recalée sur celle de la
   colonne qui la contient : mesurée au montage, puis suivie par un
   `ResizeObserver` et au défilement, parce que la colonne bouge quand le
   tiroir de navigation s'ouvre ou que la fenêtre change.

   Un bloc fantôme réserve sa hauteur dans le flux : sans lui, la barre
   recouvrirait le dernier champ du formulaire.
   ===================================================================== */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export function SaveBar({ children }: { children: ReactNode }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const parent = anchorRef.current?.parentElement;
    if (!parent) return undefined;

    const update = () => {
      const rect = parent.getBoundingClientRect();
      setBox({ left: rect.left, width: rect.width });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(parent);
    observer.observe(document.documentElement);
    window.addEventListener('resize', update);
    /* `true` : le défilement d'un conteneur interne compte aussi. */
    window.addEventListener('scroll', update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);

  return (
    <>
      <div ref={anchorRef} className="ws-savebar-spacer" aria-hidden="true" />
      <div
        className="ws-savebar"
        style={box ? { left: box.left, width: box.width } : { insetInline: 12 }}
      >
        {children}
      </div>
    </>
  );
}
