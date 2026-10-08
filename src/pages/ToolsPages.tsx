/* =====================================================================
   Outils pratiques — tests, questionnaires, scores et bilans
   ---------------------------------------------------------------------
   « Télécharger » ouvre la fiche complète mise en page pour l'impression
   ou l'enregistrement en PDF : le contenu affiché est le contenu réel de
   la fiche. Quand les PDF officiels seront sur le stockage, il suffira
   de servir `tool.fileUrl` à la place.
   ===================================================================== */
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { FeaturedPanel, ToolCard } from '../components/cards/Cards';
import { BulletList, OrderedList, PathologyTagsCard } from '../components/content/Shared';
import { QueryPills } from '../components/filters/QueryPills';
import { Icon } from '../components/icons/Icon';
import {
  AccessBadge,
  Badge,
  Breadcrumb,
  FavoriteButton,
  MedicalNotice,
  MetaRow,
  NotFoundState,
  SectionHead,
  ShareButton
} from '../components/ui';
import { taxonomies } from '../data/taxonomies';
import { useContentActions } from '../hooks/useContentActions';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { recordView } from '../lib/activity';
import { getBySlug, published, related, titleOf } from '../lib/content';
import { formatFileSize, formatNumber } from '../lib/format';
import { useStoreVersion } from '../state/store';
import { ListPage } from './ListPage';

export function ToolsListPage() {
  const { t, term, href } = useI18n();
  const tools = published('tools');

  /* Mise en avant : l'outil le plus téléchargé. Il reste par ailleurs à
     sa place dans la grille — l'encart le signale, il ne le déplace pas. */
  const star = [...tools].sort((a, b) => b.downloads - a.downloads)[0];
  const pills = (
    <QueryPills
      param="type"
      allLabel={t('tools.allCategories')}
      options={[...taxonomies.toolTypes].map((type) => ({
        value: type,
        label: term('toolTypesPlural', type),
        count: tools.filter((tool) => tool.type === type).length
      }))}
    />
  );
  return (
    <ListPage
      collection="tools"
      route="outils"
      preset="tools"
      title={t('tools.title')}
      subtitle={t('tools.subtitle')}
      placeholder={t('tools.searchPlaceholder')}
      renderCard={(tool) => <ToolCard tool={tool} />}
      sorts={['popular', 'az', 'newest']}
      defaultSort="popular"
      perPage={12}
      eyebrow={t('common.listing.eyebrow.tools')}
      intro={pills}
      featured={
        star ? (
          <FeaturedPanel
            label={t('common.listing.featured')}
            title={titleOf(star)}
            description={star.subtitle || star.description}
            to={href(`outils/${star.slug}`)}
            cta={t('common.actions.details')}
            meta={[
              { icon: 'stethoscope', text: term('toolTypes', star.type) },
              { icon: 'file', text: star.format.toUpperCase() },
              { icon: 'download', text: formatFileSize(star.sizeKb) }
            ]}
            illustration="/illustrations/tools.webp"
          />
        ) : null
      }
    />
  );
}

export function ToolPage() {
  useStoreVersion();
  const { slug } = useParams();
  const { t, term, href } = useI18n();
  const { downloadTool } = useContentActions();

  const found = getBySlug('tools', slug);
  const tool = found && found.published !== false ? found : null;

  useEffect(() => {
    if (tool) recordView('tools', tool.id);
  }, [tool?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useSeo(
    tool
      ? { title: titleOf(tool), description: tool.description, path: `outils/${tool.slug}`, type: 'article' }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!tool) return <NotFoundState />;

  const relatedTools = related('tools', tool, 4);

  return (
    <div className="ka-container section">
      <Breadcrumb
        items={[
          { label: t('common.nav.home'), to: href('') },
          { label: t('tools.title'), to: href('outils') },
          { label: term('toolTypesPlural', tool.type), to: href('outils', { type: tool.type }) },
          { label: titleOf(tool) }
        ]}
      />

      <div className="layout-detail">
        <article>
          <header className="detail-head">
            <div className="row-wrap">
              <Badge variant="primary">{term('toolTypes', tool.type)}</Badge>
              <Badge>{term('regions', tool.region)}</Badge>
              <Badge>{term('specialties', tool.specialty)}</Badge>
              <AccessBadge access={tool.access} />
            </div>
            <h1 className="mt-4">{titleOf(tool)}</h1>
            <p className="lead">{tool.subtitle}</p>
          </header>

          <div className="prose">
            <p>{tool.description}</p>
            <h2>{t('tools.purpose')}</h2>
            <p>{tool.purpose}</p>
            {tool.indications?.length ? (
              <>
                <h2>{t('common.labels.indications')}</h2>
                <BulletList items={tool.indications} />
              </>
            ) : null}
            {tool.contraindications?.length ? (
              <>
                <h2>{t('common.labels.contraindications')}</h2>
                <BulletList items={tool.contraindications} />
              </>
            ) : null}
            {tool.equipment?.length ? (
              <>
                <h2>{t('common.labels.equipment')}</h2>
                <BulletList items={tool.equipment} />
              </>
            ) : null}
            <h2>{t('tools.procedure')}</h2>
            <OrderedList items={tool.procedure} />
            <h2>{t('tools.scoring')}</h2>
            <p>{tool.scoring}</p>
            <h2>{t('tools.interpretation')}</h2>
            <BulletList items={tool.interpretation} />
            {tool.psychometrics ? (
              <>
                <h2>{t('tools.psychometrics')}</h2>
                <p>{tool.psychometrics}</p>
              </>
            ) : null}
            <h2>{t('common.labels.references')}</h2>
            <BulletList items={tool.references} />
          </div>

          <div className="mt-8">
            <MedicalNotice />
          </div>

          {relatedTools.length ? (
            <section className="mt-8">
              <SectionHead title={t('common.labels.relatedContent')} />
              <div className="grid grid-2">
                {relatedTools.map((item) => (
                  <ToolCard key={item.id} tool={item} />
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="sticky-side stack">
          <div className="card">
            <div className="row-wrap justify-between">
              <strong>{t('library.metadata')}</strong>
              <div className="row-wrap">
                <FavoriteButton collection="tools" id={tool.id} />
                <ShareButton path={`outils/${tool.slug}`} />
              </div>
            </div>
            <div className="meta-list mt-4">
              <MetaRow label={t('common.labels.type')}>{term('toolTypes', tool.type)}</MetaRow>
              <MetaRow label={t('common.labels.region')}>{term('regions', tool.region)}</MetaRow>
              <MetaRow label={t('common.labels.specialty')}>{term('specialties', tool.specialty)}</MetaRow>
              <MetaRow label={t('common.labels.format')}>{term('formats', tool.format)}</MetaRow>
              <MetaRow label={t('common.labels.size')}>
                <span className="file-size">{formatFileSize(tool.sizeKb)}</span>
              </MetaRow>
              <MetaRow label={t('common.labels.downloads')}>
                <span className="ltr-nums">{formatNumber(tool.downloads)}</span>
              </MetaRow>
            </div>
            <div className="stack-sm mt-6">
              <button type="button" className="btn btn-primary btn-block" onClick={() => downloadTool(tool)}>
                <Icon name="download" size={18} />
                {t('tools.downloadPdf')}
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={() => downloadTool(tool)}>
                <Icon name="print" size={18} />
                {t('tools.printable')}
              </button>
            </div>
          </div>

          <PathologyTagsCard slugs={tool.pathologies} heading={t('tools.relatedPathologies')} />
        </aside>
      </div>
    </div>
  );
}
