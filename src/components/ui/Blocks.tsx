import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { initials } from '../../lib/format';
import { safeImageUrl } from '../../lib/html';
import { Icon, type IconName } from '../icons/Icon';

export function SectionHead({
  title,
  subtitle,
  ctaTo,
  ctaLabel
}: {
  title: string;
  subtitle?: string | null;
  ctaTo?: string;
  ctaLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {ctaTo ? (
        <Link className="btn btn-outline btn-sm" to={ctaTo}>
          {ctaLabel ?? t('common.actions.viewAll')}
          <Icon name="arrowRight" size={16} className="icon-flip" />
        </Link>
      ) : null}
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useI18n();
  return (
    <nav className="breadcrumb" aria-label={t('common.nav.menu')}>
      {items.map((item, index) => (
        <Fragment key={`${index}-${item.label}`}>
          {index > 0 ? (
            <span className="sep" aria-hidden="true">
              <Icon name="chevronRight" size={14} />
            </span>
          ) : null}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

export function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div className="ml-row">
      <span className="ml-label">{label}</span>
      <span className="ml-value">{children}</span>
    </div>
  );
}

export function MedicalNotice() {
  const { t } = useI18n();
  return (
    <div className="medical-notice no-print">
      <Icon name="info" size={18} />
      <div>
        <strong>{t('common.disclaimer.title')}</strong>
        {t('common.disclaimer.body')}
      </div>
    </div>
  );
}

export type AlertVariant = 'info' | 'warning' | 'success' | 'danger';

const ALERT_ICONS: Record<AlertVariant, IconName> = {
  info: 'info',
  warning: 'alert',
  success: 'checkCircle',
  danger: 'info'
};

export function Alert({ variant, title, children }: { variant: AlertVariant; title?: string | null; children?: ReactNode }) {
  return (
    <div className={`alert alert-${variant}`}>
      <span className="alert-icon">
        <Icon name={ALERT_ICONS[variant]} size={18} />
      </span>
      <div>
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ percent, large }: { percent: number; large?: boolean }) {
  const { t } = useI18n();
  const value = Math.max(0, Math.min(100, Math.round(percent || 0)));
  return (
    <div
      className={large ? 'progress progress-lg' : 'progress'}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t('common.labels.progress')}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

interface AvatarUser {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export function Avatar({ user, size }: { user?: AvatarUser | null; size?: 'sm' | 'lg' }) {
  const className = size === 'lg' ? 'avatar avatar-lg' : size === 'sm' ? 'avatar avatar-sm' : 'avatar';
  const src = safeImageUrl(user?.avatar);
  if (src) {
    return (
      <span className={className}>
        <img src={src} alt="" />
      </span>
    );
  }
  return (
    <span className={className} aria-hidden="true">
      {initials(user?.firstName, user?.lastName)}
    </span>
  );
}
