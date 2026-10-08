/* =====================================================================
   Réactivité des services
   ---------------------------------------------------------------------
   Les services (auth, activité, abonnements, contenus) écrivent dans le
   stockage puis appellent notify(). Tout composant qui appelle
   useStoreVersion() se redessine alors — la mise en page racine l'appelle,
   ce qui rend toute l'interface réactive sans bibliothèque d'état.
   En production, ce rôle revient à TanStack Query (invalidation après
   mutation) : les services gardent la même signature.
   ===================================================================== */
import { useSyncExternalStore } from 'react';

let version = 0;
const listeners = new Set<() => void>();

export function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getVersion(): number {
  return version;
}

/** Numéro de version du stockage ; change à chaque mutation. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/* Synchronisation entre onglets : une connexion ou un favori ajouté dans
   un autre onglet met à jour celui-ci. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('ka.')) notify();
  });
}
