/* =====================================================================
   Mon profil, modification du profil et paramètres
   ---------------------------------------------------------------------
   Les champs dépendent du type de compte : on ne demande pas
   d'informations professionnelles à un étudiant. Les paramètres
   regroupent apparence, langue, notifications, confidentialité,
   sécurité et suppression du compte.
   ===================================================================== */
import { useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useModal } from '../components/feedback/ModalProvider';
import { useToast } from '../components/feedback/ToastProvider';
import { Icon, type IconName } from '../components/icons/Icon';
import { Bar, CardHead, InfoRow, Stat, WorkspaceShell } from '../components/layout/Shells';
import {
  Avatar,
  Field,
  LanguageButtons,
  SaveBar,
  ThemeChoice,
  focusFirstError,
  readForm,
  translateErrors
} from '../components/ui';
import { taxonomies } from '../data/taxonomies';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { settings as readSettings, summary, updateSettings } from '../lib/activity';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  isValidEmail,
  updateProfile,
  type AuthFailure
} from '../lib/auth';
import { titleOf } from '../lib/content';
import { formatDateShort, formatMonthYear, formatNumber, formatPercent } from '../lib/format';
import { currentSubscription, pendingSubscription } from '../lib/subscriptions';
import type { PublicUser } from '../model/account';
import { useStoreVersion } from '../state/store';
import { SubscriptionStatusBadge } from './SubscriptionsPages';

const GRID_GAP: CSSProperties = { gap: '0 var(--space-4)' };

/** Complétude du profil : pilote le message d'incitation. */
function completeness(user: PublicUser): number {
  const record = user as unknown as Record<string, unknown>;
  const fields = ['firstName', 'lastName', 'email', 'phone', 'country', 'city', 'bio'].concat(
    user.profileType === 'STUDENT'
      ? ['university', 'academicYear', 'graduationYear']
      : ['profStatus', 'workplace', 'experienceYears']
  );
  const filled = fields.filter((key) => {
    const value = record[key];
    return value !== undefined && value !== null && String(value).length > 0;
  }).length;
  const lists = (['expertise', 'interests', 'languages'] as const).filter((key) => (user[key] ?? []).length > 0).length;
  return Math.round(((filled + lists) / (fields.length + 3)) * 100);
}

/* ----------------------------------------------------------- mon profil */

/* ----------------------------------------------- une ligne, deux états */

/**
 * Ligne d'information.
 *
 * Reprise de `PatientProfile` sur kinedok.dz : une seule définition sert
 * la lecture et la saisie. La bulle et le libellé ne bougent pas quand on
 * passe en modification — seule la valeur devient un champ. Deux écrans
 * séparés faisaient sauter toute la page au moindre clic sur « Modifier ».
 *
 * Le libellé occupe 38 % de la ligne, comme chez eux : les valeurs
 * s'alignent alors d'une ligne à l'autre.
 */
interface Row {
  icon: IconName;
  label: string;
  value?: string | null;
  edit?: ReactNode;
}

function InfoLine({ row, editing }: { row: Row; editing: boolean }) {
  const { t } = useI18n();
  const filled = !!row.value && row.value.length > 0;
  return (
    <div className="ws-line">
      <span className="ws-tile ws-tile-sm">
        <Icon name={row.icon} size={17} />
      </span>
      <span className="ws-line-label">{row.label}</span>
      <div className="ws-line-value">
        {editing && row.edit ? (
          row.edit
        ) : (
          <span className={filled ? 'ws-line-text' : 'ws-line-text is-empty'}>
            {filled ? row.value : t('common.labels.notSet')}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const toast = useToast();
  const user = useCurrentUser();

  /* La modification se fait sur place : pas d'écran séparé, donc pas de
     perte de repère entre la fiche et le formulaire. */
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useSeo({ title: t('profile.title'), path: 'profil' });
  if (!user) return null;

  const isStudent = user.profileType === 'STUDENT';
  const percent = completeness(user);
  const s = summary();
  const subscription = currentSubscription() ?? pendingSubscription();

  const field = (key: string, fallback: string) => form[key] ?? fallback ?? '';
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    setForm({});
    setAvatar(null);
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm({});
    setAvatar(null);
    setErrors({});
    setEditing(false);
  };

  const input = (key: string, fallback: string, type = 'text') => (
    <input
      className="ws-inline-input"
      type={type}
      value={field(key, fallback)}
      aria-label={key}
      onChange={(event) => set(key, event.target.value)}
    />
  );

  const select = (key: string, fallback: string, options: readonly string[]) => (
    <select
      className="ws-inline-input ws-inline-select"
      value={field(key, fallback)}
      aria-label={key}
      onChange={(event) => set(key, event.target.value)}
    >
      <option value="">{t('common.labels.notSet')}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  const personal: Row[] = [
    { icon: 'user', label: t('profile.fields.lastName'), value: user.lastName, edit: input('lastName', user.lastName) },
    { icon: 'user', label: t('profile.fields.firstName'), value: user.firstName, edit: input('firstName', user.firstName) },
    { icon: 'mail', label: t('profile.fields.email'), value: user.email, edit: input('email', user.email, 'email') },
    { icon: 'phone', label: t('profile.fields.phone'), value: user.phone, edit: input('phone', user.phone, 'tel') },
    {
      icon: 'globe',
      label: t('profile.fields.country'),
      value: user.country,
      edit: select('country', user.country, taxonomies.countries)
    },
    { icon: 'pin', label: t('profile.fields.city'), value: user.city, edit: input('city', user.city) },
    { icon: 'calendar', label: t('common.labels.memberSince'), value: formatMonthYear(user.createdAt) }
  ];

  const second: Row[] = isStudent
    ? [
        {
          icon: 'building',
          label: t('profile.fields.university'),
          value: user.university,
          edit: input('university', user.university)
        },
        {
          icon: 'graduation',
          label: t('profile.fields.academicYear'),
          value: user.academicYear,
          edit: select('academicYear', user.academicYear, taxonomies.academicYears)
        },
        {
          icon: 'calendar',
          label: t('profile.fields.graduationYear'),
          value: user.graduationYear,
          edit: input('graduationYear', user.graduationYear, 'number')
        },
        { icon: 'heart', label: t('profile.fields.interests'), value: user.interests.join(', ') },
        { icon: 'globe', label: t('profile.fields.languages'), value: user.languages.join(', ') }
      ]
    : [
        {
          icon: 'shield',
          label: t('profile.fields.profStatus'),
          value: user.profStatus,
          edit: select('profStatus', user.profStatus, taxonomies.profStatuses)
        },
        {
          icon: 'building',
          label: t('profile.fields.workplace'),
          value: user.workplace,
          edit: input('workplace', user.workplace)
        },
        {
          icon: 'activity',
          label: t('profile.fields.experience'),
          value: user.experienceYears,
          edit: input('experienceYears', user.experienceYears, 'number')
        },
        {
          icon: 'certificate',
          label: t('profile.fields.licenseNumber'),
          value: user.licenseNumber,
          edit: input('licenseNumber', user.licenseNumber)
        },
        { icon: 'target', label: t('profile.fields.expertise'), value: user.expertise.join(', ') }
      ];

  /* La photo est lue en base 64 : le stockage de la démo est local, il n'y
     a pas de serveur de fichiers à qui l'envoyer. */
  const onPickPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSave = () => {
    const email = field('email', user.email);
    const next: Record<string, string> = {};
    if (!field('firstName', user.firstName).trim()) next.firstName = t('auth.errors.required');
    if (!field('lastName', user.lastName).trim()) next.lastName = t('auth.errors.required');
    if (!isValidEmail(email)) next.email = t('auth.errors.emailInvalid');
    setErrors(next);
    if (Object.keys(next).length) return;

    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const failure: AuthFailure | null = changeEmail(email);
      if (failure) {
        setErrors(translateErrors(failure.fields, t));
        return;
      }
    }

    updateProfile({
      ...(avatar ? { avatar } : {}),
      firstName: field('firstName', user.firstName),
      lastName: field('lastName', user.lastName),
      phone: field('phone', user.phone),
      country: field('country', user.country),
      city: field('city', user.city),
      ...(isStudent
        ? {
            university: field('university', user.university),
            academicYear: field('academicYear', user.academicYear),
            graduationYear: field('graduationYear', user.graduationYear)
          }
        : {
            profStatus: field('profStatus', user.profStatus),
            workplace: field('workplace', user.workplace),
            experienceYears: field('experienceYears', user.experienceYears),
            licenseNumber: field('licenseNumber', user.licenseNumber)
          })
    });
    toast(t('common.toast.saved'), 'success');
    setEditing(false);
    setForm({});
    setAvatar(null);
  };

  const cardClass = editing ? 'ws-card is-editing' : 'ws-card';

  return (
    <WorkspaceShell
      active="profil"
      title={t('profile.title')}
      subtitle={editing ? t('profile.editSubtitle') : t('profile.subtitle')}
      actions={
        /* En modification, la barre du bas porte les actions : les répéter
           ici n'ajouterait que du bruit. */
        editing ? undefined : (
          <>
            <button type="button" className="ws-btn ws-btn-primary" onClick={startEdit}>
              <Icon name="edit" size={16} />
              {t('profile.editProfile')}
            </button>
            <Link className="ws-btn ws-btn-outline" to={href('parametres')}>
              <Icon name="lock" size={16} />
              {t('common.actions.changePassword')}
            </Link>
          </>
        )
      }
    >
      <div className="ws-stack">
        {!editing ? (
          <section className="ws-banner">
            <h2>{t('profile.welcome', { name: user.firstName })}</h2>
            <p>
              {t('profile.welcomeBody', { type: t(`auth.profileTypes.${user.profileType}`) })}
              <br />
              {t('profile.welcomeWish')}
            </p>
            <span className="ws-banner-mark" aria-hidden="true">
              <Icon name="heart" size={60} />
            </span>
          </section>
        ) : null}

        {!editing && percent < 100 ? (
          <section className="ws-card">
            <CardHead
              icon="target"
              title={t('profile.completeness', { percent: formatPercent(percent) })}
              desc={t('profile.completenessHint')}
            />
            <Bar percent={percent} />
          </section>
        ) : null}

        <div className="ws-pair">
          <section className={cardClass}>
            <CardHead icon="user" title={t('profile.sections.personal')} />
            <div className="ws-lines">
              {editing ? (
                <div className="ws-line">
                  <Avatar user={{ ...user, avatar: avatar ?? user.avatar }} size="sm" />
                  <span className="ws-line-label">{t('profile.fields.photo')}</span>
                  <div className="ws-line-value">
                    <label className="ws-photo-pick">
                      <Icon name="edit" size={15} />
                      {t('common.actions.changePhoto')}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onPickPhoto(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {personal.map((row) => (
                <InfoLine key={row.label} row={row} editing={editing} />
              ))}
            </div>
            {Object.values(errors).length ? (
              <p className="ws-line-error" role="alert">
                {Object.values(errors)[0]}
              </p>
            ) : null}
          </section>

          <section className={cardClass}>
            <CardHead
              icon="stethoscope"
              title={isStudent ? t('profile.sections.academic') : t('profile.sections.professional')}
            />
            <div className="ws-lines">
              {second.map((row) => (
                <InfoLine key={row.label} row={row} editing={editing} />
              ))}
            </div>
          </section>
        </div>

        {!editing && user.bio ? (
          <section className="ws-card">
            <CardHead icon="file" title={t('profile.fields.bio')} />
            <p className="text-muted mb-0">{user.bio}</p>
          </section>
        ) : null}

        {!editing ? (
          <section className="ws-stats">
            <Stat
              label={t('dashboard.stats.coursesCompleted')}
              value={formatNumber(s.coursesCompleted)}
              icon="graduation"
              tone="green"
            />
            <Stat
              label={t('dashboard.stats.certificates')}
              value={formatNumber(s.certificates)}
              icon="certificate"
              tone="violet"
            />
            <Stat label={t('dashboard.stats.favorites')} value={formatNumber(s.favorites)} icon="heart" tone="blue" />
            <Stat
              label={t('dashboard.stats.downloads')}
              value={formatNumber(s.downloads)}
              icon="download"
              tone="amber"
            />
          </section>
        ) : null}

        {!editing ? (
          <section className="ws-card">
            <CardHead
              icon="creditCard"
              title={t('subscriptions.myTitle')}
              desc={subscription?.plan ? titleOf(subscription.plan) : t('subscriptions.noPlan')}
              actions={
                <>
                  {subscription ? <SubscriptionStatusBadge status={subscription.status} /> : null}
                  <Link className="ws-btn ws-btn-quiet ws-btn-sm" to={href('dashboard/abonnement')}>
                    {t('common.actions.details')}
                  </Link>
                </>
              }
            />
          </section>
        ) : null}

        {editing ? (
          <SaveBar>
            <span className="ws-savebar-note">
              <span className="ws-savebar-dot" aria-hidden="true" />
              {t('profile.unsaved')}
            </span>
            <div className="ws-savebar-actions">
              <button type="button" className="ws-btn ws-btn-quiet" onClick={cancelEdit}>
                <Icon name="close" size={16} />
                {t('common.actions.cancel')}
              </button>
              <button type="button" className="ws-btn ws-btn-primary" onClick={onSave}>
                <Icon name="check" size={16} />
                {t('common.actions.save')}
              </button>
            </div>
          </SaveBar>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}

/**
 * L'ancienne adresse de modification renvoie sur la fiche : la saisie s'y
 * fait désormais sur place, et un lien partagé ne doit pas tomber à vide.
 */
export function ProfileEditPage() {
  const { href } = useI18n();
  return <Navigate to={href('profil')} replace />;
}

/* ------------------------------------------------------------ paramètres */

const NOTIFICATION_KEYS = ['newResources', 'newCourses', 'webinarReminders', 'newsletter', 'productUpdates'];
const PRIVACY_KEYS = ['publicProfile', 'showEmail', 'analytics'];

/* Une icone par reglage : dans une liste de cinq lignes grises, le pave
   donne le point d'entree du regard. */
const NOTIFICATION_ICONS: Record<string, IconName> = {
  newResources: 'book',
  newCourses: 'graduation',
  webinarReminders: 'radio',
  newsletter: 'mail',
  productUpdates: 'sparkles'
};

const PRIVACY_ICONS: Record<string, IconName> = {
  publicProfile: 'user',
  showEmail: 'mail',
  analytics: 'chart'
};

export function SettingsPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const modal = useModal();
  const passwordRef = useRef<HTMLFormElement>(null);
  const deleteRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useSeo({ title: t('profile.settingsTitle'), path: 'parametres' });

  const appSettings = readSettings();

  const toggle = (group: 'notifications' | 'privacy', key: string, checked: boolean) => {
    updateSettings(group === 'notifications' ? { notifications: { [key]: checked } } : { privacy: { [key]: checked } });
    toast(t('common.toast.saved'), 'success');
  };

  const onPasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const f = readForm(form);
    if (f.get('newPassword') !== f.get('confirmPassword')) {
      setErrors({ confirmPassword: t('auth.errors.passwordMismatch') });
      focusFirstError(passwordRef.current);
      return;
    }
    setErrors({});
    changePassword(f.get('currentPassword'), f.get('newPassword'))
      .then(() => {
        toast(t('profile.security.updated'), 'success');
        form.reset();
      })
      .catch((error: unknown) => {
        const failure = (error ?? {}) as AuthFailure;
        if (failure.fields) {
          setErrors(translateErrors(failure.fields, t));
          focusFirstError(passwordRef.current);
        } else {
          toast(t('common.toast.genericError'), 'error');
        }
      });
  };

  const onDeleteAccount = () => {
    const confirmDelete = () => {
      if ((deleteRef.current?.value ?? '').trim() !== t('profile.danger.deleteConfirmWord')) {
        toast(t('common.toast.genericError'), 'error');
        return;
      }
      deleteAccount();
      modal.close();
      toast(t('profile.danger.deleted'), 'success');
      navigate(href(''));
    };
    modal.open({
      title: t('profile.danger.deleteConfirmTitle'),
      body: (
        <>
          <p>{t('profile.danger.deleteConfirmBody')}</p>
          <input
            ref={deleteRef}
            className="input"
            id="delete-confirm"
            autoComplete="off"
            placeholder={t('profile.danger.deleteConfirmWord')}
          />
        </>
      ),
      footer: (
        <>
          <button type="button" className="btn btn-outline" onClick={modal.close}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            {t('profile.danger.deleteButton')}
          </button>
        </>
      )
    });
  };

  return (
    <WorkspaceShell active="parametres" title={t('profile.settingsTitle')} subtitle={t('profile.settingsSubtitle')}>
      <div className="ws-stack">
        {/* ------------------------------------------------ apparence -- */}
        <section className="ws-card">
          <CardHead
            icon="sun"
            title={t('profile.sections.preferences')}
            desc={t('profile.preferencesHint')}
          />
          <div className="field">
            <span className="label">{t('common.theme.label')}</span>
            <ThemeChoice />
          </div>
          <div className="field mb-0">
            <span className="label">{t('profile.fields.interfaceLanguage')}</span>
            <LanguageButtons />
          </div>
        </section>

        {/* -------------------------------------------- notifications -- */}
        <section className="ws-card">
          <CardHead
            icon="bell"
            title={t('profile.sections.notifications')}
            desc={t('profile.notificationsHint')}
          />

          {/* Les notifications dans l'application ne se coupent pas : elles
              sont le journal du compte. Le dire vaut mieux qu'afficher un
              interrupteur qui ne bougerait jamais. */}
          <div className="ws-opt">
            <span className="ws-tile">
              <Icon name="bell" size={17} />
            </span>
            <span className="ws-opt-text">
              <span className="ws-opt-title">{t('profile.notifications.inApp')}</span>
              <span className="ws-opt-desc">{t('profile.notifications.inAppHelp')}</span>
            </span>
            <span className="ws-locked">
              <Icon name="lock" size={13} />
              {t('profile.notifications.alwaysOn')}
            </span>
          </div>

          {NOTIFICATION_KEYS.map((key) => (
            <div className="ws-opt" key={key}>
              <span className="ws-tile">
                <Icon name={NOTIFICATION_ICONS[key] ?? 'bell'} size={17} />
              </span>
              <span className="ws-opt-text">
                <span className="ws-opt-title">{t(`profile.notifications.${key}`)}</span>
                <span className="ws-opt-desc">{t(`profile.notifications.${key}Help`)}</span>
              </span>
              <Switch
                label={t(`profile.notifications.${key}`)}
                checked={!!appSettings.notifications[key]}
                onChange={(checked) => toggle('notifications', key, checked)}
              />
            </div>
          ))}

          <p className="ws-note">{t('profile.notifications.accountMails')}</p>
        </section>

        {/* ----------------------------------------- confidentialité --- */}
        <section className="ws-card">
          <CardHead
            icon="shield"
            title={t('profile.sections.privacy')}
            desc={t('profile.privacyHint')}
          />
          {PRIVACY_KEYS.map((key) => (
            <div className="ws-opt" key={key}>
              <span className="ws-tile">
                <Icon name={PRIVACY_ICONS[key] ?? 'shield'} size={17} />
              </span>
              <span className="ws-opt-text">
                <span className="ws-opt-title">{t(`profile.privacy.${key}`)}</span>
                <span className="ws-opt-desc">{t(`profile.privacy.${key}Help`)}</span>
              </span>
              <Switch
                label={t(`profile.privacy.${key}`)}
                checked={!!appSettings.privacy[key]}
                onChange={(checked) => toggle('privacy', key, checked)}
              />
            </div>
          ))}
        </section>

        {/* ------------------------------------------------- sécurité -- */}
        <section className="ws-card">
          <CardHead
            icon="lock"
            title={t('profile.sections.security')}
            desc={t('profile.security.hint')}
          />
          <form ref={passwordRef} noValidate onSubmit={onPasswordSubmit}>
            <Field
              name="currentPassword"
              label={t('profile.security.currentPassword')}
              type="password"
              required
              autoComplete="current-password"
              error={errors.currentPassword}
            />
            <div className="grid grid-2" style={GRID_GAP}>
              <Field
                name="newPassword"
                label={t('profile.security.newPassword')}
                type="password"
                required
                autoComplete="new-password"
                hint={t('auth.register.passwordHint')}
                error={errors.newPassword}
              />
              <Field
                name="confirmPassword"
                label={t('profile.security.confirmNewPassword')}
                type="password"
                required
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
            </div>
            <button type="submit" className="ws-btn ws-btn-primary">
              <Icon name="lock" size={16} />
              {t('common.actions.changePassword')}
            </button>
          </form>
          <div className="ws-rows mt-6">
            <InfoRow
              icon="monitor"
              label={t('profile.security.sessions')}
              value={`${t('profile.security.thisDevice')} · ${formatDateShort(new Date())}`}
            />
          </div>
        </section>

        {/* ------------------------------------------------- le compte -- */}
        <div className="ws-acts">
          <section className="ws-act">
            <span className="ws-tile">
              <Icon name="edit" size={18} />
            </span>
            <h3>{t('profile.account.editTitle')}</h3>
            <p>{t('profile.account.editBody')}</p>
            <Link className="ws-btn ws-btn-primary ws-btn-block" to={href('profil/modifier')}>
              <Icon name="edit" size={16} />
              {t('common.actions.edit')}
            </Link>
          </section>

          <section className="ws-act ws-act-danger">
            <span className="ws-tile ws-tile-danger">
              <Icon name="alert" size={18} />
            </span>
            <h3>{t('profile.danger.deleteTitle')}</h3>
            <p>{t('profile.danger.deleteBody')}</p>
            <button type="button" className="ws-btn ws-btn-danger ws-btn-block" onClick={onDeleteAccount}>
              <Icon name="trash" size={16} />
              {t('profile.danger.deleteButton')}
            </button>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}

/* ----------------------------------------------------- interrupteur -- */

/**
 * Interrupteur de reglage.
 *
 * C'est une case a cocher repeinte : l'input reste dans le document, donc
 * le focus, le clavier et l'annonce de l'etat continuent de fonctionner.
 * `aria-label` porte le libelle parce que le texte voisin appartient a la
 * ligne, pas au controle.
 */
function Switch({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="ws-switch">
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="ws-switch-rail" />
    </label>
  );
}
