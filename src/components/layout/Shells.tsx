/* =====================================================================
   Espaces de travail : grille latérale du membre et de l'administration
   ===================================================================== */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useI18n } from '../../i18n/I18nContext';
import { canManageContent, logout } from '../../lib/auth';
import { useToast } from '../feedback/ToastProvider';
import { Icon, type IconName } from '../icons/Icon';

interface NavItem {
  path: string;
  key: string;
  icon: IconName;
}

export const MEMBER_NAV: NavItem[] = [
  { path: 'dashboard', key: 'dashboard.nav.overview', icon: 'grid' },
  { path: 'dashboard/formations', key: 'dashboard.nav.courses', icon: 'graduation' },
  { path: 'dashboard/favoris', key: 'dashboard.nav.favorites', icon: 'heart' },
  { path: 'dashboard/telechargements', key: 'dashboard.nav.downloads', icon: 'download' },
  { path: 'dashboard/webinaires', key: 'dashboard.nav.webinars', icon: 'radio' },
  { path: 'dashboard/certificats', key: 'dashboard.nav.certificates', icon: 'certificate' },
  { path: 'dashboard/abonnement', key: 'dashboard.nav.subscription', icon: 'creditCard' }
];

export const ADMIN_NAV: NavItem[] = [
  { path: 'admin', key: 'admin.nav.overview', icon: 'grid' },
  { path: 'admin/utilisateurs', key: 'admin.nav.users', icon: 'users' },
  { path: 'admin/abonnements', key: 'admin.nav.subscriptions', icon: 'creditCard' },
  { path: 'admin/bibliotheque', key: 'admin.nav.library', icon: 'library' },
  { path: 'admin/formations', key: 'admin.nav.courses', icon: 'graduation' },
  { path: 'admin/webinaires', key: 'admin.nav.webinars', icon: 'radio' },
  { path: 'admin/outils', key: 'admin.nav.tools', icon: 'tools' },
  { path: 'admin/exercices', key: 'admin.nav.exercises', icon: 'dumbbell' },
  { path: 'admin/pathologies', key: 'admin.nav.pathologies', icon: 'stethoscope' }
];

function ShellHead({
  title,
  subtitle,
  actions,
  menu
}: {
  title: string;
  subtitle?: string | null;
  actions?: ReactNode;
  /** Bouton d'ouverture du tiroir, posé au-dessus du titre. */
  menu?: ReactNode;
}) {
  return (
    <header className="ws-head">
      <div>
        {menu}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="ws-head-actions">{actions}</div> : null}
    </header>
  );
}

/** Entrée de navigation : icône, libellé, état courant. */
function NavLink({ item, active }: { item: NavItem; active: string }) {
  const { t, href } = useI18n();
  return (
    <Link to={href(item.path)} aria-current={item.path === active ? 'page' : undefined}>
      <span className="ws-nav-icon">
        <Icon name={item.icon} size={19} />
      </span>
      <span>{t(item.key)}</span>
    </Link>
  );
}

/** Encouragement, sous la navigation. Décoratif : rien ne s'y apprend. */
function Nudge() {
  const { t } = useI18n();
  return (
    <div className="ws-nudge">
      <strong>{t('dashboard.nudgeTitle')}</strong>
      <p>{t('dashboard.nudgeText')}</p>
      <span className="ws-nudge-heart" aria-hidden="true">
        <Icon name="heart" size={15} />
      </span>
    </div>
  );
}

/** Déconnexion, au pied de la colonne. */
function LogoutItem() {
  const { t, href } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    toast(t('common.toast.loggedOut'), 'success');
    navigate(href(''));
  };

  return (
    <button type="button" className="ws-nav-out" onClick={onLogout}>
      <span className="ws-nav-icon">
        <Icon name="logout" size={19} />
      </span>
      <span>{t('common.actions.logout')}</span>
    </button>
  );
}

/** Grille latérale de l'espace membre (tableau de bord, profil, paramètres). */
/**
 * Tiroir de navigation.
 *
 * Au-dessus de 1000 px la colonne est toujours la : l'etat ouvert ne sert
 * a rien et le bouton est masque en CSS. En dessous, le tiroir se ferme
 * des qu'on change de page -- sinon il resterait ouvert par-dessus
 * l'ecran qu'on vient d'atteindre -- et sur Echap.
 */
function useDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, setOpen };
}

function Drawer({
  label,
  open,
  onClose,
  children
}: {
  label: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <>
      {open ? (
        <button type="button" className="ws-scrim" aria-label={t('common.actions.close')} onClick={onClose} />
      ) : null}
      <nav className={open ? 'ws-nav is-open' : 'ws-nav'} id="ws-nav" aria-label={label}>
        <div className="ws-nav-head">
          <strong>{label}</strong>
          <button type="button" className="ws-nav-close" aria-label={t('common.actions.close')} onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </div>
        {children}
      </nav>
    </>
  );
}

/** Bouton d'ouverture du tiroir, pose devant le titre de la page. */
function MenuButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="ws-menu" aria-controls="ws-nav" onClick={onOpen}>
      <Icon name="menu" size={18} />
      {t('common.nav.menu')}
    </button>
  );
}

export function WorkspaceShell({
  active,
  title,
  subtitle,
  actions,
  children
}: {
  active: string;
  title: string;
  subtitle?: string | null;
  /** Boutons alignés à droite du titre (modifier le profil, mot de passe…). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const user = useCurrentUser();
  const { open, setOpen } = useDrawer();

  /* Profil et paramètres suivent les rubriques, séparés d'un filet : ce
     sont des réglages de compte, pas des contenus. */
  const account: NavItem[] = [
    { path: 'profil', key: 'common.account.profile', icon: 'user' },
    { path: 'parametres', key: 'common.account.settings', icon: 'settings' }
  ];

  return (
    <div className="ws">
      <div className="ws-wrap">
        <div className="ws-body">
          <Drawer label={t('common.account.dashboard')} open={open} onClose={() => setOpen(false)}>
            {MEMBER_NAV.map((item) => (
              <NavLink key={item.path} item={item} active={active} />
            ))}
            <div className="ws-nav-sep" />
            {account.map((item) => (
              <NavLink key={item.path} item={item} active={active} />
            ))}
            {user && canManageContent() ? (
              <NavLink item={{ path: 'admin', key: 'common.nav.admin', icon: 'shield' }} active={active} />
            ) : null}
            <div className="ws-nav-sep" />
            <LogoutItem />
            <Nudge />
          </Drawer>
          <div>
            <ShellHead
              title={title}
              subtitle={subtitle}
              actions={actions}
              menu={<MenuButton onOpen={() => setOpen(true)} />}
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Grille latérale de l'administration. */
export function AdminShell({
  active,
  title,
  subtitle,
  children
}: {
  active: string;
  title: string;
  subtitle?: string | null;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { open, setOpen } = useDrawer();
  return (
    <div className="ws ws-admin">
      <div className="ws-wrap">
        <div className="ws-body">
          <Drawer label={t('admin.title')} open={open} onClose={() => setOpen(false)}>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.path} item={item} active={active} />
            ))}
            <div className="ws-nav-sep" />
            <NavLink
              item={{ path: 'dashboard', key: 'common.account.dashboard', icon: 'arrowLeft' }}
              active={active}
            />
          </Drawer>
          <div>
            <ShellHead title={title} subtitle={subtitle} menu={<MenuButton onOpen={() => setOpen(true)} />} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= briques --- */

/**
 * Compteur.
 *
 * `to` ouvre la page qui détaille le chiffre : un compteur sans porte de
 * sortie laisse le lecteur devant un constat. Sans lien, le rond fléché
 * ne s'affiche pas plutôt que de faire semblant.
 */
export function Stat({
  label,
  value,
  icon,
  tone = 'teal',
  to
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: 'teal' | 'green' | 'blue' | 'violet' | 'amber';
  to?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`ws-stat ws-tone-${tone}`}>
      <div className="ws-stat-top">
        <span className="ws-stat-icon">
          <Icon name={icon} size={21} />
        </span>
        {to ? (
          <Link className="ws-stat-go" to={to} aria-label={`${label} — ${t('common.actions.viewAll')}`}>
            <Icon name="arrowRight" size={15} className="icon-flip" />
          </Link>
        ) : null}
      </div>
      <div>
        <div className="ws-stat-value ltr-nums">{value}</div>
        <div className="ws-stat-label">{label}</div>
      </div>
    </div>
  );
}

/**
 * Barre de progression.
 *
 * `role="progressbar"` et ses bornes : la valeur est annoncée, elle ne
 * repose pas sur la seule largeur du remplissage.
 */
export function Bar({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="ws-bar">
      <span
        className="ws-bar-track"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="ws-bar-fill" style={{ width: `${safe}%` }} />
      </span>
      <span className="ws-bar-value ltr-nums">{safe}%</span>
    </div>
  );
}

/** Une ligne d'information : pavé, libellé, valeur. */
export function InfoRow({ icon, label, value }: { icon: IconName; label: string; value?: string | null }) {
  const filled = !!value && value.length > 0;
  return (
    <div className="ws-row">
      <span className="ws-tile ws-tile-sm">
        <Icon name={icon} size={15} />
      </span>
      <span className="ws-row-label">{label}</span>
      <span className={filled ? 'ws-row-value' : 'ws-row-value ws-row-value-empty'}>{filled ? value : '—'}</span>
    </div>
  );
}

/**
 * En-tete de carte : pave d'icone, titre, explication, actions.
 *
 * Le sous-titre est un frere du titre, pas son enfant : un `<p>` dans un
 * `<h2>` n'est pas du HTML valide, et le titre annonce serait alors le
 * titre suivi de son explication, d'une traite.
 */
export function CardHead({
  icon,
  title,
  desc,
  actions
}: {
  icon: IconName;
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ws-card-head">
      <span className="ws-tile">
        <Icon name={icon} size={18} />
      </span>
      <div className="ws-card-head-text">
        <h2>{title}</h2>
        {desc ? <p>{desc}</p> : null}
      </div>
      {actions}
    </div>
  );
}
