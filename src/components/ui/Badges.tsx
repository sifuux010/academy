import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { formatNumber } from '../../lib/format';
import type { Access } from '../../model/common';
import { Icon } from '../icons/Icon';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'live';

export function Badge({ children, variant }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={variant ? `badge badge-${variant}` : 'badge'}>{children}</span>;
}

export function AccessBadge({ access }: { access?: Access }) {
  const { t } = useI18n();
  if (access !== 'premium') return null;
  return (
    <span className="badge badge-premium">
      <Icon name="lock" size={12} /> {t('taxonomies.access.premium')}
    </span>
  );
}

export function LevelBadge({ level }: { level?: string }) {
  const { term } = useI18n();
  return level ? <Badge variant="primary">{term('levels', level)}</Badge> : null;
}

export function TypeBadge({ type, group = 'resourceTypes' }: { type?: string; group?: string }) {
  const { term } = useI18n();
  return type ? <Badge>{term(group, type)}</Badge> : null;
}

export function Tag({ label, to }: { label: string; to?: string }) {
  return to ? (
    <Link className="tag" to={to}>
      {label}
    </Link>
  ) : (
    <span className="tag">{label}</span>
  );
}

export function Rating({ value, count }: { value?: number; count?: number }) {
  const { t } = useI18n();
  if (!value) return null;
  return (
    <span className="rating">
      <Icon name="star" size={14} />
      <strong className="ltr-nums">{value.toFixed(1)}</strong>
      {count ? <span className="rv">{t('courses.ratingCount', { count: formatNumber(count) })}</span> : null}
    </span>
  );
}
