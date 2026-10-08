/* Annonce un message aux lecteurs d'écran via la région live #sr-live
   (rendue par la mise en page racine). */
export function announce(message: string): void {
  const live = document.getElementById('sr-live');
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => {
    live.textContent = message;
  }, 40);
}
