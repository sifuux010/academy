/* =====================================================================
   Échappement HTML
   ---------------------------------------------------------------------
   React échappe automatiquement tout ce qui est rendu en JSX. Ces
   fonctions ne servent qu'aux documents imprimables (lib/print.ts), qui
   sont écrits dans une fenêtre séparée sous forme de chaîne HTML.
   ===================================================================== */

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
}

/** Neutralise les schémas d'URL dangereux avant insertion dans un attribut. */
export function escUrl(value: unknown): string {
  const v = String(value ?? '').trim();
  if (/^(javascript|data|vbscript):/i.test(v)) return '#';
  return esc(v);
}

/** Liens externes : n'autorise que http(s). */
export function safeExternalUrl(value: string | undefined | null): string {
  const v = String(value ?? '').trim();
  return /^https?:\/\//i.test(v) ? v : '#';
}
