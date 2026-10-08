/* =====================================================================
   Mise en page racine d'une langue : /fr/*, /en/*, /ar/*
   ---------------------------------------------------------------------
   - valide le segment de langue (sinon redirige en le préfixant) ;
   - applique lang et dir sur <html> (vrai RTL en arabe) ;
   - fournit modales et notifications ;
   - remonte en haut de page et journalise la page vue à chaque navigation.
   ===================================================================== */
import { useEffect, useLayoutEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import { detectLocale, dirOf, isLocale, persistLocale } from '../../i18n/core';
import { LocaleProvider, useI18n } from '../../i18n/I18nContext';
import { trackPageView } from '../../lib/analytics';
import { ModalProvider } from '../feedback/ModalProvider';
import { ToastProvider } from '../feedback/ToastProvider';
import { Footer } from './Footer';
import { Header } from './Header';

/*
   Écrans sans pied de page : l'authentification et l'espace connecté.

   Les deux sont des outils, pas des pages de site. L'authentification n'a
   qu'une issue — remplir le formulaire ; l'espace membre porte déjà sa
   propre navigation dans la colonne de gauche. Un pied de page de quatre
   colonnes y ouvrirait trente sorties concurrentes, et son grand aplat
   sombre couperait la page juste sous le contenu.

   Les mentions légales restent atteignables : le formulaire les lie
   lui-même, et l'espace membre les retrouve par l'en-tête du site.

   La comparaison porte sur le premier segment après la langue, ce qui
   couvre les sous-pages d'un coup (`dashboard/formations`, `profil/
   modifier`). Les segments sont identiques dans les trois langues
   (/fr/connexion, /en/connexion…) : la liste n'a pas à être traduite.
*/
const BARE_ROUTES = new Set([
  'connexion',
  'inscription',
  'mot-de-passe-oublie',
  'dashboard',
  'profil',
  'parametres',
  'admin'
]);

function Shell() {
  const { locale, t } = useI18n();
  const location = useLocation();
  const bare = BARE_ROUTES.has(location.pathname.split('/')[2] ?? '');

  useLayoutEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', dirOf(locale));
    persistLocale(locale);
  }, [locale]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('common.nav.skipToContent')}
      </a>
      <div id="app">
        <Header />
        <main id="main" className="site-main" tabIndex={-1}>
          <Outlet />
        </main>
        {bare ? null : <Footer />}
      </div>
      <div id="sr-live" className="sr-only" role="status" aria-live="polite" />
    </>
  );
}

export function LocaleLayout() {
  const { locale } = useParams();
  const location = useLocation();

  if (!isLocale(locale)) {
    return <Navigate to={`/${detectLocale()}${location.pathname}${location.search}`} replace />;
  }

  return (
    <LocaleProvider locale={locale}>
      {/* Notifications à l'extérieur : le contenu des modales (éditeurs
          d'administration) peut ainsi afficher ses propres messages. */}
      <ToastProvider>
        <ModalProvider>
          <Shell />
        </ModalProvider>
      </ToastProvider>
    </LocaleProvider>
  );
}

/** Racine « / » : redirige vers la langue détectée. */
export function RootRedirect() {
  const location = useLocation();
  const path = location.pathname === '/' ? '' : location.pathname;
  return <Navigate to={`/${detectLocale()}${path}${location.search}`} replace />;
}
