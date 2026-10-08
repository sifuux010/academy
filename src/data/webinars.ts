import type { Webinar } from '../types';

/* =====================================================================
   Webinaires — sessions en direct et replays
   ---------------------------------------------------------------------
   Les dates sont exprimées en décalage (en heures) par rapport à
   l'instant de chargement : la démonstration présente donc toujours des
   sessions à venir, une session en direct et des replays. En production,
   `starts_at` est une vraie colonne timestamptz.
   ===================================================================== */

const HOUR = 3600000;

function at(hoursFromNow: number): string {
    return new Date(Date.now() + hoursFromNow * HOUR).toISOString();
  }

export const webinars: Webinar[] = [
    {
      id: 'web-01',
      slug: 'tendinopathies-gestion-de-la-charge-en-pratique',
      title: 'Tendinopathies : gestion de la charge en pratique',
      subtitle: 'Cas cliniques commentés et réponses aux questions',
      description: 'Session pratique consacrée à la construction d’une progression de charge dans les tendinopathies patellaire et achilléenne, à partir de trois cas cliniques.',
      speakerId: 'aut-07',
      startsAt: at(0.4),
      durationMinutes: 75,
      liveUrl: 'https://live.kinedokdz.com/tendinopathies-charge',
      replayUrl: '',
      registeredCount: 218,
      access: 'free',
      region: 'global',
      specialty: 'sport',
      pathologies: ['tendinopathie-patellaire', 'tendinopathie-achilleenne'],
      tags: ['tendinopathie', 'charge', 'sport'],
      agenda: [
        'Rappels : réponse du tendon à la charge (10 min)',
        'Cas 1 — volleyeur, tendinopathie patellaire en saison (20 min)',
        'Cas 2 — coureuse, tendinopathie achilléenne insertionnelle (20 min)',
        'Cas 3 — patient sédentaire, douleur chronique (15 min)',
        'Questions des participants (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-02',
      slug: 'retour-au-sport-apres-lca-decider-avec-des-criteres',
      title: 'Retour au sport après LCA : décider avec des critères',
      subtitle: 'Batterie de tests et pièges à éviter',
      description: 'Comment construire et interpréter une batterie de tests de retour au sport après reconstruction du LCA, en cabinet comme en club.',
      speakerId: 'aut-02',
      startsAt: at(96),
      durationMinutes: 90,
      liveUrl: 'https://live.kinedokdz.com/lca-retour-au-sport',
      replayUrl: '',
      registeredCount: 341,
      access: 'free',
      region: 'genou',
      specialty: 'sport',
      pathologies: ['reconstruction-lca'],
      tags: ['LCA', 'retour au sport', 'tests'],
      agenda: [
        'Pourquoi les délais seuls ne suffisent pas (15 min)',
        'Tests de force réalisables sans isocinétisme (25 min)',
        'Hop tests et analyse vidéo du saut (25 min)',
        'Décision partagée et facteurs psychologiques (15 min)',
        'Questions (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-03',
      slug: 'lombalgie-chronique-quand-le-patient-a-peur-de-bouger',
      title: 'Lombalgie chronique : quand le patient a peur de bouger',
      subtitle: 'Kinésiophobie, éducation et exposition graduée',
      description: 'Repérer la kinésiophobie, choisir les messages d’éducation adaptés et construire une exposition graduée au mouvement.',
      speakerId: 'aut-01',
      startsAt: at(240),
      durationMinutes: 60,
      liveUrl: 'https://live.kinedokdz.com/lombalgie-kinesiophobie',
      replayUrl: '',
      registeredCount: 176,
      access: 'free',
      region: 'rachis',
      specialty: 'musculosquelettique',
      pathologies: ['lombalgie-commune'],
      tags: ['lombalgie', 'douleur', 'éducation'],
      agenda: [
        'Repérer la kinésiophobie en consultation (15 min)',
        'Échelle de Tampa : usage et limites (10 min)',
        'Construire une exposition graduée (25 min)',
        'Questions (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-04',
      slug: 'prevention-des-chutes-programmes-qui-fonctionnent',
      title: 'Prévention des chutes : les programmes qui fonctionnent',
      subtitle: 'Dosage, contenu et adhérence chez la personne âgée',
      description: 'Quels contenus d’exercices, à quelle dose, pour réduire réellement le risque de chute ? Session appuyée sur les revues systématiques récentes.',
      speakerId: 'aut-08',
      startsAt: at(408),
      durationMinutes: 60,
      liveUrl: 'https://live.kinedokdz.com/prevention-chutes',
      replayUrl: '',
      registeredCount: 129,
      access: 'free',
      region: 'global',
      specialty: 'geriatrie',
      pathologies: [],
      tags: ['gériatrie', 'chutes', 'équilibre'],
      agenda: [
        'Facteurs de risque et dépistage rapide (12 min)',
        'Dose efficace : ce que disent les données (18 min)',
        'Progression de la difficulté d’équilibre (20 min)',
        'Questions (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-05',
      slug: 'epaule-de-l-hemiplegique-prevenir-et-traiter',
      title: 'Épaule de l’hémiplégique : prévenir et traiter',
      subtitle: 'Positionnement, manutention et rééducation',
      description: 'Session consacrée à la prévention et à la prise en charge de l’épaule douloureuse après AVC, du positionnement au travail actif.',
      speakerId: 'aut-03',
      startsAt: at(-72),
      durationMinutes: 65,
      liveUrl: '',
      replayUrl: 'https://replay.kinedokdz.com/epaule-hemiplegique',
      registeredCount: 264,
      access: 'free',
      region: 'epaule',
      specialty: 'neurologie',
      pathologies: ['avc-hemiplegie'],
      tags: ['AVC', 'épaule', 'neurologie'],
      agenda: [
        'Mécanismes de la douleur d’épaule après AVC (15 min)',
        'Positionnement et manutention sécuritaire (20 min)',
        'Rééducation active et récupération fonctionnelle (20 min)',
        'Questions (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-06',
      slug: 'lire-un-article-scientifique-en-20-minutes',
      title: 'Lire un article scientifique en 20 minutes',
      subtitle: 'Atelier de lecture critique pour la pratique',
      description: 'Atelier pratique : lire, évaluer et décider quoi faire d’un essai contrôlé randomisé en kinésithérapie, sur un exemple commenté en direct.',
      speakerId: 'aut-07',
      startsAt: at(-360),
      durationMinutes: 70,
      liveUrl: '',
      replayUrl: 'https://replay.kinedokdz.com/lecture-critique',
      registeredCount: 412,
      access: 'free',
      region: 'global',
      specialty: 'musculosquelettique',
      pathologies: [],
      tags: ['méthodologie', 'evidence-based practice'],
      agenda: [
        'La grille en dix questions (15 min)',
        'Application à un essai récent (30 min)',
        'Traduire le résultat en décision clinique (15 min)',
        'Questions (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-07',
      slug: 'developpement-moteur-de-l-enfant-reperer-tot',
      title: 'Développement moteur de l’enfant : repérer tôt',
      subtitle: 'Signaux d’alerte et conduite à tenir',
      description: 'Repérage des retards du développement moteur, examen adapté au nourrisson et orientation pluridisciplinaire.',
      speakerId: 'aut-06',
      startsAt: at(-1080),
      durationMinutes: 60,
      liveUrl: '',
      replayUrl: 'https://replay.kinedokdz.com/developpement-moteur',
      registeredCount: 198,
      access: 'free',
      region: 'global',
      specialty: 'pediatrie',
      pathologies: [],
      tags: ['pédiatrie', 'dépistage', 'développement moteur'],
      agenda: [
        'Repères normaux de 0 à 24 mois (20 min)',
        'Signaux d’alerte et examen du nourrisson (25 min)',
        'Orientation et accompagnement des parents (15 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-08',
      slug: 'coxarthrose-et-prothese-de-hanche',
      title: 'Coxarthrose et prothèse de hanche : de l’exercice à la récupération',
      subtitle: 'Préparer, opérer, rééduquer',
      description: 'Comment construire un programme d’exercices dans la coxarthrose, préparer une arthroplastie et conduire la rééducation post-opératoire selon la voie d’abord.',
      speakerId: 'aut-12',
      startsAt: at(336),
      durationMinutes: 75,
      liveUrl: 'https://live.kinedokdz.com/coxarthrose-pth',
      replayUrl: '',
      registeredCount: 152,
      access: 'free',
      region: 'hanche',
      specialty: 'rhumatologie',
      pathologies: ['coxarthrose', 'prothese-totale-hanche'],
      tags: ['coxarthrose', 'prothèse', 'hanche'],
      agenda: [
        'Exercice dans la coxarthrose : quelles doses, quels effets (20 min)',
        'Préparation pré-opératoire : ce qui change la récupération (15 min)',
        'Post-opératoire : précautions par voie d’abord, erreurs fréquentes (25 min)',
        'Questions des participants (15 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-09',
      slug: 'perinee-et-sport-incontinence-de-la-sportive',
      title: 'Périnée et sport : l’incontinence de la sportive',
      subtitle: 'Dépister, rééduquer, faire reprendre l’activité',
      description: 'Sujet fréquent et peu déclaré : comment aborder l’incontinence d’effort chez la femme sportive, de l’entretien initial au retour aux impacts.',
      speakerId: 'aut-10',
      startsAt: at(504),
      durationMinutes: 60,
      liveUrl: 'https://live.kinedokdz.com/perinee-sport',
      replayUrl: '',
      registeredCount: 187,
      access: 'free',
      region: 'global',
      specialty: 'perineologie',
      pathologies: ['incontinence-urinaire-effort'],
      tags: ['périnée', 'sport', 'incontinence', 'santé de la femme'],
      agenda: [
        'Prévalence et sous-déclaration : comment ouvrir le sujet (12 min)',
        'Évaluation : commande, endurance, verrouillage à l’effort (18 min)',
        'Progression jusqu’aux activités à impact (20 min)',
        'Questions (10 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-10',
      slug: 'canal-carpien-quand-la-reeducation-suffit',
      title: 'Canal carpien : quand la rééducation suffit-elle ?',
      subtitle: 'Attelle, neurodynamique et critères d’orientation',
      description: 'Session pratique sur le traitement conservateur du syndrome du canal carpien et les signes qui imposent un avis chirurgical.',
      speakerId: 'aut-11',
      startsAt: at(-600),
      durationMinutes: 65,
      liveUrl: '',
      replayUrl: 'https://replay.kinedokdz.com/canal-carpien',
      registeredCount: 224,
      access: 'free',
      region: 'poignet',
      specialty: 'musculosquelettique',
      pathologies: ['syndrome-canal-carpien'],
      tags: ['canal carpien', 'main', 'neurodynamique'],
      agenda: [
        'Reconnaître les formes légères, modérées et sévères (15 min)',
        'Attelle nocturne : mise en place et suivi (15 min)',
        'Techniques neurodynamiques en pratique (20 min)',
        'Quand orienter vers la chirurgie (15 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    },
    {
      id: 'web-11',
      slug: 'sclerose-en-plaques-bouger-sans-crainte',
      title: 'Sclérose en plaques : bouger sans crainte',
      subtitle: 'Fatigue, chaleur et progression de la charge',
      description: 'Comment prescrire l’activité physique dans la sclérose en plaques, gérer la fatigue et la sensibilité à la chaleur, et lever les craintes des patients.',
      speakerId: 'aut-03',
      startsAt: at(-240),
      durationMinutes: 70,
      liveUrl: '',
      replayUrl: 'https://replay.kinedokdz.com/sep-activite-physique',
      registeredCount: 168,
      access: 'free',
      region: 'global',
      specialty: 'neurologie',
      pathologies: ['sclerose-en-plaques'],
      tags: ['sclérose en plaques', 'fatigue', 'activité physique'],
      agenda: [
        'Ce que dit la littérature : l’exercice ne déclenche pas de poussée (15 min)',
        'Évaluer la fatigue et la marche : FSS, T25FW (15 min)',
        'Construire et adapter le programme (25 min)',
        'Questions (15 min)'
      ],
      certificate: true,
      published: true,
      seed: true
    }
  ];
