import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { Icon } from '../icons/Icon';

export function EmptyState({
  title,
  body,
  ctaTo,
  ctaLabel
}: {
  title?: string;
  body?: string;
  ctaTo?: string;
  ctaLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <div className="es-icon">
        <Icon name="inbox" size={40} />
      </div>
      <h3>{title ?? t('common.states.emptyTitle')}</h3>
      <p>{body ?? t('common.states.emptyBody')}</p>
      {ctaTo ? (
        <Link className="btn btn-primary mt-4" to={ctaTo}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="ka-container section">
      <div className="error-state">
        <div className="es-icon">
          <Icon name="alert" size={40} />
        </div>
        <h3>{t('common.states.errorTitle')}</h3>
        <p>{message ?? t('common.states.errorBody')}</p>
        {onRetry ? (
          <button type="button" className="btn btn-outline mt-4" onClick={onRetry}>
            {t('common.actions.retry')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function NotFoundState() {
  const { t, href } = useI18n();
  return (
    <div className="ka-container section">
      <div className="empty-state">
        <div className="es-icon">
          <Icon name="search" size={40} />
        </div>
        <h3>{t('common.states.notFoundTitle')}</h3>
        <p>{t('common.states.notFoundBody')}</p>
        <Link className="btn btn-primary mt-4" to={href('')}>
          {t('common.states.notFoundCta')}
        </Link>
      </div>
    </div>
  );
}

export function AuthRequired() {
  const { t, href } = useI18n();
  return (
    <div className="ka-container section">
      <div className="empty-state">
        <div className="es-icon">
          <Icon name="lock" size={40} />
        </div>
        <h3>{t('common.states.authRequiredTitle')}</h3>
        <p>{t('common.states.authRequiredBody')}</p>
        <div className="row-wrap mt-4 justify-center">
          <Link className="btn btn-primary" to={href('connexion')}>
            {t('common.actions.login')}
          </Link>
          <Link className="btn btn-outline" to={href('inscription')}>
            {t('common.actions.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RoleRequired() {
  const { t, href } = useI18n();
  return (
    <div className="ka-container section">
      <div className="empty-state">
        <div className="es-icon">
          <Icon name="shield" size={40} />
        </div>
        <h3>{t('common.states.adminRequiredTitle')}</h3>
        <p>{t('common.states.adminRequiredBody')}</p>
        <Link className="btn btn-outline mt-4" to={href('dashboard')}>
          {t('common.account.dashboard')}
        </Link>
      </div>
    </div>
  );
}
