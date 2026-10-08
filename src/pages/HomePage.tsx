/* =====================================================================
   Page d'accueil
   ---------------------------------------------------------------------
   Composition pilotée par les données : bannières, rayons, parcours et
   contenus sponsorisés viennent de `/api/promotions/home/`, administrés
   depuis Django. Rien n'est codé en dur ici — un rayon ajouté en
   administration apparaît sans toucher à ce fichier.

   Ordre de lecture : d'abord ce qui concerne le membre (sa progression),
   puis ce que la plateforme met en avant, puis comment s'y repérer, enfin
   l'invitation à s'inscrire. Un membre connecté n'a pas à redécouvrir la
   vitrine à chaque visite.
   ===================================================================== */
import { type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ContinueLearning,
  LearningPaths,
  SearchPromo,
  type ContinueEntry
} from '../components/home/Blocks';
import { Hero } from '../components/home/Hero';
import {
  ActionTiles,
  CareerPanel,
  CategoryPills,
  Counters,
  PartnerStrip,
  ShelfGroups,
  TrendingSearches
} from '../components/home/Sections';
import { Icon } from '../components/icons/Icon';
import { MedicalNotice } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useHomeData } from '../hooks/useHomeData';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { myCourses } from '../lib/activity';
import { quickSearches } from '../lib/search';
import { taxonomies } from '../data/taxonomies';
import { useStoreVersion } from '../state/store';

export function HomePage() {
  const { t } = useI18n();
  const user = useCurrentUser();
  useStoreVersion();
  const { data } = useHomeData();

  useSeo({
    title: t('home.hero.title'),
    description: t('home.hero.subtitle'),
    path: ''
  });

  /* Formations commencées mais pas terminées — c'est là que le membre
     reprend. Les formations achevées n'ont plus rien à offrir ici. */
  const continuing: ContinueEntry[] = user
    ? myCourses()
        .filter((entry) => entry.status === 'inProgress')
        .map((entry) => ({
          item: {
            ...(entry.course as unknown as Record<string, unknown>),
            id: String(entry.course.id),
            slug: String(entry.course.slug),
            section: 'courses'
          },
          percent: entry.progress.percent
        }))
    : [];

  return (
    <div className="lp">
      <Hero banners={data.banners} />

      <ContinueLearning entries={continuing} />

      <div className="lp-tint lp-tint-white">
        <LearningPaths shelves={data.shelves} />
      </div>

      <CareerPanel shelves={data.career} />

      <ShelfGroups shelves={data.shelves} title={t('showcase.newAndPopular')} />

      <SearchPromo />

      <div className="lp-tint lp-tint-blue">
        <PartnerStrip partners={data.partners} />
      </div>

      <ActionTiles />

      <Counters stats={data.stats} />

      <div className="lp-tint lp-tint-cream">
        <CategoryPills specialties={[...taxonomies.specialties]} />
        <TrendingSearches queries={quickSearches()} />
      </div>

      <section className="lp-wrap">
        <MedicalNotice />
      </section>

      {/* La bande ferme la page, collée au pied : c'est la dernière chose
          que lit un visiteur sans compte. */}
      {!user ? <JoinBand /> : null}
    </div>
  );
}

/* ---------------------------------------------------------- appel -- */

/**
 * Bande d'inscription.
 *
 * Le champ n'envoie rien : il transmet l'adresse au formulaire
 * d'inscription, qui la pré-remplit. Un champ qui avale une adresse sans
 * rien en faire serait un mensonge poli ; celui-ci fait gagner la seule
 * frappe qu'il demande.
 *
 * La colonne de droite liste ce que le compte ouvre — les mêmes trois
 * lignes que la page d'inscription. Une illustration décorative y aurait
 * occupé la même place sans rien apprendre.
 */
function JoinBand() {
  const { t, href } = useI18n();
  const navigate = useNavigate();

  const benefits = [
    t('auth.register.benefit1'),
    t('auth.register.benefit2'),
    t('auth.register.benefit3')
  ];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    const value = String(email ?? '').trim();
    navigate(value ? `${href('inscription')}?email=${encodeURIComponent(value)}` : href('inscription'));
  };

  return (
    <section className="lp-wrap">
      <div className="lp-join">
        <div className="lp-join-main">
          <p className="lp-join-eyebrow">{t('home.cta.note')}</p>
          <h2 className="lp-join-title">{t('home.cta.title')}</h2>
          <p className="lp-join-text">{t('home.cta.desc')}</p>

          <form className="lp-join-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="join-email">
              {t('auth.register.email')}
            </label>
            <input
              id="join-email"
              name="email"
              type="email"
              className="lp-join-input"
              placeholder={t('home.cta.emailPlaceholder')}
              autoComplete="email"
            />
            <button type="submit" className="lp-join-send">
              {t('home.cta.button')}
              <Icon name="arrowRight" size={17} className="icon-flip" />
            </button>
          </form>

          <p className="lp-join-alt">
            <Link to={href('connexion')}>{t('home.cta.secondary')}</Link>
          </p>
        </div>

        <ul className="lp-join-list">
          {benefits.map((benefit) => (
            <li key={benefit}>
              <span className="lp-join-check" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* Deux disques très pâles, posés hors cadre : ils donnent du
            relief à l'aplat sans rien ajouter à lire. */}
        <span className="lp-join-orb lp-join-orb-1" aria-hidden="true" />
        <span className="lp-join-orb lp-join-orb-2" aria-hidden="true" />
      </div>
    </section>
  );
}
