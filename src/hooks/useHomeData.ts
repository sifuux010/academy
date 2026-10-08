/* =====================================================================
   Données de la page d'accueil
   ---------------------------------------------------------------------
   Une seule requête (`/api/promotions/home/`) apporte bannières, rayons,
   parcours, partenaires et compteurs.

   Repli local : tant que l'API n'est pas lancée — ou si elle tombe — la
   page se compose à partir du jeu de contenus embarqué. L'accueil reste
   donc utilisable hors ligne, et la bascule vers le back-end ne casse
   aucun écran.
   ===================================================================== */
import { useEffect, useMemo, useState } from 'react';
import { get } from '../lib/api';
import { list, published, stats as localStats } from '../lib/content';
import type { AnyItem } from '../types';

export type HomeTheme = 'brand' | 'dark' | 'sand' | 'mint' | 'slate';

export interface HomePartner {
  slug: string;
  name: string;
  kind?: string;
  logoUrl?: string;
  url?: string;
}

export interface HomeBanner {
  id: string;
  theme: HomeTheme;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
  partner?: HomePartner | null;
}

export interface HomeShelfItem extends Record<string, unknown> {
  id: string;
  slug: string;
  section: string;
}

export interface HomeShelf {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  section: string;
  items: HomeShelfItem[];
}

export interface HomeSponsored {
  id: string;
  section: string;
  label: string;
  note: string;
  partner?: HomePartner | null;
  item: HomeShelfItem;
}

export interface HomeData {
  banners: HomeBanner[];
  shelves: HomeShelf[];
  career: HomeShelf[];
  sponsored: HomeSponsored[];
  partners: HomePartner[];
  stats: Record<string, number>;
  /** Vrai quand les données viennent du jeu embarqué, pas de l'API. */
  offline: boolean;
}

/* --------------------------------------------------- repli local -- */

function localShelf(
  key: string,
  title: string,
  subtitle: string,
  section: string,
  sort: 'popular' | 'newest',
  ctaLabel: string,
  ctaHref: string,
  limit = 6
): HomeShelf {
  const result = list(section as never, { sort, perPage: limit });
  return {
    id: `local-${key}`,
    key,
    title,
    subtitle,
    ctaLabel,
    ctaHref,
    section,
    items: (result.items as AnyItem[]).map((item) => ({
      ...(item as unknown as Record<string, unknown>),
      id: String(item.id),
      slug: String(item.slug),
      section
    }))
  };
}

/**
 * Accueil composé depuis le jeu embarqué.
 *
 * Les bannières y sont fixes : ce sont les mêmes que celles installées par
 * `seed_promotions`, pour que le repli ressemble à la version servie.
 */
function buildLocalHome(): HomeData {
  const specialties = ['musculosquelettique', 'sport', 'neurologie', 'cardioresp', 'geriatrie'];
  const labels: Record<string, string> = {
    musculosquelettique: 'Musculosquelettique',
    sport: 'Sport',
    neurologie: 'Neurologie',
    cardioresp: 'Cardio-respiratoire',
    geriatrie: 'Gériatrie'
  };

  const career = specialties
    .map((key) => {
      const result = list('courses', { filters: { specialty: [key] }, sort: 'popular', perPage: 4 });
      if (!result.items.length) return null;
      return {
        id: `local-career-${key}`,
        key,
        title: labels[key] ?? key,
        subtitle: 'Formations, protocoles et bilans de la spécialité.',
        ctaLabel: 'Voir la spécialité',
        ctaHref: `/formations?specialty=${key}`,
        section: 'courses',
        items: result.items.map((item) => ({
          ...(item as unknown as Record<string, unknown>),
          id: String(item.id),
          slug: String(item.slug),
          section: 'courses'
        }))
      } as HomeShelf;
    })
    .filter((shelf): shelf is HomeShelf => shelf !== null);

  const counts = localStats();

  return {
    offline: true,
    banners: [
      {
        id: 'local-1',
        imageUrl: '/hero/hero1.webp',
        theme: 'dark',
        eyebrow: 'Bibliothèque scientifique',
        title: 'Des protocoles fondés sur les preuves',
        body: `${published('resources').length} ressources relues — protocoles, revues de littérature et recommandations, avec leurs références.`,
        ctaLabel: 'Explorer la bibliothèque',
        ctaHref: '/bibliotheque'
      },
      {
        id: 'local-2',
        imageUrl: '/hero/hero2.webp',
        theme: 'sand',
        eyebrow: 'Outils cliniques',
        title: `${published('tools').length} tests, scores et bilans, prêts à imprimer`,
        body: 'Cotation, interprétation et qualités métrologiques pour chaque fiche. Un kit de bilan par pathologie.',
        ctaLabel: 'Ouvrir les outils',
        ctaHref: '/outils'
      },
      {
        id: 'local-3',
        imageUrl: '/hero/hero3.webp',
        theme: 'brand',
        eyebrow: 'Formations',
        title: 'Progressez à votre rythme, certificat à la clé',
        body: 'Formations en modules et leçons, quiz corrigés et certificat de réussite.',
        ctaLabel: 'Voir les formations',
        ctaHref: '/formations'
      }
    ],
    shelves: [
      localShelf('populaires', 'Les plus consultés', 'Ce que lisent vos confrères en ce moment.', 'resources', 'popular', 'Toute la bibliothèque', '/bibliotheque'),
      localShelf('nouveautes', 'Nouveautés', 'Les dernières ressources mises en ligne.', 'resources', 'newest', 'Trier par date', '/bibliotheque?sort=newest'),
      localShelf('formations-suivies', 'Formations les plus suivies', 'Modules, quiz et certificat de réussite.', 'courses', 'popular', 'Toutes les formations', '/formations'),
      localShelf('webinaires', 'Prochains webinaires', 'Sessions en direct et replays.', 'webinars', 'newest', 'Tous les webinaires', '/webinaires')
    ],
    career,
    sponsored: [],
    partners: [],
    stats: {
      resources: counts.resources ?? 0,
      courses: counts.courses ?? 0,
      webinars: counts.webinars ?? 0,
      tools: counts.tools ?? 0,
      exercises: counts.exercises ?? 0,
      pathologies: counts.pathologies ?? 0
    }
  };
}

/* ------------------------------------------------------- le hook -- */

export function useHomeData(): { data: HomeData; loading: boolean } {
  const fallback = useMemo(buildLocalHome, []);
  const [data, setData] = useState<HomeData>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    get<Omit<HomeData, 'offline'>>('/promotions/home/', undefined, controller.signal)
      .then((payload) => {
        if (!alive) return;
        // Une réponse sans bannière ni rayon signifie que rien n'a encore
        // été configuré : le repli local reste plus parlant qu'une page nue.
        const empty = !payload.banners?.length && !payload.shelves?.length;
        if (!empty) setData({ ...payload, offline: false });
      })
      .catch(() => {
        /* API absente : on garde le repli local, sans message d'erreur —
           le visiteur n'a pas à savoir que le serveur ne répond pas. */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return { data, loading };
}
