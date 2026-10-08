/* Applique titre, méta et données structurées de la page, puis annonce
   le nouveau titre aux lecteurs d'écran. */
import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { announce } from '../lib/announce';
import { applySeo, type SeoOptions } from '../lib/seo';

export function useSeo(options: SeoOptions): void {
  const { locale } = useI18n();
  /* Sérialisé : l'effet ne se relance que si le contenu change réellement. */
  const key = JSON.stringify(options);
  useEffect(() => {
    applySeo(JSON.parse(key) as SeoOptions);
    announce(document.title);
  }, [key, locale]);
}
