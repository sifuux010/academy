/* =====================================================================
   Pages éditoriales — à propos, conditions, confidentialité,
   avertissement médical, contact, FAQ — et page introuvable
   ===================================================================== */
import type { ReactNode } from 'react';
import { MAIN_SITE } from '../components/layout/Header';
import { Accordion, Alert, Breadcrumb, MedicalNotice, NotFoundState } from '../components/ui';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { stats } from '../lib/content';
import { formatNumber } from '../lib/format';

export type LegalKey = 'about' | 'terms' | 'privacy' | 'medical' | 'contact';

export function LegalPage({ page, path, children }: { page: LegalKey; path: string; children?: ReactNode }) {
  const { t, href } = useI18n();
  const title = t(`legal.${page}.title`);
  const body = t(`legal.${page}.body`);
  useSeo({ title, description: body, path });
  return (
    <div className="ka-container ka-container-narrow section">
      <Breadcrumb items={[{ label: t('common.nav.home'), to: href('') }, { label: title }]} />
      <article className="prose">
        <h1>{title}</h1>
        <p className="lead">{body}</p>
        {children}
      </article>
      <div className="mt-8">
        <MedicalNotice />
      </div>
    </div>
  );
}

export function AboutPage() {
  const { t } = useI18n();
  const s = stats();
  const figures: [number, string][] = [
    [s.resources, 'home.stats.resources'],
    [s.coursesAndWebinars, 'home.stats.courses'],
    [s.tools, 'home.stats.tools'],
    [s.pathologies, 'home.stats.pathologies']
  ];
  return (
    <LegalPage page="about" path="a-propos">
      <h2>{t('home.sections.ecosystem')}</h2>
      <ul>
        <li>
          <strong>{t('home.ecosystem.site')}</strong> — {t('home.ecosystem.siteDesc')} (
          <a href={MAIN_SITE} target="_blank" rel="noopener noreferrer">
            kinedokdz.com
          </a>
          )
        </li>
        <li>
          <strong>{t('home.ecosystem.academy')}</strong> — {t('home.ecosystem.academyDesc')}
        </li>
      </ul>
      <h2>{t('common.labels.results')}</h2>
      <ul>
        {figures.map(([value, key]) => (
          <li key={key}>{`${formatNumber(value)} — ${t(key)}`}</li>
        ))}
      </ul>
    </LegalPage>
  );
}

export function FaqPage() {
  const { t, href } = useI18n();
  useSeo({ title: t('legal.faq.title'), path: 'faq' });
  const items = [1, 2, 3, 4].map((n) => ({
    title: t(`legal.faq.q${n}`),
    body: <p>{t(`legal.faq.a${n}`)}</p>,
    open: n === 1
  }));
  return (
    <div className="ka-container ka-container-narrow section">
      <Breadcrumb items={[{ label: t('common.nav.home'), to: href('') }, { label: t('legal.faq.title') }]} />
      <h1>{t('legal.faq.title')}</h1>
      <div className="mt-6">
        <Accordion items={items} />
      </div>
      <div className="mt-8">
        <Alert variant="info" title={t('legal.contact.title')}>
          {t('legal.contact.body')}
        </Alert>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  useSeo({ title: t('common.states.notFoundTitle') });
  return <NotFoundState />;
}
