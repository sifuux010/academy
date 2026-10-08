/* =====================================================================
   Pagination de tableau
   ---------------------------------------------------------------------
   Les tableaux de l'administration rendaient toutes leurs lignes d'un
   coup : cent cinquante membres, cela fait cent cinquante rangées à
   peindre et à parcourir, pour une page qu'on ouvre en général pour en
   chercher une seule.

   Trois choix, repris des maquettes :

   - **les numéros sont écrits sur deux chiffres** (01, 02…). Leur largeur
     ne change donc pas au passage de 9 à 10, et la rangée ne tressaute
     pas d'une page à l'autre.
   - **le voisinage seul est déplié.** Première page, dernière page et
     les voisines immédiates ; le reste est replié derrière une ellipse.
     Sur onze pages on les verrait toutes, sur deux cents la barre ferait
     trois lignes.
   - **le décompte est écrit en toutes lettres** (« 1 à 10 sur 150 »).
     Une barre de pagination seule ne dit pas combien il reste.

   L'état vit dans l'URL (`?page=`) : une page de résultats se partage et
   survit au bouton Précédent du navigateur.
   ===================================================================== */
import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useQueryParam } from '../../hooks/useQueryParam';
import { Icon } from '../icons/Icon';

/**
 * Découpe une liste en pages.
 *
 * Renvoie la tranche courante et de quoi dessiner la barre. La page est
 * ramenée dans les bornes à la lecture : un `?page=99` collé à la main,
 * ou une page qui se vide après un filtrage, ne doit pas donner un
 * tableau blanc.
 */
export function usePaged<T>(items: T[], perPage = 10) {
  const [raw, setPage] = useQueryParam('page');

  return useMemo(() => {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(pages, Math.max(1, Number(raw) || 1));
    const from = (page - 1) * perPage;
    return {
      rows: items.slice(from, from + perPage),
      page,
      pages,
      total,
      /** Index humains de la tranche affichée, pour le décompte. */
      first: total ? from + 1 : 0,
      last: Math.min(from + perPage, total),
      goTo: (next: number) => setPage(next === 1 ? '' : String(next))
    };
  }, [items, perPage, raw, setPage]);
}

const pad = (value: number) => String(value).padStart(2, '0');

export function TablePager({
  page,
  pages,
  total,
  first,
  last,
  onChange
}: {
  page: number;
  pages: number;
  total: number;
  first: number;
  last: number;
  onChange: (page: number) => void;
}) {
  const { t } = useI18n();
  if (total === 0) return null;

  const slots: (number | '…')[] = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) slots.push(i);
    else if (slots[slots.length - 1] !== '…') slots.push('…');
  }

  return (
    <nav className="ws-pager" aria-label={t('common.labels.results')}>
      {pages > 1 ? (
        <>
          <button
            type="button"
            className="ws-pager-step"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          >
            <Icon name="chevronLeft" size={15} className="icon-flip" />
            {t('common.pagination.prev')}
          </button>

          <div className="ws-pager-pages">

          {slots.map((slot, index) =>
            slot === '…' ? (
              <span key={`gap-${index}`} className="ws-pager-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={slot}
                type="button"
                className="ws-pager-num ltr-nums"
                aria-current={slot === page ? 'page' : undefined}
                onClick={() => onChange(slot)}
              >
                {pad(slot)}
              </button>
            )
          )}

          </div>

          <button
            type="button"
            className="ws-pager-step"
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
          >
            {t('common.pagination.next')}
            <Icon name="chevronRight" size={15} className="icon-flip" />
          </button>
        </>
      ) : (
        /* Une seule page : le décompte prend la place, sinon le pied
           serait vide alors qu'il porte encore une information. */
        <p className="ws-pager-count">
          {t('admin.pager.showing', { first: String(first), last: String(last), total: String(total) })}
        </p>
      )}
    </nav>
  );
}
