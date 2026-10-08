import type { Course } from '../types';

/* =====================================================================
   Formations en ligne — structure Course > Module > Lesson (+ Quiz)
   ---------------------------------------------------------------------
   Les leçons de type `text` contiennent leur contenu ici (démonstration).
   En production : tables courses / course_modules / lessons / quizzes /
   questions / quiz_answers, les vidéos et PDF étant servis depuis le
   stockage sécurisé — cf. docs/DATABASE.md.
   ===================================================================== */

export const courses: Course[] = [
  {
    id: 'cou-01',
    slug: 'rehabilitation-du-genou-apres-lca',
    title: 'Rééducation du genou après reconstruction du LCA',
    subtitle: 'De la phase post-opératoire immédiate au retour au sport',
    i18n: { en: { title: 'Knee rehabilitation after ACL reconstruction' } },
    description: 'Formation complète et opérationnelle sur la rééducation du LCA : progression par critères, dosage du renforcement, réathlétisation et décision de retour au sport.',
    instructorId: 'aut-02',
    level: 'avance',
    language: 'fr',
    durationMinutes: 320,
    access: 'free',
    rating: 4.8,
    ratingCount: 126,
    enrolledCount: 842,
    region: 'genou',
    specialty: 'sport',
    pathologies: ['reconstruction-lca'],
    tags: ['LCA', 'genou', 'retour au sport', 'réathlétisation'],
    objectives: [
      'Construire une progression post-opératoire pilotée par critères objectifs.',
      'Doser le renforcement du quadriceps et des ischio-jambiers selon la phase.',
      'Mettre en place une batterie de tests de retour au sport.',
      'Identifier les facteurs de risque de nouvelle lésion.'
    ],
    audience: 'Kinésithérapeutes exerçant auprès de patients sportifs, étudiants en dernière année.',
    prerequisites: ['Bases de l’examen clinique du genou', 'Notions de renforcement musculaire progressif'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-01-1',
        title: 'Comprendre la lésion et la chirurgie',
        lessons: [
          { id: 'les-01-1-1', title: 'Anatomie fonctionnelle et mécanismes lésionnels', type: 'video', duration: 18 },
          { id: 'les-01-1-2', title: 'Techniques chirurgicales et conséquences pour la rééducation', type: 'video', duration: 22 },
          {
            id: 'les-01-1-3', title: 'Cicatrisation du greffon : ce que cela impose', type: 'text', duration: 12,
            content: 'La ligamentisation du greffon s’étale sur plusieurs mois : phase de nécrose et de revascularisation initiale, puis remodelage progressif. Cette temporalité biologique explique pourquoi la progression mécanique doit rester graduelle même lorsque la douleur et l’épanchement ont disparu.\n\nEn pratique, trois conséquences : les contraintes en cisaillement antérieur sont limitées dans les premières semaines, la charge doit augmenter par paliers mesurables, et l’absence de douleur ne suffit jamais à autoriser un saut de phase.'
          }
        ]
      },
      {
        id: 'mod-01-2',
        title: 'Phase précoce : contrôle et récupération',
        lessons: [
          { id: 'les-01-2-1', title: 'Gestion de l’épanchement et de la douleur', type: 'video', duration: 16 },
          { id: 'les-01-2-2', title: 'Récupérer l’extension complète', type: 'video', duration: 20 },
          { id: 'les-01-2-3', title: 'Lever la sidération du quadriceps', type: 'video', duration: 24 },
          { id: 'les-01-2-4', title: 'Protocole détaillé phase 1 (PDF)', type: 'pdf', duration: 10, resourceSlug: 'protocole-lca-retour-au-sport-par-criteres' }
        ]
      },
      {
        id: 'mod-01-3',
        title: 'Renforcement et réathlétisation',
        lessons: [
          { id: 'les-01-3-1', title: 'Progression du renforcement : chaîne fermée et ouverte', type: 'video', duration: 28 },
          { id: 'les-01-3-2', title: 'Introduire la pliométrie sans risque', type: 'video', duration: 26 },
          { id: 'les-01-3-3', title: 'Changements de direction et gestes spécifiques', type: 'video', duration: 24 },
          {
            id: 'les-01-3-4', title: 'Quiz — renforcement et progression', type: 'quiz', duration: 8,
            quiz: {
              passScore: 3,
              questions: [
                {
                  q: 'Quel déficit de force du quadriceps est associé à une augmentation du risque de nouvelle lésion ?',
                  options: ['Plus de 10 % par rapport au côté sain', 'Plus de 25 %', 'Plus de 40 %', 'Le déficit de force n’a pas d’influence'],
                  answer: 0
                },
                {
                  q: 'Sur quoi doit reposer la décision de retour au sport ?',
                  options: ['Le délai post-opératoire seul', 'La demande du patient', 'Une batterie de tests associée au délai et à la qualité du mouvement', 'L’imagerie de contrôle'],
                  answer: 2
                },
                {
                  q: 'Quel élément justifie de retarder l’introduction de la pliométrie ?',
                  options: ['Un épanchement persistant', 'Une cicatrice esthétiquement imparfaite', 'Une flexion à 130°', 'Un patient motivé'],
                  answer: 0
                },
                {
                  q: 'Quel objectif est prioritaire dans les deux premières semaines ?',
                  options: ['Le renforcement maximal', 'La récupération de l’extension complète et le contrôle de l’épanchement', 'Le travail de vitesse', 'La reprise de la course'],
                  answer: 1
                }
              ]
            }
          }
        ]
      },
      {
        id: 'mod-01-4',
        title: 'Décider du retour au sport',
        lessons: [
          { id: 'les-01-4-1', title: 'Batterie de tests : force, hop tests, qualité du mouvement', type: 'video', duration: 30 },
          { id: 'les-01-4-2', title: 'Dimension psychologique et ACL-RSI', type: 'video', duration: 18 },
          {
            id: 'les-01-4-3', title: 'Construire son tableau de décision', type: 'text', duration: 14,
            content: 'Un tableau de décision réunit quatre familles de critères : force (isométrique ou isocinétique, symétrie > 90 %), performance fonctionnelle (hop tests, symétrie > 90 %), qualité du mouvement (analyse vidéo d’un saut bipodal puis unipodal) et facteurs psychologiques (ACL-RSI).\n\nAucun critère isolé n’autorise le retour au sport. Le tableau se remplit à intervalles fixes — typiquement 4, 6, 9 mois — afin de rendre la progression visible pour le patient comme pour l’équipe.'
          }
        ]
      }
    ]
  },

  {
    id: 'cou-02',
    slug: 'lombalgie-commune-de-l-evaluation-a-l-exercice',
    title: 'Lombalgie commune : de l’évaluation à l’exercice',
    subtitle: 'Triage, éducation et programmation des exercices',
    description: 'Formation pratique pour structurer la prise en charge de la lombalgie commune : triage des drapeaux rouges, repérage des facteurs psychosociaux, éducation et programmation des exercices.',
    instructorId: 'aut-01',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 240,
    access: 'free',
    rating: 4.7,
    ratingCount: 214,
    enrolledCount: 1560,
    region: 'rachis',
    specialty: 'musculosquelettique',
    pathologies: ['lombalgie-commune'],
    tags: ['lombalgie', 'éducation', 'exercice thérapeutique'],
    objectives: [
      'Réaliser un triage fiable des drapeaux rouges.',
      'Repérer les facteurs psychosociaux avec des outils validés.',
      'Délivrer des messages d’éducation clairs et cohérents.',
      'Programmer et progresser un plan d’exercices individualisé.'
    ],
    audience: 'Kinésithérapeutes en cabinet, étudiants à partir de la 3e année.',
    prerequisites: ['Examen clinique du rachis lombaire'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-02-1',
        title: 'Évaluer et trier',
        lessons: [
          { id: 'les-02-1-1', title: 'Drapeaux rouges : que faut-il vraiment rechercher ?', type: 'video', duration: 22 },
          { id: 'les-02-1-2', title: 'Examen physique utile et examen inutile', type: 'video', duration: 26 },
          { id: 'les-02-1-3', title: 'STarT Back : graduer l’intensité de la prise en charge', type: 'pdf', duration: 12, toolSlug: 'start-back-screening-tool' }
        ]
      },
      {
        id: 'mod-02-2',
        title: 'Éduquer et rassurer',
        lessons: [
          { id: 'les-02-2-1', title: 'Les messages clés de l’éducation à la douleur', type: 'video', duration: 24 },
          {
            id: 'les-02-2-2', title: 'Répondre aux questions fréquentes du patient', type: 'text', duration: 16,
            content: '« Est-ce que mon dos est abîmé ? » — Expliquer que la douleur lombaire commune n’équivaut pas à une lésion structurelle et que l’imagerie retrouve des anomalies chez de nombreuses personnes asymptomatiques.\n\n« Dois-je me reposer ? » — Le repos prolongé retarde la récupération. L’objectif est de maintenir une activité tolérable et de l’augmenter progressivement.\n\n« Puis-je porter des charges ? » — Oui, en reprenant progressivement, en variant les postures et en renforçant la capacité plutôt qu’en évitant durablement le geste.'
          },
          { id: 'les-02-2-3', title: 'Quiz — éducation et messages clés', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quelle attitude est recommandée devant une lombalgie commune sans drapeau rouge ?',
                  options: ['Repos au lit de 3 jours', 'Imagerie systématique', 'Maintien d’une activité tolérable et réassurance', 'Immobilisation par ceinture pendant 6 semaines'],
                  answer: 2
                },
                {
                  q: 'À quoi sert le questionnaire STarT Back ?',
                  options: ['À poser un diagnostic structurel', 'À graduer l’intensité de la prise en charge selon le risque de chronicisation', 'À mesurer la force lombaire', 'À évaluer l’amplitude articulaire'],
                  answer: 1
                },
                {
                  q: 'Une imagerie est indiquée en priorité si :',
                  options: ['La douleur dure plus de 3 jours', 'Le patient le demande', 'Il existe un déficit neurologique progressif', 'La douleur est intense'],
                  answer: 2
                }
              ]
            }
          }
        ]
      },
      {
        id: 'mod-02-3',
        title: 'Programmer les exercices',
        lessons: [
          { id: 'les-02-3-1', title: 'Choisir le point d’entrée : contrôle, force ou endurance', type: 'video', duration: 28 },
          { id: 'les-02-3-2', title: 'Progresser sans réveiller la douleur', type: 'video', duration: 22 },
          { id: 'les-02-3-3', title: 'Protocole 12 semaines (PDF)', type: 'pdf', duration: 14, resourceSlug: 'lombalgie-commune-prise-en-charge-active' },
          { id: 'les-02-3-4', title: 'Maintenir l’adhérence à long terme', type: 'video', duration: 20 }
        ]
      }
    ]
  },

  {
    id: 'cou-03',
    slug: 'epaule-douloureuse-masterclass-clinique',
    title: 'Épaule douloureuse : masterclass clinique',
    subtitle: 'Raisonnement, tests et exercices progressifs',
    description: 'Masterclass consacrée à l’épaule douloureuse non traumatique : démarche de raisonnement, valeur réelle des tests, construction d’un programme d’exercices progressifs.',
    instructorId: 'aut-04',
    level: 'avance',
    language: 'fr',
    durationMinutes: 275,
    access: 'premium',
    rating: 4.9,
    ratingCount: 88,
    enrolledCount: 476,
    region: 'epaule',
    specialty: 'musculosquelettique',
    pathologies: ['tendinopathie-coiffe-rotateurs', 'capsulite-retractile'],
    tags: ['épaule', 'thérapie manuelle', 'coiffe des rotateurs'],
    objectives: [
      'Structurer un raisonnement clinique face à une épaule douloureuse.',
      'Interpréter les tests orthopédiques à leur juste valeur.',
      'Différencier tendinopathie de coiffe et capsulite rétractile.',
      'Construire une progression d’exercices en charge.'
    ],
    audience: 'Kinésithérapeutes musculo-squelettiques, formateurs, étudiants avancés.',
    prerequisites: ['Anatomie de la ceinture scapulaire', 'Bases de thérapie manuelle'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-03-1',
        title: 'Raisonnement et triage',
        lessons: [
          { id: 'les-03-1-1', title: 'Six étapes de raisonnement clinique', type: 'video', duration: 26 },
          { id: 'les-03-1-2', title: 'Ce que disent — et ne disent pas — les tests', type: 'video', duration: 30 },
          { id: 'les-03-1-3', title: 'Article de référence (PDF)', type: 'pdf', duration: 12, resourceSlug: 'epaule-douloureuse-non-traumatique-raisonnement' }
        ]
      },
      {
        id: 'mod-03-2',
        title: 'Tendinopathie de la coiffe',
        lessons: [
          { id: 'les-03-2-1', title: 'Évaluation de la fonction et de la charge tolérée', type: 'video', duration: 24 },
          { id: 'les-03-2-2', title: 'Programme progressif en 12 semaines', type: 'video', duration: 32 },
          { id: 'les-03-2-3', title: 'Quiz — coiffe des rotateurs', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quel traitement de première intention est recommandé dans la tendinopathie de coiffe ?',
                  options: ['Chirurgie précoce', 'Exercice thérapeutique progressif', 'Immobilisation en écharpe', 'Ultrasons isolés'],
                  answer: 1
                },
                {
                  q: 'Quel élément évoque une capsulite plutôt qu’une tendinopathie de coiffe ?',
                  options: ['Douleur à l’élévation active uniquement', 'Perte des amplitudes passives, surtout en rotation externe', 'Force conservée', 'Arc douloureux à 90°'],
                  answer: 1
                },
                {
                  q: 'Après combien de semaines une réévaluation structurée est-elle recommandée ?',
                  options: ['2 semaines', '6 et 12 semaines', '6 mois', 'Uniquement en cas d’échec'],
                  answer: 1
                }
              ]
            }
          }
        ]
      },
      {
        id: 'mod-03-3',
        title: 'Capsulite rétractile',
        lessons: [
          { id: 'les-03-3-1', title: 'Reconnaître les phases et adapter l’intensité', type: 'video', duration: 28 },
          { id: 'les-03-3-2', title: 'Mobilisations : dosage et sécurité', type: 'video', duration: 26 },
          { id: 'les-03-3-3', title: 'Protocole par phases (PDF)', type: 'pdf', duration: 10, resourceSlug: 'capsulite-retractile-protocole-par-phases' }
        ]
      }
    ]
  },

  {
    id: 'cou-04',
    slug: 'reeducation-neurologique-marche-apres-avc',
    title: 'Rééducation neurologique : récupérer la marche après un AVC',
    subtitle: 'Intensité, tâche et sécurité',
    description: 'Formation centrée sur la récupération de la marche après AVC : dosage de la pratique, travail orienté vers la tâche, prévention des complications.',
    instructorId: 'aut-03',
    level: 'avance',
    language: 'fr',
    durationMinutes: 300,
    access: 'free',
    rating: 4.8,
    ratingCount: 97,
    enrolledCount: 612,
    region: 'global',
    specialty: 'neurologie',
    pathologies: ['avc-hemiplegie'],
    tags: ['AVC', 'neurologie', 'marche', 'équilibre'],
    objectives: [
      'Évaluer l’équilibre et le risque de chute avec des échelles validées.',
      'Doser l’intensité et la densité de pratique en séance.',
      'Construire des situations orientées vers la tâche.',
      'Prévenir les complications de l’hémiplégie.'
    ],
    audience: 'Kinésithérapeutes en neurologie, centres de rééducation, étudiants avancés.',
    prerequisites: ['Bases de l’examen neurologique'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-04-1',
        title: 'Évaluer',
        lessons: [
          { id: 'les-04-1-1', title: 'Examen neurologique orienté vers la fonction', type: 'video', duration: 28 },
          { id: 'les-04-1-2', title: 'Échelle de Berg et Timed Up and Go en pratique', type: 'video', duration: 22 },
          { id: 'les-04-1-3', title: 'Manuel du bilan neurologique (extrait PDF)', type: 'pdf', duration: 16, resourceSlug: 'bilan-neurologique-adulte-manuel' }
        ]
      },
      {
        id: 'mod-04-2',
        title: 'Rééduquer la marche',
        lessons: [
          { id: 'les-04-2-1', title: 'Densité de pratique : comment l’augmenter réellement', type: 'video', duration: 30 },
          { id: 'les-04-2-2', title: 'Travail orienté vers la tâche : exemples de situations', type: 'video', duration: 32 },
          {
            id: 'les-04-2-3', title: 'Sécuriser la séance', type: 'text', duration: 12,
            content: 'Trois vérifications avant chaque séance : état général et constantes, absence de signes d’aggravation neurologique, et matériel de sécurité disponible (ceinture de marche, environnement dégagé).\n\nPendant la séance, la fatigue se surveille sur la qualité du mouvement plus que sur la durée : une dégradation du schéma de marche indique qu’il faut réduire la difficulté plutôt qu’insister.'
          }
        ]
      },
      {
        id: 'mod-04-3',
        title: 'Prévenir les complications',
        lessons: [
          { id: 'les-04-3-1', title: 'Épaule de l’hémiplégique', type: 'video', duration: 24 },
          { id: 'les-04-3-2', title: 'Spasticité : évaluer et composer avec', type: 'video', duration: 26 },
          { id: 'les-04-3-3', title: 'Éducation de l’entourage', type: 'video', duration: 20 }
        ]
      }
    ]
  },

  {
    id: 'cou-05',
    slug: 'rehabilitation-respiratoire-bpco',
    title: 'Réhabilitation respiratoire du patient BPCO',
    subtitle: 'Évaluer, réentraîner, éduquer',
    description: 'Formation pratique à la réhabilitation respiratoire ambulatoire : évaluation de la capacité d’effort, prescription du réentraînement, éducation thérapeutique.',
    instructorId: 'aut-05',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 210,
    access: 'free',
    rating: 4.6,
    ratingCount: 64,
    enrolledCount: 389,
    region: 'thorax',
    specialty: 'cardioresp',
    pathologies: ['bpco'],
    tags: ['BPCO', 'réentraînement', 'respiratoire'],
    objectives: [
      'Réaliser et interpréter un test de marche de 6 minutes.',
      'Prescrire une intensité d’effort individualisée.',
      'Adapter la séance en cas de désaturation.',
      'Structurer le volet éducatif du programme.'
    ],
    audience: 'Kinésithérapeutes respiratoires, kinésithérapeutes polyvalents, étudiants.',
    prerequisites: ['Physiologie respiratoire de base'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-05-1',
        title: 'Évaluer la capacité d’effort',
        lessons: [
          { id: 'les-05-1-1', title: 'Test de marche de 6 minutes : procédure standardisée', type: 'video', duration: 24 },
          { id: 'les-05-1-2', title: 'Échelles de dyspnée et de perception de l’effort', type: 'video', duration: 18 },
          { id: 'les-05-1-3', title: 'Fiche du test de marche (PDF)', type: 'pdf', duration: 8, toolSlug: 'test-marche-6-minutes' }
        ]
      },
      {
        id: 'mod-05-2',
        title: 'Réentraîner',
        lessons: [
          { id: 'les-05-2-1', title: 'Endurance : intensité, durée, progression', type: 'video', duration: 26 },
          { id: 'les-05-2-2', title: 'Renforcement des membres et transfert fonctionnel', type: 'video', duration: 22 },
          { id: 'les-05-2-3', title: 'Programme 8 semaines (PDF)', type: 'pdf', duration: 12, resourceSlug: 'bpco-rehabilitation-respiratoire-programme' }
        ]
      },
      {
        id: 'mod-05-3',
        title: 'Éduquer et suivre',
        lessons: [
          { id: 'les-05-3-1', title: 'Reconnaître et gérer une exacerbation', type: 'video', duration: 20 },
          { id: 'les-05-3-2', title: 'Maintenir l’activité physique après le programme', type: 'video', duration: 18 }
        ]
      }
    ]
  },

  {
    id: 'cou-06',
    slug: 'evaluation-clinique-tests-scores-essentiels',
    title: 'Évaluation clinique : tests, scores et bilans essentiels',
    subtitle: 'Choisir le bon outil et interpréter le résultat',
    i18n: { en: { title: 'Clinical assessment: essential tests, scores and outcome measures' } },
    description: 'Formation transversale sur les outils d’évaluation en kinésithérapie : critères de choix, réalisation standardisée, interprétation et suivi.',
    instructorId: 'aut-07',
    level: 'etudiant',
    language: 'fr',
    durationMinutes: 180,
    access: 'free',
    rating: 4.9,
    ratingCount: 302,
    enrolledCount: 2140,
    region: 'global',
    specialty: 'musculosquelettique',
    pathologies: [
      'lombalgie-commune', 'cervicalgie-commune', 'gonarthrose', 'tendinopathie-coiffe-rotateurs',
      'entorse-laterale-cheville', 'coxarthrose', 'syndrome-douloureux-femoro-patellaire', 'syndrome-canal-carpien',
      'lombosciatique-hernie-discale', 'sclerose-en-plaques', 'incontinence-urinaire-effort',
      'paralysie-cerebrale', 'fasciopathie-plantaire'
    ],
    tags: ['bilan', 'tests', 'scores', 'formation initiale'],
    objectives: [
      'Distinguer sensibilité, spécificité et valeur prédictive.',
      'Choisir un outil de mesure adapté à l’objectif clinique.',
      'Standardiser la réalisation pour rendre le suivi comparable.',
      'Interpréter une différence minimale cliniquement importante.'
    ],
    audience: 'Étudiants en kinésithérapie et professionnels souhaitant structurer leur bilan.',
    prerequisites: [],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-06-1',
        title: 'Les bases métrologiques',
        lessons: [
          {
            id: 'les-06-1-1', title: 'Sensibilité, spécificité, rapports de vraisemblance', type: 'text', duration: 14,
            content: 'Un test sensible, lorsqu’il est négatif, aide à écarter une hypothèse ; un test spécifique, lorsqu’il est positif, aide à la confirmer. En pratique clinique, aucun test isolé ne suffit : c’est le regroupement de plusieurs éléments concordants qui fait progresser le raisonnement.\n\nLes rapports de vraisemblance permettent de quantifier ce déplacement de probabilité. Un rapport positif supérieur à 5 ou négatif inférieur à 0,2 modifie utilement la décision ; entre ces valeurs, l’apport du test reste faible.'
          },
          { id: 'les-06-1-2', title: 'Fidélité, reproductibilité et erreur de mesure', type: 'video', duration: 20 },
          { id: 'les-06-1-3', title: 'Différence minimale cliniquement importante', type: 'video', duration: 18 }
        ]
      },
      {
        id: 'mod-06-2',
        title: 'Tests et scores par région',
        lessons: [
          { id: 'les-06-2-1', title: 'Genou : Lachman, Lysholm, KOOS', type: 'video', duration: 24 },
          { id: 'les-06-2-2', title: 'Épaule : SPADI et score de Constant', type: 'video', duration: 22 },
          { id: 'les-06-2-3', title: 'Rachis : EIFEL, Oswestry, STarT Back et NDI', type: 'video', duration: 22 },
          { id: 'les-06-2-4', title: 'Équilibre et fonction : Berg, TUG, 30 s assis-debout', type: 'video', duration: 20 }
        ]
      },
      {
        id: 'mod-06-3',
        title: 'Mettre en place un bilan reproductible',
        lessons: [
          { id: 'les-06-3-1', title: 'Construire sa trame de bilan', type: 'video', duration: 20 },
          {
            id: 'les-06-3-2', title: 'Quiz final', type: 'quiz', duration: 8,
            quiz: {
              passScore: 3,
              questions: [
                {
                  q: 'Un test très sensible est surtout utile lorsque :',
                  options: ['Il est positif, pour confirmer', 'Il est négatif, pour écarter', 'Il est douloureux', 'Il est rapide à réaliser'],
                  answer: 1
                },
                {
                  q: 'La différence minimale cliniquement importante correspond à :',
                  options: ['Le seuil de significativité statistique', 'La plus petite variation perçue comme utile par le patient', 'L’erreur de mesure de l’appareil', 'La moyenne des scores'],
                  answer: 1
                },
                {
                  q: 'Quel score suit la fonction du genou du point de vue du patient ?',
                  options: ['Échelle d’Ashworth', 'KOOS', 'Score de Constant', 'Échelle de Borg'],
                  answer: 1
                },
                {
                  q: 'Pourquoi standardiser la réalisation d’un test ?',
                  options: ['Pour gagner du temps', 'Pour rendre les mesures comparables dans le temps', 'Pour respecter la nomenclature', 'Pour éviter le matériel'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-07',
    slug: 'hanche-de-la-coxarthrose-a-la-prothese',
    title: 'Hanche : de la coxarthrose à la prothèse',
    subtitle: 'Exercice, préparation chirurgicale et rééducation post-opératoire',
    description: 'Parcours complet de la hanche dégénérative : évaluation, programme d’exercices de première intention, préparation à l’arthroplastie et rééducation post-opératoire selon la voie d’abord.',
    instructorId: 'aut-12',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 225,
    access: 'free',
    rating: 4.7,
    ratingCount: 58,
    enrolledCount: 314,
    region: 'hanche',
    specialty: 'rhumatologie',
    pathologies: ['coxarthrose', 'prothese-totale-hanche'],
    tags: ['coxarthrose', 'prothèse', 'hanche', 'post-opératoire'],
    objectives: [
      'Conduire un bilan de hanche structuré et reproductible.',
      'Construire un programme d’exercices de première intention dans la coxarthrose.',
      'Préparer un patient à l’arthroplastie et expliquer les enjeux de la préparation.',
      'Adapter la rééducation post-opératoire à la voie d’abord chirurgicale.'
    ],
    audience: 'Kinésithérapeutes en cabinet, en centre de rééducation ou en service d’orthopédie ; étudiants avancés.',
    prerequisites: ['Anatomie fonctionnelle de la hanche', 'Bases du renforcement progressif'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-07-1',
        title: 'Évaluer la hanche',
        lessons: [
          { id: 'les-07-1-1', title: 'Anamnèse et signaux d’alerte de la hanche douloureuse', type: 'video', duration: 22 },
          { id: 'les-07-1-2', title: 'Amplitudes, force et tests : ce qui change la décision', type: 'video', duration: 26 },
          { id: 'les-07-1-3', title: 'Trame de bilan hanche (PDF)', type: 'pdf', duration: 12, toolSlug: 'bilan-hanche' }
        ]
      },
      {
        id: 'mod-07-2',
        title: 'Traiter sans chirurgie',
        lessons: [
          { id: 'les-07-2-1', title: 'Programme d’exercices : dosage et progression', type: 'video', duration: 28 },
          { id: 'les-07-2-2', title: 'Éducation, gestion du poids et adaptation des activités', type: 'video', duration: 20 },
          { id: 'les-07-2-3', title: 'Programme 12 semaines (PDF)', type: 'pdf', duration: 14, resourceSlug: 'coxarthrose-programme-exercices-12-semaines' },
          {
            id: 'les-07-2-4', title: 'Quiz — coxarthrose', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quel traitement de première intention est recommandé dans la coxarthrose symptomatique ?',
                  options: ['Repos et antalgiques seuls', 'Exercice supervisé et éducation', 'Arthroplastie précoce', 'Immobilisation par attelle'],
                  answer: 1
                },
                {
                  q: 'Quelle limitation d’amplitude est la plus évocatrice d’une atteinte coxo-fémorale ?',
                  options: ['La rotation interne', 'L’extension du genou', 'La flexion dorsale de cheville', 'L’abduction d’épaule'],
                  answer: 0
                },
                {
                  q: 'Devant une douleur inguinale nocturne intense chez un sujet jeune sous corticoïdes, il faut évoquer :',
                  options: ['Une coxarthrose banale', 'Une ostéonécrose de la tête fémorale', 'Une tendinopathie des fessiers', 'Un simple surmenage'],
                  answer: 1
                }
              ]
            }
          }
        ]
      },
      {
        id: 'mod-07-3',
        title: 'Autour de l’arthroplastie',
        lessons: [
          { id: 'les-07-3-1', title: 'Préparation pré-opératoire : ce qui change la récupération', type: 'video', duration: 22 },
          { id: 'les-07-3-2', title: 'Post-opératoire immédiat et précautions par voie d’abord', type: 'video', duration: 30 },
          { id: 'les-07-3-3', title: 'Protocole post-opératoire (PDF)', type: 'pdf', duration: 14, resourceSlug: 'prothese-hanche-protocole-post-operatoire' },
          {
            id: 'les-07-3-4', title: 'Reprise des activités et signaux d’alerte', type: 'text', duration: 14,
            content: 'La reprise des activités s’échelonne généralement entre 6 et 12 semaines : marche prolongée, vélo et natation avant les activités à impact, ces dernières restant discutées avec le chirurgien.\n\nTrois situations imposent d’interrompre la séance et de solliciter un avis médical : une douleur brutale avec raccourcissement et rotation du membre (suspicion de luxation), un mollet douloureux avec œdème unilatéral (suspicion de thrombose veineuse profonde), une fièvre avec écoulement ou rougeur de la cicatrice (suspicion d’infection).'
          }
        ]
      }
    ]
  },

  {
    id: 'cou-08',
    slug: 'retour-au-sport-apres-blessure',
    title: 'Retour au sport après blessure : critères et batteries de tests',
    subtitle: 'Genou, cheville, ischio-jambiers et épaule',
    description: 'Formation transversale sur la décision de retour au sport : construire une batterie de tests, fixer des seuils, gérer la charge de reprise et réduire le risque de récidive.',
    instructorId: 'aut-02',
    level: 'avance',
    language: 'fr',
    durationMinutes: 260,
    access: 'free',
    rating: 4.8,
    ratingCount: 74,
    enrolledCount: 428,
    region: 'global',
    specialty: 'sport',
    pathologies: [
      'reconstruction-lca', 'lesion-ischio-jambiers', 'instabilite-glenohumerale',
      'entorse-laterale-cheville', 'tendinopathie-patellaire', 'lesion-meniscale',
      'syndrome-femoro-acetabulaire'
    ],
    tags: ['retour au sport', 'tests', 'réathlétisation', 'prévention'],
    objectives: [
      'Construire une batterie de tests adaptée à la blessure et au sport pratiqué.',
      'Interpréter les index de symétrie et les seuils de décision.',
      'Planifier la charge de reprise pour limiter le risque de récidive.',
      'Intégrer la dimension psychologique dans la décision partagée.'
    ],
    audience: 'Kinésithérapeutes du sport, praticiens en club, étudiants en dernière année.',
    prerequisites: ['Bases du renforcement et de la pliométrie', 'Examen clinique du membre inférieur'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-08-1',
        title: 'Principes de décision',
        lessons: [
          { id: 'les-08-1-1', title: 'Pourquoi les délais seuls ne suffisent pas', type: 'video', duration: 20 },
          { id: 'les-08-1-2', title: 'Index de symétrie, seuils et limites', type: 'video', duration: 24 },
          { id: 'les-08-1-3', title: 'Bilan de retour au sport (PDF)', type: 'pdf', duration: 12, toolSlug: 'bilan-retour-au-sport' }
        ]
      },
      {
        id: 'mod-08-2',
        title: 'Par localisation',
        lessons: [
          { id: 'les-08-2-1', title: 'Genou : force, hop tests et qualité du saut', type: 'video', duration: 28 },
          { id: 'les-08-2-2', title: 'Ischio-jambiers : force excentrique et sprint', type: 'video', duration: 26 },
          { id: 'les-08-2-3', title: 'Cheville : équilibre, saut et prévention des récidives', type: 'video', duration: 22 },
          { id: 'les-08-2-4', title: 'Épaule : contrôle en position d’armé', type: 'video', duration: 22 }
        ]
      },
      {
        id: 'mod-08-3',
        title: 'Charge de reprise et récidive',
        lessons: [
          { id: 'les-08-3-1', title: 'Planifier la charge des premières semaines de reprise', type: 'video', duration: 26 },
          { id: 'les-08-3-2', title: 'Dimension psychologique et décision partagée', type: 'video', duration: 18 },
          {
            id: 'les-08-3-3', title: 'Quiz final — retour au sport', type: 'quiz', duration: 8,
            quiz: {
              passScore: 3,
              questions: [
                {
                  q: 'Quel seuil de symétrie est habituellement retenu avant la reprise des activités de pivot ?',
                  options: ['70 %', '80 %', '90 %', 'Aucun seuil n’est utile'],
                  answer: 2
                },
                {
                  q: 'Quelle intervention réduit d’environ la moitié le risque de lésion des ischio-jambiers ?',
                  options: ['Les étirements passifs avant l’effort', 'L’exercice nordique', 'Le strapping', 'Les massages'],
                  answer: 1
                },
                {
                  q: 'Après reconstruction du LCA, un retour au sport avant 9 mois :',
                  options: ['N’a aucune influence', 'Augmente nettement le risque de récidive', 'Est recommandé chez le sportif jeune', 'Dépend uniquement de la douleur'],
                  answer: 1
                },
                {
                  q: 'Après une entorse latérale de cheville, quel travail réduit le risque de récidive ?',
                  options: ['L’immobilisation prolongée', 'Le renforcement isolé du quadriceps', 'L’entraînement neuromusculaire et proprioceptif', 'Le repos complet six semaines'],
                  answer: 2
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-09',
    slug: 'tendinopathies-gestion-de-la-charge',
    title: 'Tendinopathies : comprendre et gérer la charge',
    subtitle: 'Coiffe, coude, patellaire, achilléenne et fascia plantaire',
    description: 'Formation transversale sur les tendinopathies : mécanismes de réponse à la charge, évaluation de l’irritabilité, construction d’une progression et suivi objectif.',
    instructorId: 'aut-07',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 195,
    access: 'free',
    rating: 4.9,
    ratingCount: 112,
    enrolledCount: 596,
    region: 'global',
    specialty: 'musculosquelettique',
    pathologies: ['tendinopathie-patellaire', 'tendinopathie-achilleenne', 'epicondylalgie-laterale', 'fasciopathie-plantaire', 'tendinopathie-coiffe-rotateurs'],
    tags: ['tendinopathie', 'charge', 'excentrique', 'isométrique'],
    objectives: [
      'Expliquer la réponse du tendon à la charge en termes compréhensibles par le patient.',
      'Évaluer l’irritabilité pour choisir le point d’entrée du programme.',
      'Construire une progression isométrique, excentrique puis lourde et lente.',
      'Suivre l’évolution avec les scores VISA et la douleur à 24 heures.'
    ],
    audience: 'Kinésithérapeutes musculo-squelettiques et du sport, étudiants à partir de la 3e année.',
    prerequisites: ['Notions de renforcement musculaire progressif'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-09-1',
        title: 'Comprendre le tendon',
        lessons: [
          {
            id: 'les-09-1-1', title: 'Réponse du tendon à la charge', type: 'text', duration: 14,
            content: 'Un tendon s’adapte à la charge qu’on lui impose : trop peu de charge diminue sa capacité, une charge excessive et brutale dépasse ses possibilités d’adaptation. La douleur traduit une inadéquation entre la charge appliquée et la capacité actuelle, pas nécessairement une lésion structurelle.\n\nCette lecture change la conduite à tenir : le repos complet, en réduisant encore la capacité, aggrave le problème à moyen terme. L’objectif est de trouver la dose qui stimule sans dépasser, puis de l’augmenter par paliers mesurables.'
          },
          { id: 'les-09-1-2', title: 'Évaluer l’irritabilité et choisir le point d’entrée', type: 'video', duration: 22 },
          { id: 'les-09-1-3', title: 'La douleur à 24 h comme boussole', type: 'video', duration: 18 }
        ]
      },
      {
        id: 'mod-09-2',
        title: 'Construire la progression',
        lessons: [
          { id: 'les-09-2-1', title: 'Isométriques antalgiques : quand et comment', type: 'video', duration: 20 },
          { id: 'les-09-2-2', title: 'Excentrique et renforcement lourd et lent', type: 'video', duration: 26 },
          { id: 'les-09-2-3', title: 'Énergie élastique, pliométrie et retour au sport', type: 'video', duration: 24 },
          { id: 'les-09-2-4', title: 'Guide de gestion de la charge (PDF)', type: 'pdf', duration: 12, resourceSlug: 'tendinopathie-patellaire-gestion-de-la-charge' }
        ]
      },
      {
        id: 'mod-09-3',
        title: 'Par localisation',
        lessons: [
          { id: 'les-09-3-1', title: 'Coude et coiffe des rotateurs', type: 'video', duration: 22 },
          { id: 'les-09-3-2', title: 'Achille et fascia plantaire', type: 'video', duration: 22 },
          {
            id: 'les-09-3-3', title: 'Quiz — gestion de la charge', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quel indicateur guide la progression de la charge dans une tendinopathie ?',
                  options: ['La douleur pendant l’exercice uniquement', 'La douleur à 24 h après la séance', 'L’imagerie de contrôle', 'La circonférence du membre'],
                  answer: 1
                },
                {
                  q: 'Le repos complet prolongé dans une tendinopathie :',
                  options: ['Améliore la capacité du tendon', 'Diminue la capacité du tendon', 'N’a aucun effet', 'Remplace le renforcement'],
                  answer: 1
                },
                {
                  q: 'Dans une tendinopathie achilléenne insertionnelle, il convient de :',
                  options: ['Travailler en flexion dorsale maximale d’emblée', 'Limiter initialement la flexion dorsale extrême', 'Éviter tout renforcement', 'Immobiliser six semaines'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-10',
    slug: 'vertiges-et-paralysie-faciale-reeducation-de-proximite',
    title: 'Vertiges et paralysie faciale : rééducation de proximité',
    subtitle: 'Deux motifs fréquents en cabinet, deux démarches structurées',
    description: 'Formation pratique réunissant deux motifs de consultation courants en cabinet : le vertige positionnel et la paralysie faciale périphérique. Triage, examen, manœuvres et rééducation.',
    instructorId: 'aut-13',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 230,
    access: 'free',
    rating: 4.8,
    ratingCount: 61,
    enrolledCount: 342,
    region: 'tete',
    specialty: 'vestibulaire',
    pathologies: ['vertige-positionnel-paroxystique-benin', 'paralysie-faciale-peripherique'],
    tags: ['vestibulaire', 'VPPB', 'paralysie faciale', 'ORL'],
    objectives: [
      'Trier un vertige et reconnaître les signes imposant un avis médical urgent.',
      'Réaliser et interpréter les manœuvres diagnostiques du VPPB.',
      'Choisir et exécuter la manœuvre de repositionnement adaptée au canal atteint.',
      'Conduire une rééducation faciale limitant le risque de syncinésies.'
    ],
    audience: 'Kinésithérapeutes en cabinet, praticiens souhaitant développer une activité vestibulaire, étudiants avancés.',
    prerequisites: ['Anatomie de l’oreille interne et du nerf facial'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-10-1',
        title: 'Trier un vertige',
        lessons: [
          { id: 'les-10-1-1', title: 'Interrogatoire : durée, déclencheurs, signes associés', type: 'video', duration: 24 },
          { id: 'les-10-1-2', title: 'Signes d’alerte : quand ne pas manipuler', type: 'video', duration: 22 },
          { id: 'les-10-1-3', title: 'Trame de bilan vestibulaire (PDF)', type: 'pdf', duration: 12, toolSlug: 'bilan-vestibulaire' }
        ]
      },
      {
        id: 'mod-10-2',
        title: 'Diagnostiquer et traiter le VPPB',
        lessons: [
          { id: 'les-10-2-1', title: 'Dix-Hallpike : réalisation et lecture du nystagmus', type: 'video', duration: 26 },
          { id: 'les-10-2-2', title: 'Canal horizontal : test de rotation et manœuvres', type: 'video', duration: 24 },
          { id: 'les-10-2-3', title: 'Guide des manœuvres de repositionnement (PDF)', type: 'pdf', duration: 14, resourceSlug: 'vppb-manoeuvres-de-repositionnement' },
          {
            id: 'les-10-2-4', title: 'Quiz — vertige positionnel', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quel nystagmus est attendu lors d’un Dix-Hallpike positif pour le canal postérieur ?',
                  options: ['Vertical pur, sans latence', 'Torsionnel géotropique avec latence et épuisement', 'Horizontal permanent', 'Aucun nystagmus'],
                  answer: 1
                },
                {
                  q: 'Devant un nystagmus vertical pur, non fatigable, il faut :',
                  options: ['Réaliser une manœuvre d’Epley', 'Orienter vers un avis médical (suspicion centrale)', 'Répéter le test dix fois', 'Prescrire des exercices d’habituation'],
                  answer: 1
                },
                {
                  q: 'Combien de manœuvres de repositionnement sont généralement nécessaires ?',
                  options: ['Une à deux dans la majorité des cas', 'Au moins dix', 'Une par jour pendant un mois', 'Aucune, l’évolution est toujours spontanée'],
                  answer: 0
                }
              ]
            }
          }
        ]
      },
      {
        id: 'mod-10-3',
        title: 'Rééducation faciale',
        lessons: [
          { id: 'les-10-3-1', title: 'Évaluer : House-Brackmann et photographies standardisées', type: 'video', duration: 22 },
          { id: 'les-10-3-2', title: 'Travail analytique : précision plutôt que force', type: 'video', duration: 26 },
          { id: 'les-10-3-3', title: 'Prévenir et traiter les syncinésies', type: 'video', duration: 22 },
          { id: 'les-10-3-4', title: 'Guide de rééducation faciale (PDF)', type: 'pdf', duration: 12, resourceSlug: 'paralysie-faciale-reeducation-neuromusculaire' }
        ]
      }
    ]
  },

  {
    id: 'cou-11',
    slug: 'parkinson-entrainement-intensif-et-indicage',
    title: 'Maladie de Parkinson : entraînement intensif et indiçage',
    subtitle: 'Marche, équilibre et franchissement du freezing',
    description: 'Formation consacrée à la rééducation du patient parkinsonien : dosage de l’entraînement, stratégies d’indiçage, travail de l’équilibre et prévention des chutes.',
    instructorId: 'aut-15',
    level: 'avance',
    language: 'fr',
    durationMinutes: 245,
    access: 'free',
    rating: 4.9,
    ratingCount: 83,
    enrolledCount: 401,
    region: 'global',
    specialty: 'neurologie',
    pathologies: ['maladie-de-parkinson'],
    tags: ['Parkinson', 'indiçage', 'marche', 'chutes'],
    objectives: [
      'Évaluer marche, équilibre et freezing avec des outils validés.',
      'Doser un entraînement suffisamment intensif pour produire un apprentissage.',
      'Mettre en place des stratégies d’indiçage auditif et visuel.',
      'Construire un programme de prévention des chutes adapté au stade de la maladie.'
    ],
    audience: 'Kinésithérapeutes en neurologie, en cabinet ou en institution ; étudiants avancés.',
    prerequisites: ['Bases de l’examen neurologique', 'Notions sur les traitements dopaminergiques'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-11-1',
        title: 'Comprendre et évaluer',
        lessons: [
          { id: 'les-11-1-1', title: 'Signes moteurs et fluctuations : conséquences pour la séance', type: 'video', duration: 26 },
          { id: 'les-11-1-2', title: 'Évaluer l’équilibre : Mini-BESTest en pratique', type: 'video', duration: 24 },
          { id: 'les-11-1-3', title: 'Questionnaire de freezing (PDF)', type: 'pdf', duration: 10, toolSlug: 'freezing-of-gait-questionnaire' }
        ]
      },
      {
        id: 'mod-11-2',
        title: 'Entraîner',
        lessons: [
          { id: 'les-11-2-1', title: 'Intensité et volume : ce qui produit un effet', type: 'video', duration: 28 },
          { id: 'les-11-2-2', title: 'Mouvements de grande amplitude et transfert au quotidien', type: 'video', duration: 26 },
          { id: 'les-11-2-3', title: 'Protocole complet (PDF)', type: 'pdf', duration: 14, resourceSlug: 'parkinson-entrainement-intensif-et-indicage' }
        ]
      },
      {
        id: 'mod-11-3',
        title: 'Indiçage et prévention des chutes',
        lessons: [
          { id: 'les-11-3-1', title: 'Indiçage auditif, visuel et attentionnel', type: 'video', duration: 26 },
          { id: 'les-11-3-2', title: 'Stratégies de franchissement du freezing', type: 'video', duration: 24 },
          {
            id: 'les-11-3-3', title: 'Quiz — Parkinson', type: 'quiz', duration: 8,
            quiz: {
              passScore: 3,
              questions: [
                {
                  q: 'Quel effet immédiat produit l’indiçage rythmique auditif ?',
                  options: ['Une diminution du tremblement', 'Une augmentation de la longueur de pas et de la vitesse', 'Une baisse de la tension artérielle', 'Une amélioration de la déglutition'],
                  answer: 1
                },
                {
                  q: 'À quel moment programmer préférentiellement la séance ?',
                  options: ['Pendant une phase « off »', 'Pendant une phase « on » du traitement', 'Indifféremment', 'Au réveil, avant toute prise médicamenteuse'],
                  answer: 1
                },
                {
                  q: 'Quelle approche produit un bénéfice moteur durable ?',
                  options: ['Massage et mobilisations passives', 'Entraînement intensif et répété orienté vers la tâche', 'Repos et économie d’énergie', 'Électrostimulation isolée'],
                  answer: 1
                },
                {
                  q: 'Le freezing survient le plus souvent :',
                  options: ['En ligne droite dans un couloir large', 'Aux demi-tours et dans les passages étroits', 'Uniquement en position assise', 'Pendant le sommeil'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-12',
    slug: 'prothese-totale-de-genou-reeducation',
    title: 'Prothèse totale de genou : rééducation complète',
    subtitle: 'Extension, flexion, force et retour aux activités',
    description: 'Formation opérationnelle sur la rééducation après arthroplastie totale de genou, de la phase hospitalière au retour aux activités, avec objectifs chiffrés par échéance.',
    instructorId: 'aut-12',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 210,
    access: 'free',
    rating: 4.7,
    ratingCount: 69,
    enrolledCount: 358,
    region: 'genou',
    specialty: 'rhumatologie',
    pathologies: ['prothese-totale-genou', 'gonarthrose', 'lesion-meniscale'],
    tags: ['prothèse', 'genou', 'post-opératoire', 'quadriceps'],
    objectives: [
      'Prioriser la récupération de l’extension et contrôler l’œdème.',
      'Progresser la flexion vers les objectifs attendus à chaque échéance.',
      'Restaurer la force du quadriceps sur plusieurs mois.',
      'Reconnaître les complications imposant un avis chirurgical.'
    ],
    audience: 'Kinésithérapeutes en cabinet, en centre de rééducation ou en service d’orthopédie.',
    prerequisites: ['Anatomie du genou', 'Bases du renforcement progressif'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-12-1',
        title: 'Phase précoce',
        lessons: [
          { id: 'les-12-1-1', title: 'Œdème, douleur et sidération du quadriceps', type: 'video', duration: 24 },
          { id: 'les-12-1-2', title: 'Récupérer l’extension complète : la priorité', type: 'video', duration: 26 },
          { id: 'les-12-1-3', title: 'Protocole post-opératoire (PDF)', type: 'pdf', duration: 14, resourceSlug: 'prothese-genou-protocole-post-operatoire' }
        ]
      },
      {
        id: 'mod-12-2',
        title: 'Gagner en flexion et en force',
        lessons: [
          { id: 'les-12-2-1', title: 'Progression de la flexion : objectifs par échéance', type: 'video', duration: 24 },
          { id: 'les-12-2-2', title: 'Renforcement du quadriceps : chaîne fermée puis ouverte', type: 'video', duration: 28 },
          { id: 'les-12-2-3', title: 'Marche, escaliers et équilibre', type: 'video', duration: 22 }
        ]
      },
      {
        id: 'mod-12-3',
        title: 'Suivi et complications',
        lessons: [
          {
            id: 'les-12-3-1', title: 'Reconnaître une raideur qui s’installe', type: 'text', duration: 14,
            content: 'Une flexion inférieure à 90° à six semaines ou un déficit d’extension qui ne se comble pas doivent alerter : au-delà, la raideur devient difficile à récupérer et un avis chirurgical s’impose sans attendre.\n\nTrois éléments orientent la conduite : l’évolution de l’œdème, la douleur nocturne et la comparaison des amplitudes d’une semaine à l’autre. Une stagnation sur deux semaines consécutives, malgré une rééducation bien conduite, justifie de reprendre contact avec l’équipe chirurgicale.'
          },
          { id: 'les-12-3-2', title: 'Oxford Knee Score et suivi fonctionnel', type: 'pdf', duration: 10, toolSlug: 'oxford-knee-score' },
          {
            id: 'les-12-3-3', title: 'Quiz — prothèse de genou', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quelle récupération est prioritaire dans les premières semaines ?',
                  options: ['La flexion maximale', 'L’extension complète', 'La force maximale', 'La vitesse de marche'],
                  answer: 1
                },
                {
                  q: 'Quel objectif de flexion est attendu vers trois mois ?',
                  options: ['60 à 70°', '80 à 90°', '110 à 120°', '150°'],
                  answer: 2
                },
                {
                  q: 'Une flexion inférieure à 90° à six semaines impose de :',
                  options: ['Poursuivre à l’identique', 'Alerter le chirurgien', 'Arrêter la rééducation', 'Immobiliser le genou'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-13',
    slug: 'readaptation-cardiaque-insuffisance-cardiaque',
    title: 'Réadaptation cardiaque : l’insuffisance cardiaque chronique',
    subtitle: 'Évaluer, réentraîner, éduquer en sécurité',
    description: 'Formation à la réadaptation à l’effort du patient insuffisant cardiaque : évaluation, prescription d’intensité, surveillance de séance et éducation thérapeutique.',
    instructorId: 'aut-05',
    level: 'avance',
    language: 'fr',
    durationMinutes: 200,
    access: 'free',
    rating: 4.6,
    ratingCount: 47,
    enrolledCount: 236,
    region: 'thorax',
    specialty: 'cardioresp',
    pathologies: ['insuffisance-cardiaque-chronique', 'bpco'],
    tags: ['insuffisance cardiaque', 'réadaptation', 'endurance', 'sécurité'],
    objectives: [
      'Évaluer la capacité fonctionnelle et situer le patient sur la classification NYHA.',
      'Prescrire une intensité d’effort individualisée et sûre.',
      'Reconnaître les signes de décompensation imposant l’arrêt du programme.',
      'Structurer l’éducation thérapeutique et le maintien de l’activité au long cours.'
    ],
    audience: 'Kinésithérapeutes en réadaptation cardio-respiratoire, en cabinet ou en centre.',
    prerequisites: ['Physiologie cardio-respiratoire de base', 'Test de marche de 6 minutes'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-13-1',
        title: 'Évaluer avant d’entraîner',
        lessons: [
          { id: 'les-13-1-1', title: 'Classification NYHA et capacité fonctionnelle', type: 'video', duration: 22 },
          { id: 'les-13-1-2', title: 'Test de marche de 6 minutes chez l’insuffisant cardiaque', type: 'video', duration: 24 },
          { id: 'les-13-1-3', title: 'Fiche NYHA (PDF)', type: 'pdf', duration: 8, toolSlug: 'classification-nyha' }
        ]
      },
      {
        id: 'mod-13-2',
        title: 'Réentraîner',
        lessons: [
          { id: 'les-13-2-1', title: 'Endurance continue ou fractionnée : comment choisir', type: 'video', duration: 26 },
          { id: 'les-13-2-2', title: 'Renforcement périphérique en sécurité', type: 'video', duration: 24 },
          { id: 'les-13-2-3', title: 'Programme de réadaptation (PDF)', type: 'pdf', duration: 14, resourceSlug: 'insuffisance-cardiaque-readaptation-effort' }
        ]
      },
      {
        id: 'mod-13-3',
        title: 'Sécurité et éducation',
        lessons: [
          {
            id: 'les-13-3-1', title: 'Signes d’alerte et critères d’arrêt de séance', type: 'text', duration: 14,
            content: 'Trois situations imposent d’interrompre la séance et de solliciter un avis médical : une douleur thoracique, une syncope ou un malaise, des palpitations soutenues avec mauvaise tolérance.\n\nEntre les séances, le patient doit connaître les signes de décompensation : prise de poids de plus de deux kilos en trois jours, gonflement des chevilles, essoufflement en position allongée obligeant à surélever la tête. Leur apparition conduit à suspendre le réentraînement et à contacter le médecin, non à « forcer un peu moins ».'
          },
          { id: 'les-13-3-2', title: 'Éducation thérapeutique : poids, sel, observance', type: 'video', duration: 22 },
          {
            id: 'les-13-3-3', title: 'Quiz — réadaptation cardiaque', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quelle situation contre-indique temporairement le réentraînement ?',
                  options: ['Un stade NYHA II stabilisé', 'Une décompensation en cours', 'Un âge supérieur à 70 ans', 'Un traitement bêtabloquant'],
                  answer: 1
                },
                {
                  q: 'Quel signe doit faire suspendre le programme et alerter le médecin ?',
                  options: ['Une prise de poids de plus de 2 kg en trois jours', 'Une légère fatigue en fin de séance', 'Une fréquence cardiaque à 100/min à l’effort', 'Une sudation modérée'],
                  answer: 0
                },
                {
                  q: 'Quel bénéfice est établi par les revues systématiques ?',
                  options: ['Aucun bénéfice démontré', 'Réduction des hospitalisations et amélioration de la qualité de vie', 'Guérison de l’insuffisance cardiaque', 'Arrêt des traitements médicamenteux'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-14',
    slug: 'geriatrie-chutes-et-fracture-de-hanche',
    title: 'Gériatrie : prévenir les chutes, récupérer après une fracture',
    subtitle: 'Fragilité, équilibre et parcours après fracture de hanche',
    description: 'Formation dédiée au sujet âgé : dépistage de la fragilité, programme d’équilibre efficace, rééducation après fracture de l’extrémité supérieure du fémur et prévention de la récidive.',
    instructorId: 'aut-08',
    level: 'intermediaire',
    language: 'fr',
    durationMinutes: 220,
    access: 'free',
    rating: 4.8,
    ratingCount: 92,
    enrolledCount: 487,
    region: 'global',
    specialty: 'geriatrie',
    pathologies: ['fracture-extremite-superieure-femur', 'prothese-totale-hanche', 'coxarthrose', 'gonarthrose'],
    tags: ['gériatrie', 'chutes', 'fracture du col', 'équilibre'],
    objectives: [
      'Dépister la fragilité et le risque de chute avec des outils validés.',
      'Construire un programme d’équilibre à la dose efficace.',
      'Conduire la rééducation après fracture de hanche, de la verticalisation au domicile.',
      'Organiser la prévention de la seconde fracture avec l’équipe soignante.'
    ],
    audience: 'Kinésithérapeutes en cabinet, à domicile, en EHPAD ou en service de gériatrie.',
    prerequisites: [],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-14-1',
        title: 'Dépister et évaluer',
        lessons: [
          { id: 'les-14-1-1', title: 'Fragilité et risque de chute : repérage en pratique', type: 'video', duration: 24 },
          { id: 'les-14-1-2', title: 'SPPB, TUG et vitesse de marche : réalisation standardisée', type: 'video', duration: 26 },
          { id: 'les-14-1-3', title: 'Trame de bilan équilibre et marche (PDF)', type: 'pdf', duration: 12, toolSlug: 'bilan-equilibre-et-marche-du-sujet-age' }
        ]
      },
      {
        id: 'mod-14-2',
        title: 'Programme d’équilibre efficace',
        lessons: [
          { id: 'les-14-2-1', title: 'La dose qui fonctionne : trois heures par semaine', type: 'video', duration: 22 },
          { id: 'les-14-2-2', title: 'Progresser la difficulté d’équilibre en sécurité', type: 'video', duration: 26 },
          { id: 'les-14-2-3', title: 'Guide de prévention des chutes (PDF)', type: 'pdf', duration: 12, resourceSlug: 'prevention-chutes-personne-agee-guide' }
        ]
      },
      {
        id: 'mod-14-3',
        title: 'Après une fracture de hanche',
        lessons: [
          { id: 'les-14-3-1', title: 'Verticalisation précoce et reprise de la marche', type: 'video', duration: 26 },
          { id: 'les-14-3-2', title: 'Poursuivre la rééducation après la sortie', type: 'video', duration: 22 },
          { id: 'les-14-3-3', title: 'Parcours de rééducation (PDF)', type: 'pdf', duration: 14, resourceSlug: 'fracture-hanche-parcours-de-reeducation' },
          {
            id: 'les-14-3-4', title: 'Quiz — gériatrie', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Quelle dose hebdomadaire d’exercices d’équilibre est associée à un effet préventif sur les chutes ?',
                  options: ['30 minutes', 'Environ 3 heures', '10 heures', 'La dose n’a pas d’importance'],
                  answer: 1
                },
                {
                  q: 'Après chirurgie d’une fracture de hanche, la conduite recommandée est :',
                  options: ['Repos strict deux semaines', 'Verticalisation et mise en charge précoces', 'Immobilisation par attelle', 'Rééducation différée à un mois'],
                  answer: 1
                },
                {
                  q: 'Un score SPPB inférieur ou égal à 8 traduit :',
                  options: ['Une performance normale', 'Une limitation fonctionnelle significative', 'Une contre-indication à l’exercice', 'Une erreur de mesure'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-15',
    slug: 'lymphoedeme-et-reeducation-apres-cancer-du-sein',
    title: 'Lymphœdème et rééducation après cancer du sein',
    subtitle: 'Compression, exercice et accompagnement',
    description: 'Formation complète sur la prise en charge après traitement du cancer du sein : lymphœdème, mobilité de l’épaule, reprise de l’activité physique et éducation à la prévention.',
    instructorId: 'aut-14',
    level: 'avance',
    language: 'fr',
    durationMinutes: 215,
    access: 'free',
    rating: 4.9,
    ratingCount: 54,
    enrolledCount: 268,
    region: 'epaule',
    specialty: 'oncologie',
    pathologies: ['lymphoedeme-apres-cancer-du-sein', 'capsulite-retractile'],
    tags: ['lymphœdème', 'cancer du sein', 'compression', 'activité physique adaptée'],
    objectives: [
      'Évaluer et quantifier un lymphœdème par des mesures standardisées.',
      'Conduire un traitement décongestif complet en phase intensive puis d’entretien.',
      'Prescrire un renforcement progressif sûr du membre supérieur.',
      'Éduquer à la prévention des infections et reconnaître l’érysipèle.'
    ],
    audience: 'Kinésithérapeutes intéressés par la lymphologie et la rééducation en oncologie.',
    prerequisites: ['Anatomie du système lymphatique', 'Bases de la rééducation de l’épaule'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-15-1',
        title: 'Évaluer',
        lessons: [
          { id: 'les-15-1-1', title: 'Reconnaître et stadifier un lymphœdème', type: 'video', duration: 24 },
          { id: 'les-15-1-2', title: 'Mesures circonférentielles standardisées', type: 'video', duration: 20 },
          { id: 'les-15-1-3', title: 'Fiche de mesure (PDF)', type: 'pdf', duration: 10, toolSlug: 'mesure-circonferentielle-membre-superieur' }
        ]
      },
      {
        id: 'mod-15-2',
        title: 'Traiter',
        lessons: [
          { id: 'les-15-2-1', title: 'Phase intensive : drainage, bandages, soins de peau', type: 'video', duration: 30 },
          { id: 'les-15-2-2', title: 'Phase d’entretien : manchon et auto-drainage', type: 'video', duration: 24 },
          { id: 'les-15-2-3', title: 'Protocole décongestif complet (PDF)', type: 'pdf', duration: 14, resourceSlug: 'lymphoedeme-prise-en-charge-decongestive' }
        ]
      },
      {
        id: 'mod-15-3',
        title: 'Bouger et prévenir',
        lessons: [
          {
            id: 'les-15-3-1', title: 'Renforcement progressif : lever une crainte tenace', type: 'text', duration: 14,
            content: 'Pendant longtemps, on a conseillé aux patientes d’épargner le bras du côté opéré. Les essais contrôlés ont montré l’inverse : un renforcement progressif, réalisé sous compression, n’aggrave pas le lymphœdème et réduit même le nombre d’exacerbations.\n\nEn pratique, la progression se fait par petits paliers, avec surveillance des circonférences et de la sensation de tension. Le message adressé à la patiente compte autant que le programme : reprendre confiance dans l’usage de son bras fait partie du traitement.'
          },
          { id: 'les-15-3-2', title: 'Mobilité de l’épaule et prévention de la capsulite', type: 'video', duration: 22 },
          { id: 'les-15-3-3', title: 'Éducation : soins de peau, voyages, signes d’érysipèle', type: 'video', duration: 20 },
          {
            id: 'les-15-3-4', title: 'Quiz — lymphœdème', type: 'quiz', duration: 6,
            quiz: {
              passScore: 2,
              questions: [
                {
                  q: 'Le renforcement musculaire progressif du membre atteint :',
                  options: ['Aggrave systématiquement le lymphœdème', 'Est sûr et bénéfique sous compression', 'Est contre-indiqué à vie', 'Remplace la compression'],
                  answer: 1
                },
                {
                  q: 'Devant une rougeur douloureuse avec fièvre du membre, il faut :',
                  options: ['Intensifier le drainage manuel', 'Orienter en urgence : suspicion d’érysipèle', 'Retirer la compression et attendre', 'Doubler les séances'],
                  answer: 1
                },
                {
                  q: 'Quel élément constitue le pilier du maintien des résultats ?',
                  options: ['La compression', 'Le repos du bras', 'Les massages profonds', 'La restriction hydrique'],
                  answer: 0
                }
              ]
            }
          }
        ]
      }
    ]
  },

  {
    id: 'cou-16',
    slug: 'rachis-au-dela-de-la-lombalgie-commune',
    title: 'Rachis : au-delà de la lombalgie commune',
    subtitle: 'Sténose lombaire, rachialgie inflammatoire et scoliose',
    description: 'Formation consacrée aux tableaux rachidiens spécifiques : reconnaître une claudication neurogène, une rachialgie inflammatoire ou une scoliose évolutive, et adapter la prise en charge.',
    instructorId: 'aut-01',
    level: 'avance',
    language: 'fr',
    durationMinutes: 205,
    access: 'free',
    rating: 4.7,
    ratingCount: 63,
    enrolledCount: 297,
    region: 'rachis',
    specialty: 'rhumatologie',
    pathologies: ['stenose-lombaire', 'spondyloarthrite-axiale', 'scoliose-idiopathique-adolescent', 'lombalgie-commune', 'lombosciatique-hernie-discale'],
    tags: ['rachis', 'sténose', 'spondyloarthrite', 'scoliose'],
    objectives: [
      'Distinguer une lombalgie commune d’un tableau rachidien spécifique.',
      'Reconnaître une claudication neurogène et construire un programme fonctionnel.',
      'Identifier une rachialgie inflammatoire et orienter vers le rhumatologue.',
      'Dépister et suivre une scoliose de l’adolescent pendant la croissance.'
    ],
    audience: 'Kinésithérapeutes musculo-squelettiques, praticiens recevant des rachialgies chroniques, étudiants avancés.',
    prerequisites: ['Examen clinique du rachis lombaire'],
    certificate: true,
    published: true,
    seed: true,
    modules: [
      {
        id: 'mod-16-1',
        title: 'Reconnaître le tableau',
        lessons: [
          {
            id: 'les-16-1-1', title: 'Trois profils, trois démarches', type: 'text', duration: 14,
            content: 'Trois éléments d’interrogatoire permettent d’orienter d’emblée. Une douleur des membres inférieurs apparaissant à la marche et soulagée par la position assise ou penchée en avant évoque une claudication neurogène. Une rachialgie qui réveille en deuxième partie de nuit, avec une raideur matinale de plus de trente minutes améliorée par le mouvement, évoque un rhumatisme inflammatoire. Une asymétrie du tronc chez un adolescent en croissance impose un examen en flexion antérieure.\n\nCes trois profils ne relèvent ni du même bilan, ni de la même prise en charge, ni du même circuit de soins : les confondre avec une lombalgie commune retarde le diagnostic de plusieurs années dans le cas de la spondyloarthrite.'
          },
          { id: 'les-16-1-2', title: 'Claudication neurogène ou artérielle : différencier', type: 'video', duration: 24 },
          { id: 'les-16-1-3', title: 'Rachialgie inflammatoire : quand orienter', type: 'video', duration: 22 }
        ]
      },
      {
        id: 'mod-16-2',
        title: 'Sténose lombaire et spondyloarthrite',
        lessons: [
          { id: 'les-16-2-1', title: 'Programme fonctionnel et périmètre de marche', type: 'video', duration: 26 },
          { id: 'les-16-2-2', title: 'Programme quotidien dans la spondyloarthrite', type: 'video', duration: 24 },
          { id: 'les-16-2-3', title: 'Protocole sténose lombaire (PDF)', type: 'pdf', duration: 12, resourceSlug: 'stenose-lombaire-programme-fonctionnel' },
          { id: 'les-16-2-4', title: 'Programme spondyloarthrite (PDF)', type: 'pdf', duration: 12, resourceSlug: 'spondyloarthrite-programme-quotidien' }
        ]
      },
      {
        id: 'mod-16-3',
        title: 'Scoliose de l’adolescent',
        lessons: [
          { id: 'les-16-3-1', title: 'Dépistage, scoliomètre et surveillance', type: 'video', duration: 22 },
          { id: 'les-16-3-2', title: 'Exercices spécifiques et accompagnement du corset', type: 'video', duration: 26 },
          {
            id: 'les-16-3-3', title: 'Quiz — rachis spécifique', type: 'quiz', duration: 8,
            quiz: {
              passScore: 3,
              questions: [
                {
                  q: 'Quel élément évoque une claudication neurogène plutôt qu’artérielle ?',
                  options: ['Le soulagement en position penchée en avant', 'L’abolition des pouls périphériques', 'La douleur au repos allongé', 'La pâleur du membre'],
                  answer: 0
                },
                {
                  q: 'Quelle caractéristique oriente vers une rachialgie inflammatoire ?',
                  options: ['Douleur uniquement à l’effort', 'Raideur matinale de plus de 30 minutes améliorée par le mouvement', 'Douleur soulagée par le repos strict', 'Début après 60 ans'],
                  answer: 1
                },
                {
                  q: 'À partir de quelle rotation du tronc au scoliomètre une radiographie est-elle recommandée ?',
                  options: ['1 à 2°', '5 à 7°', '15°', '25°'],
                  answer: 1
                },
                {
                  q: 'Dans la spondyloarthrite axiale, l’exercice doit être :',
                  options: ['Interrompu pendant les poussées', 'Régulier, quotidien, adapté pendant les poussées', 'Réservé aux formes sévères', 'Remplacé par le repos'],
                  answer: 1
                }
              ]
            }
          }
        ]
      }
    ]
  }
];
