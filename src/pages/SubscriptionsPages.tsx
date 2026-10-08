/* =====================================================================
   Abonnements — page publique des formules et « Mon abonnement »
   ---------------------------------------------------------------------
   Parcours : le membre choisit une formule → une demande est créée →
   l'administration approuve ou refuse → l'accès premium s'ouvre.
   Aucun paiement n'est traité en ligne (cf. lib/subscriptions.ts).
   ===================================================================== */
import { useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useModal } from '../components/feedback/ModalProvider';
import { useToast } from '../components/feedback/ToastProvider';
import { Icon } from '../components/icons/Icon';
import { WorkspaceShell } from '../components/layout/Shells';
import { Alert, Badge, Breadcrumb, EmptyState, MetaRow, SectionHead, type BadgeVariant } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { currentUser } from '../lib/auth';
import { plans as listPlans, titleOf } from '../lib/content';
import { formatDate, formatDateShort, formatNumber } from '../lib/format';
import {
  cancelSubscription,
  currentSubscription,
  mySubscriptions,
  pendingSubscription,
  requestPlan,
  type SubscriptionEntry
} from '../lib/subscriptions';
import type { SubscriptionStatus } from '../model/account';
import type { IconName } from '../components/icons/Icon';
import type { Plan } from '../model/content';
import { useStoreVersion } from '../state/store';

/* --------------------------------------------------------------- blocs */

/** Prix mis en forme selon la périodicité de la formule. */
export function PriceBlock({ plan }: { plan: Plan }) {
  const { t } = useI18n();
  if (plan.interval === 'free' || plan.interval === 'quote') {
    return (
      <div className="plan-price">
        <span className="pp-value">{t(plan.interval === 'free' ? 'subscriptions.free' : 'subscriptions.quote')}</span>
      </div>
    );
  }
  return (
    <div className="plan-price">
      <span className="pp-value ltr-nums">{formatNumber(plan.priceDzd)}</span>
      <span className="pp-unit">{t('subscriptions.currency')}</span>
      <span className="pp-period">{t(plan.interval === 'year' ? 'subscriptions.perYear' : 'subscriptions.perMonth')}</span>
    </div>
  );
}

const STATUS_VARIANTS: Record<SubscriptionStatus, BadgeVariant | undefined> = {
  active: 'success',
  pending: 'warning',
  rejected: 'danger',
  cancelled: undefined,
  expired: 'warning'
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { t } = useI18n();
  return <Badge variant={STATUS_VARIANTS[status]}>{t(`subscriptions.status.${status}`)}</Badge>;
}

function PlanCard({
  plan,
  current,
  pending,
  onRequest
}: {
  plan: Plan;
  current: SubscriptionEntry | null;
  pending: SubscriptionEntry | null;
  onRequest: (plan: Plan) => void;
}) {
  const { t } = useI18n();
  const isCurrent = current?.plan?.id === plan.id;
  const isPending = pending?.plan?.id === plan.id;

  let cta: ReactNode;
  if (isCurrent) {
    cta = (
      <button type="button" className="btn btn-outline btn-block" disabled>
        <Icon name="checkCircle" size={16} />
        {t('subscriptions.status.active')}
      </button>
    );
  } else if (isPending) {
    cta = (
      <button type="button" className="btn btn-outline btn-block" disabled>
        <Icon name="hourglass" size={16} />
        {t('subscriptions.status.pending')}
      </button>
    );
  } else {
    cta = (
      <button
        type="button"
        className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-outline'} btn-block`}
        onClick={() => onRequest(plan)}
      >
        {t(plan.interval === 'quote' ? 'subscriptions.requestQuote' : 'subscriptions.choosePlan')}
      </button>
    );
  }

  const className = ['plan-card', plan.highlighted ? 'is-highlighted' : '', isCurrent ? 'is-current' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className}>
      {plan.highlighted ? (
        <span className="plan-flag">
          <Icon name="crown" size={13} />
          {t('subscriptions.recommended')}
        </span>
      ) : null}
      <h3 className="card-title">{titleOf(plan)}</h3>
      <p className="text-sm text-muted">{plan.tagline || ''}</p>
      <PriceBlock plan={plan} />
      {plan.audience && plan.audience !== 'all' ? (
        <p className="text-xs">
          <Badge variant="primary">{t(`subscriptions.audience.${plan.audience}`)}</Badge>
        </p>
      ) : null}
      <ul className="plan-features">
        {(plan.features ?? []).map((feature, index) => (
          <li key={index}>
            <Icon name="check" size={15} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {plan.limits ? <p className="hint">{plan.limits}</p> : null}
      <div className="mt-auto">{cta}</div>
    </article>
  );
}

/* --------------------------------------------- demande d'abonnement --- */

function useRequestPlan(): (plan: Plan) => void {
  const { t, href } = useI18n();
  const modal = useModal();
  const toast = useToast();
  const navigate = useNavigate();
  const noteRef = useRef<HTMLTextAreaElement>(null);

  return (plan: Plan) => {
    if (!currentUser()) {
      toast(t('subscriptions.loginRequired'), 'error');
      navigate(href('connexion'));
      return;
    }

    const submit = () => {
      const result = requestPlan(plan.id, noteRef.current?.value ?? '');
      modal.close();
      if ('requiresAuth' in result) {
        navigate(href('connexion'));
        return;
      }
      if ('error' in result) {
        if (result.error === 'demande-en-cours') toast(t('subscriptions.alreadyPending'), 'error');
        else if (result.error === 'deja-actif') toast(t('subscriptions.alreadyActive'), 'error');
        else toast(t('common.toast.genericError'), 'error');
        return;
      }
      toast(t(result.immediate ? 'subscriptions.activatedNow' : 'subscriptions.sent'), 'success');
    };

    modal.open({
      title: t('subscriptions.requestTitle', { plan: titleOf(plan) }),
      body: (
        <>
          <p>{t('subscriptions.requestBody')}</p>
          <div className="card card-flat mt-4">
            <PriceBlock plan={plan} />
            <p className="text-sm text-muted mb-0">{plan.tagline || ''}</p>
          </div>
          <div className="field mt-6">
            <label htmlFor="sub-note">{t('subscriptions.note')}</label>
            <textarea
              ref={noteRef}
              className="textarea"
              id="sub-note"
              maxLength={400}
              placeholder={t('subscriptions.notePlaceholder')}
            />
          </div>
        </>
      ),
      footer: (
        <>
          <button type="button" className="btn btn-outline" onClick={modal.close}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            {t('subscriptions.submit')}
          </button>
        </>
      )
    });
  };
}

/* ----------------------------------------------------- page publique -- */

const STEPS: { icon: IconName; key: string }[] = [
  { icon: 'creditCard', key: 'subscriptions.step1' },
  { icon: 'shield', key: 'subscriptions.step2' },
  { icon: 'checkCircle', key: 'subscriptions.step3' }
];

export function SubscriptionsPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const user = useCurrentUser();
  const onRequest = useRequestPlan();

  const plans = listPlans();
  const current = user ? currentSubscription() : null;
  const pending = user ? pendingSubscription() : null;

  useSeo({ title: t('subscriptions.title'), description: t('subscriptions.subtitle'), path: 'abonnements' });

  let banner: ReactNode = null;
  if (pending) {
    banner = (
      <Alert variant="warning" title={t('subscriptions.pendingTitle')}>
        {t('subscriptions.pendingBody', {
          plan: pending.plan ? titleOf(pending.plan) : '—',
          date: formatDate(pending.subscription.requestedAt)
        })}
      </Alert>
    );
  } else if (current) {
    banner = (
      <Alert variant="success" title={t('subscriptions.currentPlan')}>
        {titleOf(current.plan)}
        {current.subscription.endsAt
          ? ` — ${t('subscriptions.endsOn')} ${formatDate(current.subscription.endsAt)}`
          : ''}
      </Alert>
    );
  } else if (!user) {
    banner = <Alert variant="info">{t('subscriptions.loginRequired')}</Alert>;
  }

  return (
    <div className="ka-container section">
      <Breadcrumb items={[{ label: t('common.nav.home'), to: href('') }, { label: t('subscriptions.title') }]} />
      <header className="detail-head">
        <h1>{t('subscriptions.title')}</h1>
        <p className="lead max-w-[78ch]">{t('subscriptions.subtitle')}</p>
      </header>
      {banner ? <div style={{ marginBlockEnd: 'var(--space-6)' }}>{banner}</div> : null}

      {plans.length ? (
        <div className="plan-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} current={current} pending={pending} onRequest={onRequest} />
          ))}
        </div>
      ) : (
        <EmptyState body={t('subscriptions.empty')} />
      )}

      <section className="section-sm mt-8">
        <SectionHead title={t('subscriptions.howItWorks')} />
        <div className="grid grid-3">
          {STEPS.map((step, index) => (
            <div key={step.key} className="card card-flat">
              <span className="feature-icon">
                <Icon name={step.icon} size={22} />
              </span>
              <p className="mt-4 mb-0">
                <span className="text-muted ltr-nums">0{index + 1}.</span> {t(step.key)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Alert variant="info">{t('subscriptions.paymentNotice')}</Alert>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------- « mon abonnement » */

function HistoryRows({ entry }: { entry: SubscriptionEntry }) {
  const { t } = useI18n();
  const s = entry.subscription;
  return (
    <div className="meta-list">
      <MetaRow label={t('subscriptions.requestedOn')}>{formatDate(s.requestedAt)}</MetaRow>
      {s.approvedAt ? <MetaRow label={t('subscriptions.approvedOn')}>{formatDate(s.approvedAt)}</MetaRow> : null}
      {s.endsAt ? <MetaRow label={t('subscriptions.endsOn')}>{formatDate(s.endsAt)}</MetaRow> : null}
      {s.decisionNote ? <MetaRow label={t('subscriptions.decisionNote')}>{s.decisionNote}</MetaRow> : null}
    </div>
  );
}

export function MySubscriptionPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const modal = useModal();
  const toast = useToast();
  const onRequest = useRequestPlan();

  const current = currentSubscription();
  const pending = pendingSubscription();
  const history = mySubscriptions();
  const plans = listPlans();

  useSeo({ title: t('subscriptions.myTitle'), path: 'dashboard/abonnement' });

  const onCancel = (id: string) => {
    void modal
      .confirm({
        title: t('subscriptions.cancel'),
        body: t('subscriptions.cancelConfirm'),
        danger: true,
        confirmLabel: t('common.actions.confirm')
      })
      .then((ok) => {
        if (!ok) return;
        cancelSubscription(id);
        toast(t('subscriptions.cancelled'), 'success');
      });
  };

  let activeBlock: ReactNode;
  if (current) {
    activeBlock = (
      <div className="card">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="label mb-0">{t('subscriptions.currentPlan')}</p>
            <h2 style={{ margin: 'var(--space-1) 0' }}>{titleOf(current.plan)}</h2>
            <p className="text-sm text-muted mb-0">{current.plan?.tagline || ''}</p>
          </div>
          <SubscriptionStatusBadge status={current.status} />
        </div>
        <div className="mt-6">
          <HistoryRows entry={current} />
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm mt-6"
          onClick={() => onCancel(current.subscription.id)}
        >
          {t('subscriptions.cancelActive')}
        </button>
      </div>
    );
  } else if (pending) {
    activeBlock = (
      <div className="card">
        <Alert variant="warning" title={t('subscriptions.pendingTitle')}>
          {t('subscriptions.pendingBody', {
            plan: pending.plan ? titleOf(pending.plan) : '—',
            date: formatDate(pending.subscription.requestedAt)
          })}
        </Alert>
        <div className="mt-6">
          <HistoryRows entry={pending} />
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm mt-6"
          onClick={() => onCancel(pending.subscription.id)}
        >
          {t('subscriptions.cancel')}
        </button>
      </div>
    );
  } else {
    activeBlock = (
      <EmptyState
        title={t('subscriptions.noPlan')}
        body={t('subscriptions.noPlanBody')}
        ctaTo={href('abonnements')}
        ctaLabel={t('subscriptions.title')}
      />
    );
  }

  const past = history
    .filter((entry) => !current || entry.subscription.id !== current.subscription.id)
    .filter((entry) => !pending || entry.subscription.id !== pending.subscription.id);

  return (
    <WorkspaceShell active="dashboard/abonnement" title={t('subscriptions.myTitle')} subtitle={t('subscriptions.mySubtitle')}>
      {activeBlock}

      <section className="mt-8">
        <SectionHead title={t('subscriptions.title')} ctaTo={href('abonnements')} ctaLabel={t('common.actions.viewAll')} />
        <div className="plan-grid plan-grid-compact">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} current={current} pending={pending} onRequest={onRequest} />
          ))}
        </div>
      </section>

      {past.length ? (
        <section className="mt-8">
          <SectionHead title={t('subscriptions.history')} />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('subscriptions.currentPlan')}</th>
                  <th>{t('subscriptions.requestedOn')}</th>
                  <th>{t('common.labels.status')}</th>
                  <th>{t('subscriptions.decisionNote')}</th>
                </tr>
              </thead>
              <tbody>
                {past.map((entry) => (
                  <tr key={entry.subscription.id}>
                    <td>{entry.plan ? titleOf(entry.plan) : '—'}</td>
                    <td className="num">{formatDateShort(entry.subscription.requestedAt)}</td>
                    <td>
                      <SubscriptionStatusBadge status={entry.status} />
                    </td>
                    <td className="text-sm">{entry.subscription.decisionNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
