import { useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { formatNumber } from '../../lib/format';
import { Icon } from '../icons/Icon';

/* ---------------------------------------------------------- pagination */

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const { t } = useI18n();
  if (pages <= 1) return null;
  const items: (number | '…')[] = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items[items.length - 1] !== '…') items.push('…');
  }
  return (
    <nav className="pagination" aria-label={t('common.labels.results')}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('common.pagination.prev')}>
        <Icon name="arrowLeft" size={16} className="icon-flip" />
      </button>
      {items.map((item, index) =>
        item === '…' ? (
          <button key={`gap-${index}`} type="button" disabled>
            …
          </button>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t('common.pagination.next')}>
        <Icon name="arrowRight" size={16} className="icon-flip" />
      </button>
    </nav>
  );
}

/* -------------------------------------------------- onglets et pastilles */

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({ items, active, onChange }: { items: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === active}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count !== undefined ? (
            <>
              {' '}
              <span className="filter-count ltr-nums">({formatNumber(item.count)})</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function PillNav({ items, active, onChange }: { items: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="pill-nav">
      {items.map((item) => (
        <button key={item.key} type="button" aria-pressed={item.key === active} onClick={() => onChange(item.key)}>
          {item.label}
          {item.count !== undefined ? (
            <>
              {' '}
              <span className="ltr-nums">({item.count})</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- accordéon */

export interface AccordionItem {
  title: string;
  body: ReactNode;
  open?: boolean;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [state, setState] = useState<Record<number, boolean>>({});
  return (
    <div className="accordion">
      {items.map((item, index) => {
        const open = state[index] ?? item.open ?? index === 0;
        return (
          <div key={`${index}-${item.title}`} className="accordion-item" data-open={open ? 'true' : 'false'}>
            <button
              type="button"
              className="accordion-head"
              aria-expanded={open}
              onClick={() => setState((s) => ({ ...s, [index]: !open }))}
            >
              <span>{item.title}</span>
              <span className="chev">
                <Icon name="chevronDown" size={18} />
              </span>
            </button>
            <div className="accordion-body">{item.body}</div>
          </div>
        );
      })}
    </div>
  );
}
