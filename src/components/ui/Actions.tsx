import { useNavigate } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { isFavorite, needsAuth, toggleFavorite } from '../../lib/activity';
import type { Collection } from '../../model/common';
import { useStoreVersion } from '../../state/store';
import { useModal } from '../feedback/ModalProvider';
import { useToast } from '../feedback/ToastProvider';
import { Icon, type IconName } from '../icons/Icon';

/**
 * Bouton « garder ».
 *
 * `className` et `icon` existent pour les cartes de liste : la cloche y
 * dit « me prévenir » d'un webinaire à venir, le signet « garder » d'une
 * ressource. L'action et l'état restent les mêmes — seul le mot change,
 * via `aria-label`.
 */
export function FavoriteButton({
  collection,
  id,
  className = 'icon-btn',
  icon = 'bookmark'
}: {
  collection: Collection;
  id: string;
  className?: string;
  icon?: IconName;
}) {
  useStoreVersion();
  const { t, href } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const active = isFavorite(collection, id);
  const label = t(active ? 'common.actions.favorited' : 'common.actions.favorite');

  const onClick = () => {
    const result = toggleFavorite(collection, id);
    if (needsAuth(result)) {
      toast(t('common.states.authRequiredBody'), 'error');
      navigate(href('connexion'));
      return;
    }
    toast(t(result.added ? 'common.toast.favoriteAdded' : 'common.toast.favoriteRemoved'), 'success');
  };

  return (
    <button type="button" className={className} aria-pressed={active} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} size={16} />
    </button>
  );
}

export function ShareButton({ path }: { path: string }) {
  const { t, href } = useI18n();
  const toast = useToast();
  const modal = useModal();

  const onShare = () => {
    const url = `${window.location.origin}${href(path)}`;
    const fallback = () =>
      modal.open({
        title: t('common.actions.copyLink'),
        body: <input className="input" defaultValue={url} readOnly onFocus={(event) => event.currentTarget.select()} />
      });
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast(t('common.toast.copied'), 'success'))
        .catch(fallback);
    } else {
      fallback();
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onShare}
      aria-label={t('common.actions.share')}
      title={t('common.actions.share')}
    >
      <Icon name="share" size={18} />
    </button>
  );
}
