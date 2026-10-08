/* =====================================================================
   En-tête : marque, navigation, recherche instantanée, apparence,
   langue, menu du compte, tiroir mobile.
   ---------------------------------------------------------------------
   Le logo renvoie vers kinedokdz.com ; « ACADÉMIE » ramène à l'accueil
   de la plateforme — le lien visuel entre l'écosystème et sa branche.
   Le tiroir mobile est rendu dans un portail : l'en-tête applique un
   backdrop-filter qui, sinon, limiterait le tiroir à sa propre hauteur.
   ===================================================================== */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useI18n } from '../../i18n/I18nContext';
import { recordSearch } from '../../lib/activity';
import { canManageContent, logout } from '../../lib/auth';
import { globalSearch } from '../../lib/search';
import { useToast } from '../feedback/ToastProvider';
import { ResultRow } from '../cards/Cards';
import { Icon } from '../icons/Icon';
import { Avatar, LanguageSwitch, Logo, ThemeChoice, ThemeToggle } from '../ui';

export const MAIN_SITE = 'https://kinedokdz.com/';

export const NAV: { path: string; key: string }[] = [
  { path: '', key: 'common.nav.home' },
  { path: 'bibliotheque', key: 'common.nav.library' },
  { path: 'formations', key: 'common.nav.courses' },
  { path: 'webinaires', key: 'common.nav.webinars' },
  { path: 'outils', key: 'common.nav.tools' },
  { path: 'pathologies', key: 'common.nav.pathologies' },
  { path: 'exercices', key: 'common.nav.exercises' }
];

/** Chemin courant sans le préfixe de langue ni la barre finale. */
export function useCurrentPath(): string {
  const { pathname } = useLocation();
  return pathname.replace(/^\/(fr|en|ar)(\/|$)/, '').replace(/\/$/, '');
}

/* ------------------------------------------------ recherche instantanée */

function GlobalSearch() {
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const onSearchPage = /\/recherche$/.test(location.pathname);
  const [value, setValue] = useState(onSearchPage ? (params.get('q') ?? '') : '');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(value.trim(), 200);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const result = debounced.length >= 2 ? globalSearch(debounced, 3) : null;
  const expanded = open && result !== null;

  const submit = () => {
    const q = value.trim();
    if (q.length < 2) return;
    recordSearch(q);
    setOpen(false);
    navigate(href('recherche', { q }));
  };

  return (
    <div className="header-search" id="global-search" ref={wrapperRef}>
      <span className="search-icon">
        <Icon name="search" size={16} />
      </span>
      <label className="sr-only" htmlFor="global-search-input">
        {t('search.ariaLabel')}
      </label>
      <input
        id="global-search-input"
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={expanded}
        aria-controls="global-search-results"
        placeholder={t('search.placeholder')}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          } else if (event.key === 'Escape') {
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
      />
      {/* Le bouton double la touche Entrée : il rend l'action visible, et
          donne une cible au doigt sur écran tactile. */}
      <button
        type="button"
        className="search-submit"
        onClick={submit}
        aria-label={t('common.actions.search')}
      >
        <Icon name="search" size={17} />
      </button>
      {expanded && result ? (
        <div id="global-search-results" className="search-results">
          {result.total === 0 ? (
            <p className="search-group-title">{t('search.noResultsTitle', { query: debounced })}</p>
          ) : (
            <>
              {result.groups.map((group) => (
                <div key={group.key}>
                  <p className="search-group-title">
                    {t(`search.groups.${group.key}`)} <span className="ltr-nums">({group.total})</span>
                  </p>
                  {group.items.map((item) => (
                    <ResultRow key={item.id} collection={group.collection} item={item} onNavigate={() => setOpen(false)} />
                  ))}
                </div>
              ))}
              <div className="sep" />
              <Link className="search-item" to={href('recherche', { q: debounced })} onClick={() => setOpen(false)}>
                <span className="grow">
                  <span className="si-title">
                    {t('search.allResults')} <span className="ltr-nums">({result.total})</span>
                  </span>
                </span>
                <Icon name="arrowRight" size={16} className="icon-flip" />
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ en-tête */

export function Header() {
  const user = useCurrentUser();
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const current = useCurrentPath();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = !!user && canManageContent();

  /* Fermeture des menus à chaque navigation. */
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isActive = (path: string) => (path === '' ? current === '' : current === path || current.startsWith(`${path}/`));

  const onLogout = () => {
    logout();
    toast(t('common.toast.loggedOut'), 'success');
    navigate(href(''));
  };

  const drawer = drawerOpen
    ? createPortal(
      <div
        className="mobile-drawer"
        onClick={(event) => {
          if (event.target === event.currentTarget) setDrawerOpen(false);
        }}
      >
        <div className="mobile-panel" role="dialog" aria-modal="true" aria-label={t('common.nav.menu')}>
          <div className="row-between">
            <strong>{t('common.brand.name')}</strong>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setDrawerOpen(false)}
              aria-label={t('common.nav.closeMenu')}
              autoFocus
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="header-search" style={{ display: 'block' }}>
            <span className="search-icon">
              <Icon name="search" size={16} />
            </span>
            <label className="sr-only" htmlFor="mobile-search">
              {t('search.ariaLabel')}
            </label>
            <input
              id="mobile-search"
              type="search"
              placeholder={t('search.placeholder')}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                const q = event.currentTarget.value.trim();
                if (q.length < 2) return;
                recordSearch(q);
                navigate(href('recherche', { q }));
              }}
            />
          </div>
          <nav aria-label={t('common.nav.menu')}>
            {NAV.map((item) => (
              <Link key={item.path} to={href(item.path)}>
                {t(item.key)}
              </Link>
            ))}
            {user ? (
              <>
                <div className="nav-sep" />
                <Link to={href('dashboard')}>{t('common.account.dashboard')}</Link>
                <Link to={href('profil')}>{t('common.account.profile')}</Link>
                {isAdmin ? <Link to={href('admin')}>{t('common.nav.admin')}</Link> : null}
              </>
            ) : null}
          </nav>
          <div className="nav-sep" />
          <LanguageSwitch />
          <div className="mt-4">
            <p className="label">{t('common.theme.label')}</p>
            <ThemeChoice />
          </div>
          <div className="row-wrap mt-4">
            {user ? (
              <button type="button" className="btn btn-outline btn-block" onClick={onLogout}>
                {t('common.actions.logout')}
              </button>
            ) : (
              <>
                <Link className="btn btn-primary btn-block" to={href('inscription')}>
                  {t('common.actions.register')}
                </Link>
                <Link className="btn btn-outline btn-block" to={href('connexion')}>
                  {t('common.actions.login')}
                </Link>
              </>
            )}
          </div>
          <a className="text-sm mt-8" href={MAIN_SITE} target="_blank" rel="noopener noreferrer">
            {t('common.nav.mainSite')} <Icon name="external" size={14} />
          </a>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <header id="site-header" className="site-header" role="banner">
      <div className="ka-container header-inner">
        <Link to={href('')} className="brand no-underline" aria-label={t('common.brand.name')}>
          <Logo variant="compact" alt="KINEDOK ACADÉMIE" />
          <span className="brand-text">
            <span className="brand-title">{t('common.brand.short')}</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label={t('common.nav.menu')}>
          {NAV.map((item) => (
            <Link key={item.path} to={href(item.path)} aria-current={isActive(item.path) ? 'page' : undefined}>
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <GlobalSearch />
          <Link
            className="icon-btn search-compact"
            to={href('recherche')}
            aria-label={t('search.ariaLabel')}
            title={t('common.actions.search')}
          >
            <Icon name="search" size={18} />
          </Link>
          <ThemeToggle />
          <LanguageSwitch />

          {user ? (
            <div className="header-account relative" ref={menuRef}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-expanded={menuOpen}
                aria-label={t('common.account.openAccountMenu')}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <Avatar user={user} size="sm" />
                <span className="grow">{user.firstName}</span>
                <Icon name="chevronDown" size={16} />
              </button>
              {menuOpen ? (
                <div className="menu-pop" id="account-menu">
                  <Link to={href('dashboard')}>
                    <Icon name="grid" size={16} />
                    {t('common.account.dashboard')}
                  </Link>
                  <Link to={href('dashboard/formations')}>
                    <Icon name="graduation" size={16} />
                    {t('common.account.myCourses')}
                  </Link>
                  <Link to={href('dashboard/favoris')}>
                    <Icon name="heart" size={16} />
                    {t('common.account.myLibrary')}
                  </Link>
                  <Link to={href('dashboard/abonnement')}>
                    <Icon name="creditCard" size={16} />
                    {t('dashboard.nav.subscription')}
                  </Link>
                  <Link to={href('profil')}>
                    <Icon name="user" size={16} />
                    {t('common.account.profile')}
                  </Link>
                  <Link to={href('parametres')}>
                    <Icon name="settings" size={16} />
                    {t('common.account.settings')}
                  </Link>
                  {isAdmin ? (
                    <>
                      <div className="sep" />
                      <Link to={href('admin')}>
                        <Icon name="shield" size={16} />
                        {t('common.nav.admin')}
                      </Link>
                    </>
                  ) : null}
                  <div className="sep" />
                  <button type="button" onClick={onLogout}>
                    <Icon name="logout" size={16} />
                    {t('common.actions.logout')}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <span className="header-account">
              <Link className="btn btn-ghost btn-sm" to={href('connexion')}>
                {t('common.actions.login')}
              </Link>
              <Link className="btn btn-primary btn-sm" to={href('inscription')}>
                {t('common.actions.register')}
              </Link>
            </span>
          )}

          <button
            type="button"
            className="icon-btn burger"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('common.nav.openMenu')}
            aria-expanded={drawerOpen}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>
      {drawer}
    </header>
  );
}
