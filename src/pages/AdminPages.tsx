/* =====================================================================
   Administration — vue d'ensemble, membres, abonnements, contenus
   ---------------------------------------------------------------------
   Accès : rôle CONTENT_EDITOR et plus (routes) ; membres et abonnements
   réservés au rôle ADMIN. Chaque action est revérifiée côté service.
   Les créations et modifications vont dans le calque de contenus : les
   contenus de démonstration restent intacts et repérables (« exemple »).
   En production ces contrôles DOIVENT être refaits côté serveur.
   ===================================================================== */
import { useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { StatCard } from '../components/cards/Cards';
import { useModal } from '../components/feedback/ModalProvider';
import { useToast } from '../components/feedback/ToastProvider';
import { CoverArt } from '../components/home/CoverArt';
import { Icon } from '../components/icons/Icon';
import { AdminShell } from '../components/layout/Shells';
import { ContentForm } from './admin/ContentForm';
import {
  Alert,
  Avatar,
  Badge,
  Checkbox,
  EmptyState,
  Field,
  MetaRow,
  PillNav,
  SectionHead,
  SelectField,
  PageSize,
  SortTh,
  TablePager,
  Tabs,
  ViewToggle,
  usePageSize,
  useSort,
  TextareaField,
  usePaged,
  focusFirstError,
  readForm,
} from '../components/ui';
import { taxonomies } from '../data/taxonomies';
import { useQueryParam } from '../hooks/useQueryParam';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { analyticsSummary } from '../lib/analytics';
import { adminDeleteUser, adminSetRole, adminToggleStatus, currentUser, listUsers } from '../lib/auth';
import { all, create, getById, remove, searchText, titleOf, update, type ContentPayload } from '../lib/content';
import { formatDateShort, formatNumber, normalize, truncate } from '../lib/format';
import {
  approveSubscription,
  listSubscriptions,
  rejectSubscription,
  removeSubscription,
  subscriptionCounts,
  type SubscriptionFilter
} from '../lib/subscriptions';
import type { PublicUser } from '../model/account';
import type { Role } from '../model/common';
import type { AnyItem, Plan, PlanAudience, PlanInterval } from '../model/content';
import { useStoreVersion } from '../state/store';
import { SubscriptionStatusBadge } from './SubscriptionsPages';

const GRID_GAP: CSSProperties = { gap: '0 var(--space-4)' };

import type { AdminCollection } from '../model/common';
export type { AdminCollection };

/* ------------------------------------------------------------ helpers */

function UserCell({ user, extra }: { user: PublicUser; extra?: ReactNode }) {
  return (
    <div className="row" style={{ gap: 'var(--space-2)' }}>
      <Avatar user={user} size="sm" />
      <div>
        <strong>
          {user.firstName} {user.lastName}
        </strong>
        <div className="text-xs text-muted">{user.email}</div>
        {extra}
      </div>
    </div>
  );
}

function SearchBox({ id, label, value, onSearch }: { id: string; label: string; value: string; onSearch: (value: string | null) => void }) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onSearch(event.currentTarget.value.trim() || null);
  };
  return (
    <div className="header-search grow max-w-[380px]">
      <span className="search-icon">
        <Icon name="search" size={16} />
      </span>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input key={value} id={id} type="search" defaultValue={value} placeholder={label} onKeyDown={onKeyDown} />
    </div>
  );
}

function PublishedBadge({ draft }: { draft: boolean }) {
  const { t } = useI18n();
  return draft ? (
    <Badge variant="warning">{t('admin.content.draft')}</Badge>
  ) : (
    <Badge variant="success">{t('admin.content.published')}</Badge>
  );
}

/* ------------------------------------------------------ vue d'ensemble */

const COUNTED: [string, AdminCollection, string][] = [
  ['admin.nav.library', 'resources', 'admin/bibliotheque'],
  ['admin.nav.courses', 'courses', 'admin/formations'],
  ['admin.nav.webinars', 'webinars', 'admin/webinaires'],
  ['admin.nav.tools', 'tools', 'admin/outils'],
  ['admin.nav.exercises', 'exercises', 'admin/exercices'],
  ['admin.nav.pathologies', 'pathologies', 'admin/pathologies']
];

function countsOf(collection: AdminCollection) {
  const items = all(collection) as AnyItem[];
  return {
    total: items.length,
    published: items.filter((item) => item.published !== false).length,
    drafts: items.filter((item) => item.published === false).length
  };
}

/** Répartition des membres (six premières valeurs), utile pour piloter le recrutement. */
function Distribution({
  users,
  getter,
  labeller
}: {
  users: PublicUser[];
  getter: (user: PublicUser) => string;
  labeller?: (key: string) => string;
}) {
  const { t } = useI18n();
  const map: Record<string, number> = {};
  users.forEach((user) => {
    const key = getter(user) || '—';
    map[key] = (map[key] ?? 0) + 1;
  });
  const keys = Object.keys(map)
    .sort((a, b) => map[b] - map[a])
    .slice(0, 6);
  if (!keys.length) return <p className="text-sm text-muted mb-0">{t('admin.overview.noMembers')}</p>;
  return (
    <>
      {keys.map((key) => (
        <MetaRow key={key} label={labeller ? labeller(key) : key}>
          <span className="ltr-nums">{map[key]}</span>
        </MetaRow>
      ))}
    </>
  );
}

export function AdminOverviewPage() {
  useStoreVersion();
  const { t, tn, href } = useI18n();
  useSeo({ title: t('admin.title'), path: 'admin' });

  const users = listUsers();
  const analytics = analyticsSummary();
  const subs = subscriptionCounts();
  const resources = countsOf('resources');
  const latest = users
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <AdminShell active="admin" title={t('admin.title')} subtitle={t('admin.subtitle')}>
      <section className="grid grid-4">
        <StatCard label={t('admin.stats.users')} value={formatNumber(users.length)} icon="users" />
        <StatCard label={t('admin.overview.pendingSubs')} value={formatNumber(subs.pending)} icon="hourglass" />
        <StatCard label={t('admin.overview.activeSubs')} value={formatNumber(subs.active)} icon="creditCard" />
        <StatCard label={t('admin.stats.resources')} value={formatNumber(resources.total)} icon="library" />
      </section>

      {subs.pending ? (
        <section className="mt-8">
          <Alert variant="warning" title={t('admin.overview.pendingSubs')}>
            {tn(subs.pending, 'common.units.results')}
          </Alert>
          <Link className="btn btn-primary mt-4" to={href('admin/abonnements', { statut: 'pending' })}>
            <Icon name="creditCard" size={16} />
            {t('admin.overview.treat')}
          </Link>
        </section>
      ) : null}

      <section className="grid grid-3 mt-8">
        <div className="card">
          <strong>{t('admin.overview.byProfile')}</strong>
          <div className="meta-list mt-4">
            <Distribution
              users={users}
              getter={(user) => user.profileType}
              labeller={(key) => t(`auth.profileTypes.${key}`) || key}
            />
          </div>
        </div>
        <div className="card">
          <strong>{t('admin.overview.byRole')}</strong>
          <div className="meta-list mt-4">
            <Distribution users={users} getter={(user) => user.role} labeller={(key) => t(`taxonomies.roles.${key}`) || key} />
          </div>
        </div>
        <div className="card">
          <strong>{t('admin.overview.byCountry')}</strong>
          <div className="meta-list mt-4">
            <Distribution users={users} getter={(user) => user.country} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHead
          title={t('admin.overview.latestMembers')}
          ctaTo={href('admin/utilisateurs')}
          ctaLabel={t('common.actions.viewAll')}
        />
        {latest.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('admin.users.name')}</th>
                  <th>{t('admin.users.type')}</th>
                  <th>{t('admin.users.country')}</th>
                  <th>{t('admin.users.joined')}</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <UserCell user={user} />
                    </td>
                    <td>{t(`auth.profileTypes.${user.profileType}`)}</td>
                    <td>{user.country || '—'}</td>
                    <td className="num">{formatDateShort(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">{t('admin.overview.noMembers')}</p>
        )}
      </section>

      <section className="mt-8">
        <SectionHead title={t('admin.nav.overview')} />
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('common.labels.category')}</th>
                <th>{t('admin.stats.published')}</th>
                <th>{t('admin.stats.drafts')}</th>
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {COUNTED.map(([labelKey, collection, route]) => {
                const counts = countsOf(collection);
                return (
                  <tr key={collection}>
                    <td>{t(labelKey)}</td>
                    <td className="num">{counts.published}</td>
                    <td className="num">{counts.drafts}</td>
                    <td>
                      <Link className="btn btn-outline btn-sm" to={href(route)}>
                        {t('common.actions.edit')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <SectionHead title={t('admin.subtitle')} />
        <div className="card">
          <Alert variant="info">{t('admin.content.seedNotice')}</Alert>
          <div className="mt-6">
            <strong>{t('common.labels.results')}</strong>
            <div className="meta-list mt-4">
              {Object.keys(analytics.counts)
                .slice(0, 8)
                .map((name) => (
                  <MetaRow key={name} label={name}>
                    <span className="ltr-nums">{analytics.counts[name]}</span>
                  </MetaRow>
                ))}
              {analytics.total ? null : <p className="text-sm text-muted mb-0">—</p>}
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

/* --------------------------------------------------------------- membres */

export function AdminUsersPage() {
  useStoreVersion();
  const { t, tn } = useI18n();
  const toast = useToast();
  const modal = useModal();
  const [q, setQ] = useQueryParam('q');
  useSeo({ title: t('admin.nav.users'), path: 'admin/utilisateurs' });

  const query = q.toLowerCase();
  const me = currentUser();
  const users = listUsers().filter(
    (user) => !query || `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query)
  );
  const [view, setView] = useQueryParam('view');
  const grid = view === 'grid';
  const { size, setSize, options } = usePageSize(grid ? 12 : 10);
  const sort = useSort(users, {
    name: (user) => `${user.firstName} ${user.lastName}`,
    type: (user) => user.profileType,
    role: (user) => user.role,
    country: (user) => user.country ?? '',
    joined: (user) => user.createdAt,
    status: (user) => user.status
  });
  const paged = usePaged(sort.rows, size);

  const onRole = (userId: string, role: Role) => {
    if (adminSetRole(userId, role)) toast(t('common.toast.saved'), 'success');
  };

  const onToggle = (userId: string) => {
    if (adminToggleStatus(userId)) toast(t('common.toast.saved'), 'success');
  };

  const onDelete = (userId: string) => {
    void modal
      .confirm({
        title: t('common.actions.delete'),
        body: t('admin.users.deleteConfirm'),
        danger: true,
        confirmLabel: t('common.actions.delete')
      })
      .then((ok) => {
        if (ok && adminDeleteUser(userId)) toast(t('common.toast.deleted'), 'success');
      });
  };

  return (
    <AdminShell active="admin/utilisateurs" title={t('admin.nav.users')}>
      <div className="filter-bar">
        <SearchBox id="admin-user-search" label={t('admin.users.searchPlaceholder')} value={q} onSearch={setQ} />
        <span className="text-sm text-muted">{tn(users.length, 'common.units.results')}</span>

        <PageSize size={size} options={options} onChange={setSize} />
        <ViewToggle grid={grid} onChange={(next) => setView(next ? 'grid' : '')} />
      </div>

      {!users.length ? (
        <EmptyState />
      ) : grid ? (
        <div className="ws-ucards">
          {paged.rows.map((user) => {
            const isSelf = !!me && user.id === me.id;
            return (
              <article className="ws-ucard" key={user.id}>
                <div className="ws-ucard-top">
                  {user.status === 'suspended' ? (
                    <Badge variant="danger">{t('admin.users.suspended')}</Badge>
                  ) : (
                    <Badge variant="success">{t('admin.users.active')}</Badge>
                  )}
                  {!isSelf ? (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={t('common.actions.delete')}
                      onClick={() => onDelete(user.id)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  ) : null}
                </div>

                <div className="ws-ucard-head">
                  <Avatar user={user} />
                  <div>
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <span>{t(`auth.profileTypes.${user.profileType}`)}</span>
                  </div>
                </div>

                <dl className="ws-ucard-meta">
                  <div>
                    <dt>{t('admin.users.country')}</dt>
                    <dd>{user.country || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('admin.users.joined')}</dt>
                    <dd className="ltr-nums">{formatDateShort(user.createdAt)}</dd>
                  </div>
                </dl>

                <p className="ws-ucard-mail">
                  <Icon name="mail" size={14} />
                  <span>{user.email}</span>
                </p>

                <select
                  className="select"
                  value={user.role}
                  disabled={isSelf}
                  aria-label={t('admin.users.role')}
                  onChange={(event) => onRole(user.id, event.target.value as Role)}
                >
                  {[...taxonomies.roles].map((role) => (
                    <option key={role} value={role}>
                      {t(`taxonomies.roles.${role}`)}
                    </option>
                  ))}
                </select>

                {isSelf ? (
                  <p className="ws-ucard-self">{t('admin.users.selfWarning')}</p>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => onToggle(user.id)}
                  >
                    {user.status === 'suspended' ? t('admin.users.activate') : t('admin.users.suspend')}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortTh label={t('admin.users.name')} field="name" sort={sort} />
                <SortTh label={t('admin.users.type')} field="type" sort={sort} />
                <SortTh label={t('admin.users.role')} field="role" sort={sort} />
                <SortTh label={t('admin.users.country')} field="country" sort={sort} />
                <SortTh label={t('admin.users.joined')} field="joined" sort={sort} />
                <SortTh label={t('admin.users.status')} field="status" sort={sort} />
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.rows.map((user) => {
                const isSelf = !!me && user.id === me.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <UserCell user={user} />
                    </td>
                    <td>{t(`auth.profileTypes.${user.profileType}`)}</td>
                    <td>
                      <select
                        className="select"
                        style={{ minWidth: 150 }}
                        value={user.role}
                        disabled={isSelf}
                        aria-label={t('admin.users.role')}
                        onChange={(event) => onRole(user.id, event.target.value as Role)}
                      >
                        {[...taxonomies.roles].map((role) => (
                          <option key={role} value={role}>
                            {t(`taxonomies.roles.${role}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{user.country || '—'}</td>
                    <td className="num">{formatDateShort(user.createdAt)}</td>
                    <td>
                      {user.status === 'suspended' ? (
                        <Badge variant="danger">{t('admin.users.suspended')}</Badge>
                      ) : (
                        <Badge variant="success">{t('admin.users.active')}</Badge>
                      )}
                    </td>
                    <td>
                      <div className="row-wrap">
                        {isSelf ? (
                          <span className="text-xs text-muted">{t('admin.users.selfWarning')}</span>
                        ) : (
                          <>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => onToggle(user.id)}>
                              {user.status === 'suspended' ? t('admin.users.activate') : t('admin.users.suspend')}
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label={t('common.actions.delete')}
                              onClick={() => onDelete(user.id)}
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <TablePager {...paged} onChange={paged.goTo} />
    </AdminShell>
  );
}

/* --------------------------------------------------------------- contenus */

interface ContentConfig {
  route: string;
  titleKey: string;
  createKey: string;
  publicRoute: string;
  typeGroup?: 'resourceTypes' | 'toolTypes';
}

const CONTENT_CONFIG: Record<AdminCollection, ContentConfig> = {
  resources: {
    route: 'admin/bibliotheque',
    titleKey: 'admin.nav.library',
    createKey: 'admin.content.createResource',
    publicRoute: 'bibliotheque',
    typeGroup: 'resourceTypes'
  },
  courses: {
    route: 'admin/formations',
    titleKey: 'admin.nav.courses',
    createKey: 'admin.content.createCourse',
    publicRoute: 'formations'
  },
  webinars: {
    route: 'admin/webinaires',
    titleKey: 'admin.nav.webinars',
    createKey: 'admin.content.createWebinar',
    publicRoute: 'webinaires'
  },
  tools: {
    route: 'admin/outils',
    titleKey: 'admin.nav.tools',
    createKey: 'admin.content.createTool',
    publicRoute: 'outils',
    typeGroup: 'toolTypes'
  },
  exercises: {
    route: 'admin/exercices',
    titleKey: 'admin.nav.exercises',
    createKey: 'admin.content.create',
    publicRoute: 'exercices'
  },
  pathologies: {
    route: 'admin/pathologies',
    titleKey: 'admin.nav.pathologies',
    createKey: 'admin.content.create',
    publicRoute: 'pathologies'
  }
};

/** Collections dont l'intitulé est stocké dans `name` plutôt que `title`. */
/* Constantes des formules et des demandes d'abonnement. */
const INTERVALS: PlanInterval[] = ['free', 'month', 'year', 'quote'];
const AUDIENCES: PlanAudience[] = ['all', 'STUDENT', 'PHYSIOTHERAPIST'];
const SUB_FILTERS: SubscriptionFilter[] = ['all', 'pending', 'active', 'expired', 'rejected', 'cancelled'];

type Values = Record<string, unknown>;

const str = (data: Values, key: string): string => {
  const value = data[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};


/* -------------------------------------------------------------- contenus */

export function AdminContentPage({ collection }: { collection: AdminCollection }) {
  useStoreVersion();
  const { t, tn, term, href } = useI18n();
  const toast = useToast();
  const modal = useModal();
  const [q, setQ] = useQueryParam('q');
  const config = CONTENT_CONFIG[collection];
  useSeo({ title: t(config.titleKey), path: config.route });

  const needle = normalize(q.toLowerCase());
  const items = (all(collection) as AnyItem[]).filter((item) => !needle || searchText(item).includes(needle));

  const [view, setView] = useQueryParam('view');
  const grid = view === 'grid';
  const { size, setSize, options } = usePageSize(grid ? 12 : 10);
  const sort = useSort(items, {
    title: (item) => titleOf(item),
    type: (item) => str(item as unknown as Values, 'type'),
    region: (item) => str(item as unknown as Values, 'region'),
    status: (item) => (item.published === false ? '1' : '0')
  });
  const paged = usePaged(sort.rows, size);

  const openEditor = (id: string | null) => {
    const existing = id ? (getById(collection, id) as AnyItem | null) : null;
    modal.open({
      title: existing ? t('admin.content.edit') : t(config.createKey),
      size: 'lg',
      body: <ContentForm collection={collection} existing={existing} onDone={modal.close} />,
      footer: (
        <>
          <button type="button" className="btn btn-outline" onClick={modal.close}>
            {t('common.actions.cancel')}
          </button>
          <button type="submit" form="content-form" className="btn btn-primary">
            {t('common.actions.save')}
          </button>
        </>
      )
    });
  };

  const togglePublish = (item: AnyItem) => {
    update(collection, item.id, { published: item.published === false });
    toast(t('common.toast.saved'), 'success');
  };

  const onDelete = (id: string) => {
    void modal
      .confirm({
        title: t('common.actions.delete'),
        body: t('admin.content.deleteConfirm'),
        danger: true,
        confirmLabel: t('common.actions.delete')
      })
      .then((ok) => {
        if (!ok) return;
        remove(collection, id);
        toast(t('common.toast.deleted'), 'success');
      });
  };

  return (
    <AdminShell active={config.route} title={t(config.titleKey)} subtitle={t('admin.subtitle')}>
      <div className="filter-bar">
        <SearchBox id="admin-content-search" label={t('common.actions.search')} value={q} onSearch={setQ} />
        <span className="text-sm text-muted">{tn(items.length, 'common.units.results')}</span>
        <PageSize size={size} options={options} onChange={setSize} />
        <ViewToggle grid={grid} onChange={(next) => setView(next ? 'grid' : '')} />
        <button type="button" className="btn btn-primary" onClick={() => openEditor(null)}>
          <Icon name="plus" size={16} />
          {t(config.createKey)}
        </button>
      </div>

      {!items.length ? (
        <EmptyState />
      ) : grid ? (
        <div className="ws-ucards">
          {paged.rows.map((item) => {
            const record = item as unknown as Values;
            const type = str(record, 'type');
            const region = str(record, 'region');
            const draft = item.published === false;
            return (
              <article className="ws-ucard" key={item.id}>
                <Link className="ws-ucard-media" to={href(`${config.publicRoute}/${item.slug}`)}>
                  <CoverArt section={collection} />
                </Link>

                <div className="ws-ucard-top">
                  <PublishedBadge draft={draft} />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t('common.actions.delete')}
                    onClick={() => onDelete(item.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>

                <h3 className="ws-ucard-title">
                  <Link to={href(`${config.publicRoute}/${item.slug}`)}>{titleOf(item)}</Link>
                </h3>

                <dl className="ws-ucard-meta">
                  <div>
                    <dt>{t('admin.forms.type')}</dt>
                    <dd>{type && config.typeGroup ? term(config.typeGroup, type) : '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('admin.forms.region')}</dt>
                    <dd>{region ? term('regions', region) : '—'}</dd>
                  </div>
                </dl>

                <div className="ws-ucard-actions">
                  <button type="button" className="btn btn-outline btn-block" onClick={() => openEditor(item.id)}>
                    <Icon name="edit" size={14} />
                    {t('common.actions.edit')}
                  </button>
                  <button type="button" className="btn btn-primary btn-block" onClick={() => togglePublish(item)}>
                    {draft ? t('admin.content.publish') : t('admin.content.unpublish')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortTh label={t('admin.forms.title')} field="title" sort={sort} />
                {config.typeGroup ? <SortTh label={t('admin.forms.type')} field="type" sort={sort} /> : null}
                <SortTh label={t('admin.forms.region')} field="region" sort={sort} />
                <SortTh label={t('common.labels.status')} field="status" sort={sort} />
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.rows.map((item) => {
                const record = item as unknown as Values;
                const type = str(record, 'type');
                const region = str(record, 'region');
                const draft = item.published === false;
                return (
                  <tr key={item.id}>
                    <td>
                      <Link to={href(`${config.publicRoute}/${item.slug}`)}>{titleOf(item)}</Link>
                      {item.seed ? (
                        <>
                          {' '}
                          <span className="badge">exemple</span>
                        </>
                      ) : null}
                    </td>
                    {config.typeGroup ? <td>{type ? term(config.typeGroup, type) : '—'}</td> : null}
                    <td>{region ? term('regions', region) : '—'}</td>
                    <td>
                      <PublishedBadge draft={draft} />
                    </td>
                    <td>
                      <div className="row-wrap">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openEditor(item.id)}>
                          <Icon name="edit" size={14} />
                          {t('common.actions.edit')}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => togglePublish(item)}>
                          {draft ? t('admin.content.publish') : t('admin.content.unpublish')}
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={t('common.actions.delete')}
                          onClick={() => onDelete(item.id)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <TablePager {...paged} onChange={paged.goTo} />
    </AdminShell>
  );
}

function PlanEditor({ existing, onDone }: { existing: Plan | null; onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [nameError, setNameError] = useState<string>();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = readForm(event.currentTarget);
    if (!f.get('name')) {
      setNameError(t('auth.errors.required'));
      focusFirstError(formRef.current);
      return;
    }
    const payload: ContentPayload = {
      name: f.get('name'),
      tagline: f.get('tagline'),
      priceDzd: parseInt(f.get('priceDzd'), 10) || 0,
      interval: f.get('interval'),
      audience: f.get('audience'),
      order: parseInt(f.get('order'), 10) || 99,
      features: f
        .get('features')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      limits: f.get('limits'),
      premium: f.checked('premium'),
      highlighted: f.checked('highlighted'),
      published: f.checked('published')
    };
    if (existing) {
      update('plans', existing.id, payload);
      toast(t('common.toast.saved'), 'success');
    } else {
      create('plans', payload);
      toast(t('common.toast.created'), 'success');
    }
    onDone();
  };

  return (
    <form ref={formRef} id="plan-form" noValidate onSubmit={onSubmit}>
      <Field name="name" label={t('admin.subscriptions.fields.name')} defaultValue={existing?.name} required error={nameError} />
      <Field name="tagline" label={t('admin.subscriptions.fields.tagline')} defaultValue={existing?.tagline} />
      <div className="grid grid-2" style={GRID_GAP}>
        <Field name="priceDzd" label={t('admin.subscriptions.fields.price')} type="number" defaultValue={existing?.priceDzd} />
        <SelectField
          name="interval"
          label={t('admin.subscriptions.fields.interval')}
          defaultValue={existing?.interval || 'month'}
          options={INTERVALS.map((value) => ({ value, label: t(`subscriptions.interval.${value}`) }))}
        />
        <SelectField
          name="audience"
          label={t('admin.subscriptions.fields.audience')}
          defaultValue={existing?.audience || 'all'}
          options={AUDIENCES.map((value) => ({ value, label: t(`subscriptions.audience.${value}`) }))}
        />
        <Field name="order" label={t('admin.subscriptions.fields.order')} type="number" defaultValue={existing?.order} />
      </div>
      <TextareaField
        name="features"
        label={t('admin.subscriptions.fields.features')}
        defaultValue={(existing?.features ?? []).join('\n')}
      />
      <Field name="limits" label={t('admin.subscriptions.fields.limits')} defaultValue={existing?.limits} />
      <Checkbox name="premium" defaultChecked={!!existing?.premium} label={t('admin.subscriptions.fields.premium')} />
      <Checkbox name="highlighted" defaultChecked={!!existing?.highlighted} label={t('admin.subscriptions.fields.highlighted')} />
      <Checkbox name="published" defaultChecked={!!existing?.published} label={t('admin.subscriptions.fields.published')} />
    </form>
  );
}

export function AdminSubscriptionsPage() {
  useStoreVersion();
  const { t, tn } = useI18n();
  const toast = useToast();
  const modal = useModal();
  const [params, setParams] = useSearchParams();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  useSeo({ title: t('admin.subscriptions.title'), path: 'admin/abonnements' });

  const tab = params.get('tab') === 'formules' ? 'plans' : 'requests';
  const rawFilter = params.get('statut') ?? 'all';
  const filter: SubscriptionFilter = (SUB_FILTERS as string[]).includes(rawFilter) ? (rawFilter as SubscriptionFilter) : 'all';
  const counts = subscriptionCounts();
  const allPlans = all('plans');

  const selectTab = (key: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('statut');
      if (key === 'plans') next.set('tab', 'formules');
      else next.delete('tab');
      return next;
    });

  const selectFilter = (key: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (key === 'all') next.delete('statut');
      else next.set('statut', key);
      return next;
    });

  const confirmDelete = (body: string, action: () => void, message: string) => {
    void modal
      .confirm({ title: t('common.actions.delete'), body, danger: true, confirmLabel: t('common.actions.delete') })
      .then((ok) => {
        if (!ok) return;
        action();
        toast(message, 'success');
      });
  };

  const openPlanEditor = (planId: string | null) => {
    const existing = planId ? getById('plans', planId) : null;
    modal.open({
      title: existing ? t('admin.subscriptions.editPlan') : t('admin.subscriptions.createPlan'),
      size: 'lg',
      body: <PlanEditor existing={existing} onDone={modal.close} />,
      footer: (
        <>
          <button type="button" className="btn btn-outline" onClick={modal.close}>
            {t('common.actions.cancel')}
          </button>
          <button type="submit" form="plan-form" className="btn btn-primary">
            {t('common.actions.save')}
          </button>
        </>
      )
    });
  };

  const openDecision = (subscriptionId: string, approve: boolean) => {
    const label = t(approve ? 'admin.subscriptions.approve' : 'admin.subscriptions.reject');
    const confirmDecision = () => {
      const note = noteRef.current?.value ?? '';
      const result = approve ? approveSubscription(subscriptionId, note) : rejectSubscription(subscriptionId, note);
      modal.close();
      if ('forbidden' in result) {
        toast(t('admin.roleRequired'), 'error');
        return;
      }
      toast(t(approve ? 'admin.subscriptions.approved' : 'admin.subscriptions.rejected'), 'success');
    };
    modal.open({
      title: label,
      body: (
        <>
          <p>{t(approve ? 'admin.subscriptions.approveConfirm' : 'admin.subscriptions.rejectConfirm')}</p>
          <div className="field mt-4">
            <label htmlFor="decision-note">{t('admin.subscriptions.decisionNote')}</label>
            <textarea ref={noteRef} className="textarea" id="decision-note" maxLength={400} />
          </div>
        </>
      ),
      footer: (
        <>
          <button type="button" className="btn btn-outline" onClick={modal.close}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className={approve ? 'btn btn-primary' : 'btn btn-danger'} onClick={confirmDecision}>
            {label}
          </button>
        </>
      )
    });
  };

  let content: ReactNode;
  if (tab === 'plans') {
    const plans = allPlans.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    content = (
      <>
        <div className="filter-bar">
          <span className="text-sm text-muted">{tn(plans.length, 'common.units.results')}</span>
          <button type="button" className="btn btn-primary" onClick={() => openPlanEditor(null)}>
            <Icon name="plus" size={16} />
            {t('admin.subscriptions.createPlan')}
          </button>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('admin.subscriptions.fields.name')}</th>
                <th>{t('admin.subscriptions.fields.price')}</th>
                <th>{t('admin.subscriptions.fields.interval')}</th>
                <th>{t('admin.subscriptions.fields.audience')}</th>
                <th>{t('common.labels.access')}</th>
                <th>{t('common.labels.status')}</th>
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <strong>{plan.name}</strong>
                    {plan.highlighted ? (
                      <>
                        {' '}
                        <Badge variant="primary">{t('subscriptions.recommended')}</Badge>
                      </>
                    ) : null}
                    <div className="text-xs text-muted">{plan.tagline || ''}</div>
                  </td>
                  <td className="num">
                    {plan.interval === 'free' || plan.interval === 'quote'
                      ? '—'
                      : `${formatNumber(plan.priceDzd)} ${t('subscriptions.currency')}`}
                  </td>
                  <td>{t(`subscriptions.interval.${plan.interval}`)}</td>
                  <td>{t(`subscriptions.audience.${plan.audience || 'all'}`)}</td>
                  <td>
                    {plan.premium ? (
                      <Badge variant="primary">{t('taxonomies.access.premium')}</Badge>
                    ) : (
                      <Badge>{t('taxonomies.access.free')}</Badge>
                    )}
                  </td>
                  <td>
                    <PublishedBadge draft={plan.published === false} />
                  </td>
                  <td>
                    <div className="row-wrap">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openPlanEditor(plan.id)}>
                        <Icon name="edit" size={14} />
                        {t('common.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={t('common.actions.delete')}
                        onClick={() =>
                          confirmDelete(
                            t('admin.subscriptions.deletePlanConfirm'),
                            () => remove('plans', plan.id),
                            t('common.toast.deleted')
                          )
                        }
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else {
    const requests = listSubscriptions(filter);
    content = (
      <>
        <PillNav
          items={SUB_FILTERS.map((key) => ({
            key,
            label: key === 'all' ? t('dashboard.filters.all') : t(`subscriptions.status.${key}`),
            count: key === 'all' ? counts.total : counts[key]
          }))}
          active={filter}
          onChange={selectFilter}
        />
        {requests.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('admin.subscriptions.member')}</th>
                  <th>{t('admin.subscriptions.plan')}</th>
                  <th>{t('admin.subscriptions.requested')}</th>
                  <th>{t('common.labels.status')}</th>
                  <th>{t('admin.subscriptions.decision')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((entry) => {
                  const s = entry.subscription;
                  return (
                    <tr key={s.id}>
                      <td>
                        {entry.user ? (
                          <UserCell
                            user={entry.user}
                            extra={<div className="text-xs text-muted">{t(`auth.profileTypes.${entry.user.profileType}`)}</div>}
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {entry.plan ? entry.plan.name : '—'}
                        {s.note ? (
                          <div className="text-xs text-muted">
                            {t('admin.subscriptions.memberNote')} : {truncate(s.note, 80)}
                          </div>
                        ) : null}
                      </td>
                      <td className="num">
                        {formatDateShort(s.requestedAt)}
                        {s.endsAt ? (
                          <div className="text-xs text-muted">
                            {t('subscriptions.endsOn')} {formatDateShort(s.endsAt)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <SubscriptionStatusBadge status={entry.status} />
                        {s.decisionNote ? <div className="text-xs text-muted">{truncate(s.decisionNote, 60)}</div> : null}
                      </td>
                      <td>
                        <div className="row-wrap">
                          {entry.status === 'pending' ? (
                            <>
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => openDecision(s.id, true)}>
                                <Icon name="check" size={14} />
                                {t('admin.subscriptions.approve')}
                              </button>
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => openDecision(s.id, false)}>
                                {t('admin.subscriptions.reject')}
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={t('common.actions.delete')}
                            onClick={() =>
                              confirmDelete(
                                t('admin.content.deleteConfirm'),
                                () => removeSubscription(s.id),
                                t('admin.subscriptions.removed')
                              )
                            }
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState body={t('admin.subscriptions.noRequests')} />
        )}
      </>
    );
  }

  return (
    <AdminShell active="admin/abonnements" title={t('admin.subscriptions.title')} subtitle={t('admin.subscriptions.subtitle')}>
      <Tabs
        items={[
          { key: 'requests', label: t('admin.subscriptions.requestsTab'), count: counts.total },
          { key: 'plans', label: t('admin.subscriptions.plansTab'), count: allPlans.length }
        ]}
        active={tab}
        onChange={selectTab}
      />
      {content}
    </AdminShell>
  );
}
