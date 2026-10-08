import type { Pathology } from '../types';

/* =====================================================================
   Pathologies — base structurée par région anatomique
   ---------------------------------------------------------------------
   Chaque pathologie sert de point d'entrée transversal : la page
   /pathologies/[slug] agrège automatiquement les ressources, outils,
   exercices, formations et webinaires qui la référencent.
   Contenu pédagogique — ne remplace pas le raisonnement clinique.
   ===================================================================== */

export const pathologies: Pathology[] = [
  {
    id: 'pat-01',
    slug: 'lombalgie-commune',
    name: 'Lombalgie commune',
    region: 'rachis',
    specialty: 'musculosquelettique',
    aliases: ['mal de dos', 'lumbago', 'low back pain', 'ألم أسفل الظهر'],
    i18n: { en: { name: 'Non-specific low back pain' }, ar: { name: 'ألم أسفل الظهر غير النوعي' } },
    summary: 'Douleur lombaire sans cause structurelle grave identifiable, évoluant le plus souvent favorablement. La prise en charge actuelle privilégie l’activité physique, l’éducation et la réassurance plutôt que le repos.',
    epidemiology: 'Première cause d’années vécues avec incapacité dans le monde. Environ 80 % des adultes présentent au moins un épisode au cours de leur vie ; 10 à 20 % évoluent vers une forme persistante.',
    presentation: [
      'Douleur lombaire mécanique, majorée par certaines postures ou mouvements.',
      'Absence de déficit neurologique systématisé.',
      'Raideur matinale modérée, appréhension du mouvement fréquente.',
      'Retentissement fonctionnel variable : port de charges, station assise prolongée, sommeil.'
    ],
    redFlags: [
      'Déficit moteur progressif ou syndrome de la queue de cheval (troubles sphinctériens, anesthésie en selle).',
      'Traumatisme significatif, ostéoporose connue ou corticothérapie prolongée.',
      'Douleur nocturne inflammatoire, fièvre, perte de poids inexpliquée.',
      'Antécédent néoplasique, douleur d’aggravation constante non mécanique.'
    ],
    management: [
      'Éducation et réassurance : expliquer le caractère bénin et l’évolution attendue.',
      'Maintien ou reprise progressive de l’activité physique et professionnelle.',
      'Exercices thérapeutiques actifs (contrôle moteur, renforcement, endurance).',
      'Thérapie manuelle en complément, jamais en traitement isolé prolongé.',
      'Repérage des facteurs psychosociaux (kinésiophobie, catastrophisme) et orientation si besoin.'
    ],
    keyFacts: [
      'Aucune imagerie n’est requise en l’absence de signal d’alerte.',
      'Le repos au lit aggrave le pronostic fonctionnel.',
      'Le score STarT Back aide à graduer l’intensité de la prise en charge.'
    ],
    evidence: 'Recommandations concordantes (haut niveau de preuve pour l’exercice et l’éducation).'
  },
  {
    id: 'pat-02',
    slug: 'cervicalgie-commune',
    name: 'Cervicalgie commune',
    region: 'tete',
    specialty: 'musculosquelettique',
    aliases: ['douleur cervicale', 'neck pain', 'ألم الرقبة'],
    summary: 'Douleur cervicale mécanique fréquente, souvent liée aux postures prolongées et au stress, avec fréquentes irradiations scapulaires et céphalées associées.',
    epidemiology: 'Prévalence annuelle de 30 à 50 % chez l’adulte ; récidives fréquentes, en particulier chez les travailleurs de bureau.',
    presentation: [
      'Limitation douloureuse des amplitudes cervicales, surtout en rotation.',
      'Contracture des trapèzes supérieurs et des sous-occipitaux.',
      'Céphalées de tension associées possibles.',
      'Aggravation en fin de journée ou après travail sur écran prolongé.'
    ],
    redFlags: [
      'Traumatisme cervical récent à haute cinétique (règles canadiennes du rachis cervical).',
      'Signes médullaires : maladresse des mains, troubles de l’équilibre, hyperréflexie.',
      'Signes vertébro-basilaires : vertiges, diplopie, dysarthrie, dysphagie.',
      'Fièvre, altération de l’état général, torticolis fébrile de l’enfant.'
    ],
    management: [
      'Exercices de contrôle cranio-cervical et endurance des fléchisseurs profonds.',
      'Renforcement scapulaire et travail postural fonctionnel.',
      'Mobilisations cervicales et thoraciques en complément des exercices.',
      'Ergonomie du poste de travail et gestion du stress.'
    ],
    keyFacts: [
      'L’association exercices + thérapie manuelle est supérieure à chaque approche isolée.',
      'Le Neck Disability Index permet de suivre l’évolution fonctionnelle.'
    ],
    evidence: 'Niveau de preuve modéré à élevé pour les exercices actifs.'
  },
  {
    id: 'pat-03',
    slug: 'tendinopathie-coiffe-rotateurs',
    name: 'Tendinopathie de la coiffe des rotateurs',
    region: 'epaule',
    specialty: 'musculosquelettique',
    aliases: ['épaule douloureuse', 'conflit sous-acromial', 'rotator cuff', 'اعتلال أوتار الكتف'],
    i18n: { en: { name: 'Rotator cuff related shoulder pain' } },
    summary: 'Douleur latérale d’épaule, majorée en élévation et en rotation, liée à une souffrance tendineuse de la coiffe et à un déficit de contrôle scapulo-huméral.',
    epidemiology: 'Motif le plus fréquent de consultation pour l’épaule (jusqu’à 70 % des épaules douloureuses non traumatiques).',
    presentation: [
      'Douleur à l’élévation active, arc douloureux entre 60° et 120°.',
      'Douleur nocturne sur l’épaule atteinte.',
      'Faiblesse des rotateurs sans rupture complète.',
      'Dyskinésie scapulaire fréquemment associée.'
    ],
    redFlags: [
      'Traumatisme avec impossibilité d’élévation active (suspicion de rupture massive).',
      'Masse, déformation ou œdème inexpliqué.',
      'Signes neurologiques du membre supérieur, amyotrophie rapide.',
      'Douleur non mécanique avec fièvre.'
    ],
    management: [
      'Exercices progressifs en charge des rotateurs et des stabilisateurs de la scapula.',
      'Éducation sur la charge et l’adaptation des activités déclenchantes.',
      'Travail en amplitudes non douloureuses puis progression vers l’élévation complète.',
      'Réévaluation à 6 et 12 semaines avant d’envisager un avis chirurgical.'
    ],
    keyFacts: [
      'Les tests d’impingement isolés ont une faible valeur diagnostique : le raisonnement clinique global primes.',
      'Le SPADI et le score de Constant permettent d’objectiver l’évolution.'
    ],
    evidence: 'Preuve élevée pour l’exercice thérapeutique en première intention.'
  },
  {
    id: 'pat-04',
    slug: 'capsulite-retractile',
    name: 'Capsulite rétractile',
    region: 'epaule',
    specialty: 'rhumatologie',
    aliases: ['épaule gelée', 'frozen shoulder', 'التهاب المحفظة اللاصق'],
    summary: 'Raideur globale et douloureuse de l’épaule évoluant en phases (douloureuse, raide, résolutive), souvent associée au diabète.',
    epidemiology: 'Touche 2 à 5 % de la population générale, jusqu’à 20 % des personnes diabétiques ; pic entre 40 et 60 ans.',
    presentation: [
      'Perte des amplitudes passives dans tous les plans, prédominant en rotation externe.',
      'Douleur nocturne intense en phase initiale.',
      'Évolution spontanée longue, de 12 à 30 mois.'
    ],
    redFlags: [
      'Raideur après traumatisme (éliminer une fracture ou une luxation méconnue).',
      'Contexte néoplasique ou infectieux.',
      'Douleur thoracique associée irradiant vers l’épaule.'
    ],
    management: [
      'Phase douloureuse : antalgie, mobilisations douces infra-douloureuses, éducation.',
      'Phase raide : gain d’amplitude progressif, étirements prolongés, travail actif aidé.',
      'Phase de récupération : renforcement et reprise fonctionnelle complète.',
      'Coordination avec le médecin pour les infiltrations en phase hyperalgique.'
    ],
    keyFacts: [
      'Informer sur la durée d’évolution évite le découragement et l’errance thérapeutique.',
      'Le dépistage du diabète est recommandé devant une capsulite spontanée.'
    ],
    evidence: 'Preuve modérée : combinaison mobilisations + exercices + éducation.'
  },
  {
    id: 'pat-05',
    slug: 'epicondylalgie-laterale',
    name: 'Épicondylalgie latérale',
    region: 'coude',
    specialty: 'musculosquelettique',
    aliases: ['tennis elbow', 'épicondylite', 'مرفق التنس'],
    summary: 'Douleur de l’épicondyle latéral d’origine tendineuse (extenseurs du poignet), déclenchée par la préhension et les mouvements répétés.',
    epidemiology: 'Incidence de 1 à 3 % par an ; pic entre 35 et 54 ans, souvent chez des travailleurs manuels.',
    presentation: [
      'Douleur à la palpation de l’épicondyle latéral.',
      'Douleur à la préhension, au serrage de main, au port de charge.',
      'Douleur à l’extension résistée du poignet et du 3e doigt.'
    ],
    redFlags: [
      'Douleur cervicale ou radiculopathie C6-C7 associée.',
      'Instabilité du coude, blocage articulaire.',
      'Signes inflammatoires locaux marqués.'
    ],
    management: [
      'Exercices excentriques et isométriques progressifs des extenseurs.',
      'Gestion de la charge : adaptation du geste professionnel et sportif.',
      'Orthèse de contre-appui en phase douloureuse, temporairement.',
      'Éviter le repos strict prolongé et les injections répétées de corticoïdes.'
    ],
    keyFacts: [
      'Le pronostic est favorable à 12 mois dans la majorité des cas, mais les récidives sont fréquentes sans travail de charge.',
      'Le PRTEE (Patient-Rated Tennis Elbow Evaluation) est l’auto-questionnaire de référence.'
    ],
    evidence: 'Preuve modérée pour le renforcement progressif et l’éducation à la charge.'
  },
  {
    id: 'pat-06',
    slug: 'reconstruction-lca',
    name: 'Reconstruction du ligament croisé antérieur',
    region: 'genou',
    specialty: 'sport',
    aliases: ['LCA', 'ACL', 'ligamentoplastie', 'الرباط الصليبي الأمامي'],
    i18n: { en: { name: 'ACL reconstruction rehabilitation' }, ar: { name: 'إعادة بناء الرباط الصليبي الأمامي' } },
    summary: 'Rééducation post-opératoire structurée par critères, du contrôle de l’épanchement au retour au sport, sur 9 à 12 mois.',
    epidemiology: 'Environ 70 par 100 000 habitants et par an ; forte prévalence dans les sports de pivot (football, handball, ski).',
    presentation: [
      'Phase précoce : épanchement, déficit d’extension, sidération du quadriceps.',
      'Phase intermédiaire : déficit de force et d’endurance, appréhension.',
      'Phase tardive : déficits de puissance, de vitesse et de qualité du saut.'
    ],
    redFlags: [
      'Signes de thrombose veineuse profonde (mollet douloureux, œdème unilatéral).',
      'Fièvre, écoulement ou rougeur de cicatrice : suspicion d’infection.',
      'Blocage articulaire vrai : suspicion de lésion méniscale associée ou de cyclope.'
    ],
    management: [
      'Objectifs par critères plutôt que par délais : extension complète, absence d’épanchement, contrôle du quadriceps.',
      'Renforcement progressif chaîne fermée puis ouverte, travail du membre controlatéral inclus.',
      'Réathlétisation : pliométrie, changements de direction, réintégration progressive du sport.',
      'Décision de retour au sport sur batterie de tests (force, hop tests, qualité du mouvement) et non sur le seul délai.'
    ],
    keyFacts: [
      'Un déficit de force du quadriceps supérieur à 10 % augmente le risque de nouvelle lésion.',
      'Le retour au sport avant 9 mois multiplie le risque de récidive.',
      'Les scores IKDC et ACL-RSI complètent l’évaluation physique.'
    ],
    evidence: 'Preuve élevée pour la progression basée sur critères et les tests de retour au sport.'
  },
  {
    id: 'pat-07',
    slug: 'tendinopathie-patellaire',
    name: 'Tendinopathie patellaire',
    region: 'genou',
    specialty: 'sport',
    aliases: ['jumper’s knee', 'tendinopathie rotulienne', 'اعتلال وتر الرضفة'],
    i18n: { en: { name: 'Patellar tendinopathy' } },
    summary: 'Douleur de la pointe de la rotule liée à une surcharge des activités de saut, très sensible à la gestion de la charge d’entraînement.',
    epidemiology: 'Jusqu’à 45 % des volleyeurs et 30 % des basketteurs de haut niveau au cours de leur carrière.',
    presentation: [
      'Douleur localisée au pôle inférieur de la rotule, augmentant avec la charge de saut.',
      'Douleur au décours de l’effort et à la mise en tension du tendon.',
      'Test du squat sur plan incliné positif.'
    ],
    redFlags: [
      'Douleur diffuse ou nocturne inexpliquée.',
      'Chez l’adolescent : penser à Sinding-Larsen-Johansson ou Osgood-Schlatter.',
      'Impotence brutale : suspicion de rupture tendineuse.'
    ],
    management: [
      'Isométriques antalgiques puis renforcement lourd et lent (heavy slow resistance).',
      'Réduction temporaire du volume de saut, sans arrêt complet.',
      'Progression vers l’énergie élastique et la pliométrie.',
      'Suivi de la douleur à 24 h comme indicateur de tolérance à la charge.'
    ],
    keyFacts: [
      'Le score VISA-P quantifie la sévérité et suit l’évolution.',
      'Le repos complet diminue la capacité du tendon : la charge adaptée est le traitement.'
    ],
    evidence: 'Preuve élevée pour le renforcement progressif en charge.'
  },
  {
    id: 'pat-08',
    slug: 'gonarthrose',
    name: 'Gonarthrose',
    region: 'genou',
    specialty: 'rhumatologie',
    aliases: ['arthrose du genou', 'knee osteoarthritis', 'خشونة الركبة'],
    summary: 'Arthrose fémoro-tibiale et/ou fémoro-patellaire responsable de douleur, de raideur et d’une limitation fonctionnelle progressive.',
    epidemiology: 'Concerne environ 10 % des plus de 55 ans ; première cause de handicap locomoteur du sujet âgé.',
    presentation: [
      'Douleur mécanique à la marche, à la montée et descente des escaliers.',
      'Dérouillage matinal court, craquements.',
      'Amyotrophie du quadriceps, périmètre de marche réduit.'
    ],
    redFlags: [
      'Genou chaud, rouge, très douloureux avec fièvre : suspicion d’arthrite septique.',
      'Douleur nocturne intense inexpliquée.',
      'Blocage vrai récent.'
    ],
    management: [
      'Exercice thérapeutique supervisé : renforcement et aérobie, en première intention.',
      'Éducation, gestion du poids, adaptation des activités.',
      'Programmes combinés supervisés puis autonomie à domicile.',
      'Préparation pré-opératoire si arthroplastie envisagée.'
    ],
    keyFacts: [
      'L’exercice réduit la douleur avec un effet comparable aux antalgiques usuels.',
      'Le WOMAC et le KOOS documentent l’évolution fonctionnelle.',
      'Le test des 30 secondes assis-debout est simple et reproductible en cabinet.'
    ],
    evidence: 'Preuve élevée pour l’exercice et l’éducation (recommandations internationales).'
  },
  {
    id: 'pat-09',
    slug: 'entorse-laterale-cheville',
    name: 'Entorse latérale de cheville',
    region: 'cheville',
    specialty: 'sport',
    aliases: ['entorse de cheville', 'ankle sprain', 'التواء الكاحل'],
    summary: 'Lésion du complexe ligamentaire latéral en inversion, la plus fréquente des lésions sportives, avec risque élevé d’instabilité chronique si la rééducation est incomplète.',
    epidemiology: 'Environ 1 entorse pour 10 000 personnes par jour ; jusqu’à 40 % évoluent vers une instabilité chronique.',
    presentation: [
      'Douleur et œdème latéral, ecchymose retardée.',
      'Appui douloureux, boiterie.',
      'Déficit proprioceptif et appréhension au terrain instable.'
    ],
    redFlags: [
      'Critères d’Ottawa positifs : radiographie nécessaire pour éliminer une fracture.',
      'Douleur du 5e métatarsien, de la malléole postérieure ou du naviculaire.',
      'Impossibilité totale d’appui après 4 pas.'
    ],
    management: [
      'Protection, charge adaptée, glace, compression, élévation en phase initiale.',
      'Mobilisation précoce et récupération de la flexion dorsale.',
      'Rééducation proprioceptive et neuromusculaire progressive.',
      'Prévention des récidives : exercices d’équilibre au long cours, éventuel strapping en reprise sportive.'
    ],
    keyFacts: [
      'L’immobilisation prolongée retarde la reprise sans bénéfice.',
      'Le travail proprioceptif réduit d’environ 40 % le risque de récidive.',
      'Le score CAIT dépiste l’instabilité chronique.'
    ],
    evidence: 'Preuve élevée pour la mobilisation précoce et l’entraînement neuromusculaire.'
  },
  {
    id: 'pat-10',
    slug: 'tendinopathie-achilleenne',
    name: 'Tendinopathie achilléenne',
    region: 'cheville',
    specialty: 'sport',
    aliases: ['tendon d’Achille', 'achilles tendinopathy', 'اعتلال وتر العرقوب'],
    summary: 'Douleur du tendon calcanéen, corporéale ou insertionnelle, liée à une surcharge mécanique, très fréquente chez le coureur.',
    epidemiology: 'Jusqu’à 9 % des coureurs récréatifs par an ; pic entre 30 et 50 ans.',
    presentation: [
      'Douleur et épaississement du tendon, raideur matinale caractéristique.',
      'Douleur à la mise en charge répétée (course, sauts, montées).',
      'Douleur à la palpation pincée du tendon.'
    ],
    redFlags: [
      'Encoche palpable et impotence brutale : suspicion de rupture (test de Thompson).',
      'Prise récente de fluoroquinolones.',
      'Douleur bilatérale spontanée chez le sujet jeune : penser aux spondyloarthrites.'
    ],
    management: [
      'Isométriques antalgiques, puis excentriques et renforcement lourd et lent.',
      'Adaptation du volume de course et du terrain.',
      'Travail du triceps sural en amplitude complète, progression vers le saut.',
      'Formes insertionnelles : limiter la flexion dorsale extrême en début de programme.'
    ],
    keyFacts: [
      'Le score VISA-A suit l’évolution clinique.',
      'La progression est guidée par la douleur à 24 h après la séance.'
    ],
    evidence: 'Preuve élevée pour les programmes de charge progressive.'
  },
  {
    id: 'pat-11',
    slug: 'avc-hemiplegie',
    name: 'AVC — hémiplégie de l’adulte',
    region: 'global',
    specialty: 'neurologie',
    aliases: ['accident vasculaire cérébral', 'stroke', 'hémiparésie', 'الجلطة الدماغية'],
    i18n: { en: { name: 'Stroke — adult hemiplegia' }, ar: { name: 'الجلطة الدماغية — الفالج النصفي' } },
    summary: 'Déficit neurologique focal d’origine vasculaire ; la rééducation intensive et précoce, orientée vers la tâche, conditionne la récupération fonctionnelle.',
    epidemiology: 'Première cause de handicap acquis de l’adulte ; environ 15 millions d’AVC par an dans le monde.',
    presentation: [
      'Hémiparésie ou hémiplégie, troubles du tonus (spasticité).',
      'Troubles de l’équilibre et de la marche, risque de chute élevé.',
      'Troubles sensitifs, négligence spatiale unilatérale possible.',
      'Retentissement sur les activités de la vie quotidienne et la participation.'
    ],
    redFlags: [
      'Aggravation neurologique brutale : urgence médicale.',
      'Signes de thrombose veineuse profonde ou d’embolie pulmonaire.',
      'Épaule douloureuse hémiplégique avec subluxation.',
      'Fausses routes et signes de pneumopathie d’inhalation.'
    ],
    management: [
      'Rééducation intensive, répétée et orientée vers la tâche.',
      'Travail de l’équilibre assis puis debout, transferts, reprise de la marche.',
      'Prévention des complications : épaule, rétractions, escarres, chutes.',
      'Approche interdisciplinaire et éducation de l’entourage.'
    ],
    keyFacts: [
      'La quantité de pratique est un déterminant majeur de la récupération.',
      'L’échelle de Berg et le Timed Up and Go objectivent le risque de chute.',
      'L’échelle d’Ashworth modifiée documente la spasticité.'
    ],
    evidence: 'Preuve élevée pour la rééducation intensive orientée tâche.'
  },
  {
    id: 'pat-12',
    slug: 'bpco',
    name: 'BPCO — réhabilitation respiratoire',
    region: 'thorax',
    specialty: 'cardioresp',
    aliases: ['bronchopneumopathie chronique obstructive', 'COPD', 'الانسداد الرئوي المزمن'],
    summary: 'Maladie respiratoire chronique obstructive ; la réhabilitation associant réentraînement à l’effort et éducation améliore la dyspnée, la capacité d’effort et la qualité de vie.',
    epidemiology: 'Environ 10 % des adultes de plus de 40 ans ; troisième cause de mortalité dans le monde.',
    presentation: [
      'Dyspnée d’effort progressive, toux et expectoration chroniques.',
      'Déconditionnement musculaire périphérique.',
      'Exacerbations, anxiété et spirale de sédentarité.'
    ],
    redFlags: [
      'Désaturation profonde à l’effort ou au repos.',
      'Exacerbation aiguë : majoration de la dyspnée, modification des expectorations.',
      'Douleur thoracique, hémoptysie, œdèmes des membres inférieurs.'
    ],
    management: [
      'Réentraînement à l’effort en endurance et en résistance, intensité individualisée.',
      'Techniques de désencombrement adaptées et contrôle du souffle.',
      'Éducation : gestion des exacerbations, sevrage tabagique, observance.',
      'Suivi par test de marche de 6 minutes et échelle de dyspnée.'
    ],
    keyFacts: [
      'La réhabilitation respiratoire est l’intervention non médicamenteuse la plus efficace sur la dyspnée.',
      'Le test de marche de 6 minutes et l’échelle de Borg guident l’intensité.'
    ],
    evidence: 'Preuve élevée (recommandations internationales de réhabilitation respiratoire).'
  },
  {
    id: 'pat-13',
    slug: 'coxarthrose',
    name: 'Coxarthrose',
    region: 'hanche',
    specialty: 'rhumatologie',
    aliases: ['arthrose de hanche', 'hip osteoarthritis', 'خشونة الورك'],
    i18n: { en: { name: 'Hip osteoarthritis' } },
    summary: 'Arthrose de l’articulation coxo-fémorale associant douleur inguinale, perte de mobilité et limitation de la marche. L’exercice supervisé et l’éducation constituent le traitement de première intention, avant toute discussion chirurgicale.',
    epidemiology: 'Concerne environ 10 % des personnes de plus de 60 ans, avec une prédominance féminine après 65 ans. Deuxième localisation arthrosique la plus invalidante après le genou.',
    presentation: [
      'Douleur inguinale mécanique, parfois projetée à la face antérieure de cuisse ou au genou.',
      'Limitation des amplitudes prédominant en rotation interne et en flexion.',
      'Dérouillage matinal court, généralement inférieur à 30 minutes.',
      'Boiterie d’esquive, périmètre de marche réduit, difficulté à enfiler chaussures et chaussettes.'
    ],
    redFlags: [
      'Douleur inguinale nocturne intense chez un sujet jeune : évoquer une ostéonécrose de la tête fémorale.',
      'Contexte de corticothérapie, d’alcoolisme ou de drépanocytose (facteurs d’ostéonécrose).',
      'Hanche chaude et douloureuse avec fièvre : suspicion d’arthrite septique, urgence médicale.',
      'Douleur d’apparition brutale après un effort inhabituel chez le coureur : fracture de fatigue du col fémoral.'
    ],
    management: [
      'Exercice thérapeutique supervisé en première intention : renforcement des abducteurs et extenseurs de hanche, travail aérobie.',
      'Éducation : compréhension de la maladie, adaptation des activités, gestion du poids.',
      'Thérapie manuelle et travail de mobilité en complément des exercices actifs.',
      'Aides techniques (canne du côté opposé) pour préserver le périmètre de marche.',
      'Préparation pré-opératoire si une arthroplastie est envisagée : la force pré-opératoire conditionne la récupération.'
    ],
    keyFacts: [
      'La triade douleur inguinale, limitation de rotation interne et raideur matinale courte orient fortement le diagnostic.',
      'Les scores HOOS et WOMAC documentent l’évolution fonctionnelle.',
      'Le test des 30 secondes assis-debout est reproductible et sensible au changement.'
    ],
    evidence: 'Preuve élevée pour l’exercice et l’éducation (recommandations internationales sur l’arthrose).'
  },
  {
    id: 'pat-14',
    slug: 'syndrome-douloureux-femoro-patellaire',
    name: 'Syndrome douloureux fémoro-patellaire',
    region: 'genou',
    specialty: 'sport',
    aliases: ['SDFP', 'syndrome rotulien', 'patellofemoral pain', 'ألم المفصل الرضفي الفخذي'],
    i18n: { en: { name: 'Patellofemoral pain syndrome' } },
    summary: 'Douleur péri- ou rétro-patellaire déclenchée par les activités en charge du genou fléchi (squat, escaliers, course, station assise prolongée), sans lésion structurelle identifiable.',
    epidemiology: 'Un des motifs de consultation les plus fréquents du genou : prévalence annuelle proche de 23 % chez l’adulte et de 29 % chez l’adolescent, avec une nette prédominance féminine.',
    presentation: [
      'Douleur diffuse péri-patellaire, difficile à localiser précisément par le patient.',
      'Reproduction à l’accroupissement, à la montée et à la descente d’escaliers, à la course.',
      'Douleur à la station assise prolongée (« signe du cinéma »).',
      'Déficit fréquent de force des extenseurs de genou et des abducteurs de hanche.'
    ],
    redFlags: [
      'Épanchement articulaire important : évoquer une autre cause intra-articulaire (lésion méniscale, ostéochondrale).',
      'Chez l’adolescent en croissance : Osgood-Schlatter, Sinding-Larsen-Johansson, ostéochondrite.',
      'Douleur nocturne permanente, altération de l’état général : bilan médical nécessaire.',
      'Instabilité vraie avec épisodes de luxation rotulienne : avis spécialisé.'
    ],
    management: [
      'Exercices combinés genou et hanche : c’est l’intervention au meilleur niveau de preuve.',
      'Éducation à la charge : réduire temporairement les activités provocantes sans arrêter l’activité physique.',
      'Progression sur 12 semaines minimum, la récupération étant plus lente que ne l’anticipent les patients.',
      'Orthèses plantaires, taping et thérapie manuelle en adjuvants de courte durée, jamais isolés.',
      'Ne pas fonder l’explication sur un « défaut d’alignement » : le lien avec la morphologie est faible.'
    ],
    keyFacts: [
      'Le score de Kujala (AKPS) est l’auto-questionnaire de référence.',
      'Le renforcement de la hanche associé au genou est supérieur au renforcement du genou seul.',
      'Un tiers des patients reste symptomatique à un an si la charge n’est pas travaillée.'
    ],
    evidence: 'Preuve élevée pour l’exercice combiné (consensus international sur le SDFP).'
  },
  {
    id: 'pat-15',
    slug: 'syndrome-canal-carpien',
    name: 'Syndrome du canal carpien',
    region: 'poignet',
    specialty: 'musculosquelettique',
    aliases: ['compression du nerf médian', 'carpal tunnel syndrome', 'نفق الرسغ'],
    i18n: { en: { name: 'Carpal tunnel syndrome' } },
    summary: 'Neuropathie compressive du nerf médian au poignet, première cause de syndrome canalaire. Les paresthésies nocturnes en sont le signe le plus évocateur.',
    epidemiology: 'Prévalence de 3 à 5 % de la population adulte. Facteurs associés : gestes répétitifs, grossesse, diabète, hypothyroïdie, obésité.',
    presentation: [
      'Paresthésies et douleurs du territoire médian (pouce, index, majeur, moitié radiale de l’annulaire).',
      'Réveils nocturnes avec besoin de secouer la main pour être soulagé.',
      'Maladresse fine, chute d’objets, difficulté au vissage et au boutonnage.',
      'Amyotrophie de l’éminence thénar dans les formes évoluées.'
    ],
    redFlags: [
      'Déficit moteur ou amyotrophie thénarienne : avis chirurgical sans délai (atteinte axonale).',
      'Symptômes bilatéraux avec cervicalgie : éliminer une radiculopathie C6-C7 ou une double compression.',
      'Signes médullaires (maladresse bilatérale, troubles de l’équilibre) : myélopathie cervicale.',
      'Œdème, rougeur, douleur disproportionnée : évoquer un syndrome douloureux régional complexe.'
    ],
    management: [
      'Attelle nocturne de poignet en position neutre : traitement conservateur de référence.',
      'Mobilisations neurodynamiques du nerf médian et exercices de glissement tendineux.',
      'Éducation et adaptation ergonomique du geste professionnel.',
      'Coordination médicale pour infiltration ou chirurgie dans les formes sévères ou résistantes.',
      'Rééducation post-opératoire : cicatrice, glissement nerveux, reprise progressive de la force de préhension.'
    ],
    keyFacts: [
      'Le questionnaire de Boston (BCTQ) quantifie sévérité et retentissement fonctionnel.',
      'Les tests de Phalen et de Tinel ont une valeur diagnostique modérée : ils complètent l’anamnèse, ils ne la remplacent pas.',
      'L’attelle nocturne obtient de meilleurs résultats à 4 semaines que l’absence de traitement.'
    ],
    evidence: 'Preuve modérée à élevée pour l’attelle nocturne et les techniques neurodynamiques.'
  },
  {
    id: 'pat-16',
    slug: 'lombosciatique-hernie-discale',
    name: 'Lombosciatique par hernie discale',
    region: 'rachis',
    specialty: 'musculosquelettique',
    aliases: ['sciatique', 'radiculalgie L5 S1', 'sciatica', 'عرق النسا'],
    i18n: { en: { name: 'Sciatica / lumbar radiculopathy' } },
    summary: 'Douleur radiculaire du membre inférieur liée à un conflit disco-radiculaire. L’évolution est spontanément favorable dans la majorité des cas, la rééducation accompagnant la reprise fonctionnelle.',
    epidemiology: 'Touche 13 à 40 % de la population au cours de la vie. Environ 75 % des patients s’améliorent nettement en 12 semaines sans chirurgie.',
    presentation: [
      'Douleur irradiant dans un territoire radiculaire précis, souvent plus intense que la douleur lombaire.',
      'Aggravation à la toux, à l’éternuement, à la position assise prolongée.',
      'Signe de Lasègue (élévation de la jambe tendue) reproduisant la douleur radiculaire.',
      'Déficit sensitif, moteur ou réflexe possible selon la racine atteinte.'
    ],
    redFlags: [
      'Syndrome de la queue de cheval : anesthésie en selle, troubles sphinctériens, déficit bilatéral — urgence chirurgicale.',
      'Déficit moteur progressif ou paralysie (pied tombant) : avis urgent.',
      'Douleur non mécanique avec fièvre, perte de poids, antécédent néoplasique.',
      'Traumatisme significatif ou ostéoporose sévère.'
    ],
    management: [
      'Information et réassurance sur l’évolution naturelle favorable.',
      'Maintien de l’activité, éviter le repos strict ; adaptation temporaire des postures assises.',
      'Exercices progressifs de contrôle moteur, de mobilité et de renforcement, en respectant l’irritabilité.',
      'Techniques neurodynamiques prudentes, arrêtées si majoration des symptômes distaux.',
      'Coordination médicale pour l’antalgie ; chirurgie discutée en cas de déficit progressif ou de douleur réfractaire.'
    ],
    keyFacts: [
      'Le Lasègue est sensible mais peu spécifique : il n’identifie pas le niveau atteint.',
      'L’imagerie n’est pas systématique : des hernies asymptomatiques sont fréquentes.',
      'La centralisation des symptômes lors de l’examen est un signe de bon pronostic.'
    ],
    evidence: 'Preuve modérée pour l’exercice et l’éducation ; preuve élevée sur le pronostic spontanément favorable.'
  },
  {
    id: 'pat-17',
    slug: 'instabilite-glenohumerale',
    name: 'Instabilité gléno-humérale',
    region: 'epaule',
    specialty: 'sport',
    aliases: ['luxation d’épaule', 'shoulder instability', 'Bankart', 'خلع الكتف'],
    i18n: { en: { name: 'Glenohumeral instability' } },
    summary: 'Perte de la stabilité de l’articulation gléno-humérale, le plus souvent après une luxation antérieure traumatique. Le risque de récidive dépend fortement de l’âge au premier épisode.',
    epidemiology: 'Incidence des luxations gléno-humérales estimée à 24 pour 100 000 personnes-années. Le taux de récidive atteint 70 à 90 % chez les sportifs de moins de 20 ans.',
    presentation: [
      'Antécédent de luxation ou de subluxation, souvent en armé du bras (abduction-rotation externe).',
      'Appréhension et perte de confiance dans les positions à risque.',
      'Test d’appréhension et manœuvre de recentrage positifs.',
      'Déficit de force des rotateurs et du contrôle scapulaire.'
    ],
    redFlags: [
      'Luxation non réduite : urgence orthopédique.',
      'Déficit sensitif du moignon de l’épaule ou déficit du deltoïde : atteinte du nerf axillaire.',
      'Première luxation après 40 ans : rechercher une rupture associée de la coiffe des rotateurs.',
      'Fracture associée (glène, tête humérale) : imagerie avant toute mobilisation.'
    ],
    management: [
      'Immobilisation courte antalgique, puis mobilisation précoce dans les amplitudes sûres.',
      'Renforcement progressif des rotateurs et des stabilisateurs de la scapula.',
      'Travail du contrôle neuromusculaire, d’abord en position basse puis en position d’armé.',
      'Progression fonctionnelle vers les gestes sportifs ou professionnels spécifiques.',
      'Avis chirurgical en cas de récidives, de lésion osseuse ou de sport de contact chez le sujet jeune.'
    ],
    keyFacts: [
      'Le score WOSI évalue spécifiquement le retentissement de l’instabilité.',
      'L’âge au premier épisode est le facteur pronostique de récidive le plus solide.',
      'La rééducation seule donne de bons résultats chez les instabilités non traumatiques.'
    ],
    evidence: 'Preuve modérée pour la rééducation neuromusculaire ; preuve élevée sur le risque de récidive lié à l’âge.'
  },
  {
    id: 'pat-18',
    slug: 'fasciopathie-plantaire',
    name: 'Fasciopathie plantaire',
    region: 'cheville',
    specialty: 'musculosquelettique',
    aliases: ['aponévrosite plantaire', 'fasciite plantaire', 'plantar fasciopathy', 'التهاب اللفافة الأخمصية'],
    i18n: { en: { name: 'Plantar fasciopathy' } },
    summary: 'Douleur du talon d’origine fasciale, caractérisée par une douleur maximale aux premiers pas du matin. L’évolution est longue mais favorable avec une charge progressive.',
    epidemiology: 'Environ 10 % de la population présente un épisode au cours de la vie. Fréquente chez le coureur comme chez le sujet sédentaire en surcharge pondérale.',
    presentation: [
      'Douleur du talon médial aux premiers pas du matin ou après une station assise prolongée.',
      'Douleur à la palpation de la tubérosité calcanéenne médiale.',
      'Test du treuil (windlass) positif : douleur à l’extension passive des orteils en charge.',
      'Amélioration après quelques minutes de marche, puis réapparition en fin de journée.'
    ],
    redFlags: [
      'Douleur diffuse du talon après augmentation brutale de charge : fracture de fatigue du calcanéum.',
      'Paresthésies plantaires : syndrome du tunnel tarsien.',
      'Talalgies bilatérales chez un sujet jeune avec raideur matinale prolongée : spondyloarthrite.',
      'Douleur après corticothérapie locale répétée : risque de rupture fasciale.'
    ],
    management: [
      'Renforcement progressif en charge des fléchisseurs plantaires et des muscles intrinsèques du pied.',
      'Étirements du fascia plantaire et du triceps sural.',
      'Gestion de la charge : volume de marche et de course, chaussage, poids corporel.',
      'Orthèses plantaires ou talonnettes en soulagement temporaire.',
      'Informer sur la durée d’évolution (souvent 6 à 18 mois) pour éviter l’errance thérapeutique.'
    ],
    keyFacts: [
      'L’« épine calcanéenne » radiologique n’est pas la cause de la douleur.',
      'Le FAAM et le FHSQ documentent le retentissement fonctionnel.',
      'Le renforcement en charge donne de meilleurs résultats à 3 mois que les étirements seuls.'
    ],
    evidence: 'Preuve modérée pour le renforcement progressif et les étirements spécifiques.'
  },
  {
    id: 'pat-19',
    slug: 'lesion-ischio-jambiers',
    name: 'Lésion des ischio-jambiers',
    region: 'cuisse',
    specialty: 'sport',
    aliases: ['claquage', 'hamstring injury', 'déchirure ischio-jambiers', 'إصابة العضلات الخلفية للفخذ'],
    i18n: { en: { name: 'Hamstring strain injury' } },
    summary: 'Lésion musculaire aiguë de la loge postérieure de cuisse, blessure la plus fréquente des sports de sprint. Le taux de récidive élevé impose une rééducation complète et des critères de retour au sport explicites.',
    epidemiology: 'Représente 12 à 17 % des blessures en football. Le taux de récidive atteint 12 à 33 %, majoritairement dans les deux mois suivant la reprise.',
    presentation: [
      'Douleur brutale postérieure de cuisse pendant un sprint ou un étirement (fente, tir).',
      'Douleur à la palpation du corps musculaire ou de la jonction myo-tendineuse.',
      'Déficit de force en contraction excentrique et à l’extension active du genou.',
      'Ecchymose retardée possible dans les lésions étendues.'
    ],
    redFlags: [
      'Douleur ischiatique haute avec sensation d’arrachement et ecchymose extensive : avulsion tendineuse proximale, avis chirurgical.',
      'Paresthésies ou irradiation dans le membre : atteinte du nerf sciatique ou origine lombaire.',
      'Impotence totale avec encoche palpable : lésion de haut grade.',
      'Douleur postérieure de cuisse sans mécanisme traumatique : envisager une origine lombo-pelvienne.'
    ],
    management: [
      'Charge précoce et progressive dès que la douleur le permet : l’immobilisation retarde la reprise.',
      'Travail excentrique progressif (protocole de type Askling, exercice nordique) au cœur du programme.',
      'Réintroduction graduée de la course, puis du sprint et des changements de direction.',
      'Critères de retour au sport : force excentrique symétrique, absence de douleur à la palpation et aux tests, sprint à pleine vitesse maîtrisé.',
      'Prévention primaire et secondaire par exercice nordique intégré à l’entraînement.'
    ],
    keyFacts: [
      'L’exercice nordique réduit d’environ la moitié le risque de lésion des ischio-jambiers.',
      'Une reprise fondée sur le seul délai expose fortement à la récidive.',
      'La force excentrique et la souplesse doivent être réévaluées avant la reprise en compétition.'
    ],
    evidence: 'Preuve élevée pour l’exercice excentrique en prévention et en rééducation.'
  },
  {
    id: 'pat-20',
    slug: 'prothese-totale-hanche',
    name: 'Prothèse totale de hanche',
    region: 'hanche',
    specialty: 'rhumatologie',
    aliases: ['arthroplastie de hanche', 'PTH', 'total hip arthroplasty', 'مفصل الورك الصناعي'],
    i18n: { en: { name: 'Total hip arthroplasty rehabilitation' } },
    summary: 'Rééducation après arthroplastie totale de hanche : autonomie précoce, restauration de la force des abducteurs et retour aux activités, en tenant compte de la voie d’abord chirurgicale.',
    epidemiology: 'Plus d’un million d’arthroplasties de hanche sont réalisées chaque année dans le monde, indication principale : la coxarthrose évoluée.',
    presentation: [
      'Phase immédiate : douleur post-opératoire, œdème, appréhension à la mise en charge.',
      'Déficit marqué des abducteurs de hanche et boiterie de Trendelenburg.',
      'Amplitudes limitées, en particulier en flexion et en rotation.',
      'Endurance de marche réduite, souvent aggravée par le déconditionnement pré-opératoire.'
    ],
    redFlags: [
      'Douleur brutale avec raccourcissement et rotation du membre : suspicion de luxation de prothèse, urgence.',
      'Mollet douloureux, œdème unilatéral, dyspnée : thrombose veineuse profonde ou embolie pulmonaire.',
      'Fièvre, écoulement, rougeur de cicatrice : infection du site opératoire.',
      'Douleur de cuisse persistante à la mise en charge à distance : évoquer un descellement.'
    ],
    management: [
      'Lever et marche dès le premier jour post-opératoire avec aides techniques, selon protocole de récupération améliorée.',
      'Éducation aux positions à risque selon la voie d’abord (voie postérieure : éviter l’association flexion au-delà de 90°, adduction et rotation interne).',
      'Renforcement progressif des abducteurs, extenseurs et quadriceps.',
      'Travail de la marche, sevrage progressif des aides, escaliers, équilibre.',
      'Reprise des activités entre 6 et 12 semaines selon la chirurgie et la récupération ; activités à impact discutées avec le chirurgien.'
    ],
    keyFacts: [
      'La force pré-opératoire est un déterminant majeur de la récupération : la préparation compte.',
      'Les scores HOOS et Harris (HHS) servent de référence de suivi.',
      'Les programmes supervisés améliorent la force et la vitesse de marche par rapport aux consignes seules.'
    ],
    evidence: 'Preuve modérée à élevée pour la mobilisation précoce et le renforcement progressif.'
  },
  {
    id: 'pat-21',
    slug: 'sclerose-en-plaques',
    name: 'Sclérose en plaques',
    region: 'global',
    specialty: 'neurologie',
    aliases: ['SEP', 'multiple sclerosis', 'التصلب المتعدد'],
    i18n: { en: { name: 'Multiple sclerosis' } },
    summary: 'Maladie inflammatoire démyélinisante du système nerveux central, évoluant par poussées ou de façon progressive. L’activité physique adaptée améliore la marche, l’équilibre et la fatigue sans provoquer de poussées.',
    epidemiology: 'Environ 2,8 millions de personnes concernées dans le monde, avec un début typique entre 20 et 40 ans et une prédominance féminine.',
    presentation: [
      'Fatigue invalidante, présente chez près de 80 % des patients.',
      'Troubles de la marche et de l’équilibre, risque de chute augmenté.',
      'Spasticité, faiblesse, troubles sensitifs et de la coordination.',
      'Sensibilité à la chaleur (phénomène d’Uhthoff) majorant transitoirement les symptômes.'
    ],
    redFlags: [
      'Aggravation neurologique installée depuis plus de 24 à 48 heures : suspicion de poussée, avis neurologique.',
      'Fièvre ou infection urinaire : peut majorer les symptômes, à traiter avant d’intensifier la rééducation.',
      'Chutes répétées avec traumatisme : réévaluer aides techniques et environnement.',
      'Troubles de la déglutition ou dysarthrie d’aggravation rapide.'
    ],
    management: [
      'Entraînement aérobie et renforcement progressif : sûrs, sans risque de poussée, avec bénéfices sur la fatigue.',
      'Travail de l’équilibre et de la marche orienté vers la tâche, en double tâche si pertinent.',
      'Gestion de la fatigue : fractionnement de l’effort, priorisation des activités, gestion de la chaleur (séances en environnement frais).',
      'Éducation à l’autogestion et maintien de l’activité au long cours.',
      'Adaptation des aides techniques et de l’environnement à l’évolution.'
    ],
    keyFacts: [
      'L’exercice ne déclenche pas de poussées : ce message fait partie du traitement.',
      'L’échelle de sévérité de la fatigue (FSS) et le test de marche de 25 pieds (T25FW) suivent l’évolution.',
      'La chaleur majore transitoirement les symptômes sans aggraver la maladie.'
    ],
    evidence: 'Preuve élevée pour l’exercice aérobie et le renforcement ; preuve modérée pour l’entraînement de l’équilibre.'
  },
  {
    id: 'pat-22',
    slug: 'paralysie-cerebrale',
    name: 'Paralysie cérébrale de l’enfant',
    region: 'global',
    specialty: 'pediatrie',
    aliases: ['infirmité motrice cérébrale', 'cerebral palsy', 'الشلل الدماغي'],
    i18n: { en: { name: 'Cerebral palsy' } },
    summary: 'Trouble permanent du développement du mouvement et de la posture consécutif à une atteinte cérébrale non progressive survenue tôt. La rééducation vise la participation et l’autonomie, par des interventions actives orientées vers des objectifs.',
    epidemiology: 'Cause la plus fréquente de handicap moteur de l’enfant : 2 à 3 naissances vivantes pour 1 000. La prématurité est le principal facteur de risque.',
    presentation: [
      'Troubles du tonus (spasticité le plus souvent) et du contrôle moteur sélectif.',
      'Retard ou atypie des acquisitions motrices, asymétrie persistante.',
      'Niveau fonctionnel classé de I à V par la GMFCS, qui structure le pronostic et les objectifs.',
      'Complications secondaires : rétractions, déformations osseuses, douleurs, fatigabilité.'
    ],
    redFlags: [
      'Régression motrice : une paralysie cérébrale n’est pas évolutive, reconsidérer le diagnostic.',
      'Douleur de hanche ou perte d’abduction : dépistage de l’excentration ou de la luxation de hanche.',
      'Scoliose d’aggravation rapide, surtout chez les niveaux GMFCS IV-V.',
      'Troubles de déglutition, pneumopathies à répétition, cassure de la courbe de poids.'
    ],
    management: [
      'Interventions actives orientées vers des objectifs concrets choisis avec l’enfant et la famille.',
      'Entraînement à la tâche et pratique intensive plutôt que techniques passives isolées.',
      'Prévention des rétractions et surveillance orthopédique programmée (hanches, rachis, pieds).',
      'Guidance parentale et transposition des exercices dans le quotidien.',
      'Coordination pluridisciplinaire : médecine physique, orthopédie, orthophonie, ergothérapie, appareillage.'
    ],
    keyFacts: [
      'La GMFCS est stable dans le temps et sert de référence pronostique.',
      'Les interventions actives orientées vers la tâche ont le meilleur niveau de preuve.',
      'La surveillance systématique des hanches réduit le risque de luxation.'
    ],
    evidence: 'Preuve élevée pour l’entraînement actif orienté vers la tâche et le renforcement.'
  },
  {
    id: 'pat-23',
    slug: 'incontinence-urinaire-effort',
    name: 'Incontinence urinaire d’effort',
    region: 'global',
    specialty: 'perineologie',
    aliases: ['fuites urinaires à l’effort', 'stress urinary incontinence', 'سلس البول الإجهادي'],
    i18n: { en: { name: 'Stress urinary incontinence' } },
    summary: 'Fuite involontaire d’urine lors d’un effort, d’une toux ou d’un éternuement, liée à un défaut de soutien urétral et de commande périnéale. La rééducation périnéale supervisée est le traitement de première intention.',
    epidemiology: 'Concerne 25 à 45 % des femmes au cours de la vie, avec des pics après l’accouchement et à la ménopause. Fréquente aussi chez la sportive et après chirurgie prostatique chez l’homme.',
    presentation: [
      'Fuites lors de la toux, du rire, du port de charge, du saut ou de la course.',
      'Absence d’urgenturie associée dans la forme pure d’effort.',
      'Difficulté fréquente à percevoir et à contracter volontairement le plancher pelvien.',
      'Retentissement social et sportif souvent sous-déclaré par les patientes.'
    ],
    redFlags: [
      'Hématurie, douleur pelvienne ou fièvre : bilan médical avant toute rééducation.',
      'Infection urinaire récidivante : traiter en amont.',
      'Symptômes neurologiques associés (troubles sensitifs périnéaux, rétention) : avis spécialisé.',
      'Prolapsus symptomatique ou incontinence persistante au-delà de trois mois post-partum : avis médical.'
    ],
    management: [
      'Apprentissage de la contraction périnéale correcte, avec vérification (sans jamais s’en tenir aux consignes verbales seules).',
      'Renforcement progressif du plancher pelvien, supervisé, sur au moins 12 semaines.',
      'Automatisation par le verrouillage périnéal avant l’effort (« the knack »).',
      'Intégration au tronc et à la respiration, puis transfert vers les activités sportives.',
      'Éducation : hydratation, transit, gestion des efforts, éviter les auto-interruptions du jet.'
    ],
    keyFacts: [
      'La rééducation supervisée est plus efficace qu’un programme laissé en autonomie.',
      'L’ICIQ-UI SF quantifie la sévérité et la gêne perçue.',
      'Trois séances hebdomadaires de contractions bien exécutées suffisent à obtenir un effet mesurable.'
    ],
    evidence: 'Preuve élevée (revues systématiques sur la rééducation du plancher pelvien).'
  },
  {
    id: 'pat-24',
    slug: 'maladie-de-parkinson',
    name: 'Maladie de Parkinson',
    region: 'global',
    specialty: 'neurologie',
    aliases: ['syndrome parkinsonien', 'Parkinson disease', 'داء باركنسون'],
    i18n: { en: { name: 'Parkinson’s disease' }, ar: { name: 'داء باركنسون' } },
    summary: 'Maladie neurodégénérative associant bradykinésie, rigidité, tremblement de repos et, plus tardivement, instabilité posturale. L’entraînement intensif et l’indiçage externe améliorent durablement la marche et l’équilibre.',
    epidemiology: 'Deuxième maladie neurodégénérative après la maladie d’Alzheimer : environ 1 % des personnes de plus de 60 ans, avec une incidence en augmentation.',
    presentation: [
      'Bradykinésie : lenteur et diminution d’amplitude des mouvements, marche à petits pas.',
      'Rigidité, tremblement de repos, perte du ballant du bras.',
      'Enrayage cinétique (freezing) au démarrage, dans les passages étroits et lors des demi-tours.',
      'Instabilité posturale et chutes à un stade plus avancé, fatigue et fluctuations liées au traitement.'
    ],
    redFlags: [
      'Chutes précoces et absence de réponse au traitement dopaminergique : évoquer un syndrome parkinsonien atypique.',
      'Hypotension orthostatique symptomatique : adapter les changements de position et alerter le médecin.',
      'Aggravation brutale : rechercher une cause intercurrente (infection, iatrogénie, modification de traitement).',
      'Troubles de déglutition ou perte de poids : orientation pluridisciplinaire.'
    ],
    management: [
      'Entraînement intensif et de forte amplitude, orienté vers la tâche, avec un volume suffisant pour induire un apprentissage.',
      'Indiçage externe (rythmique auditif, repères visuels au sol) pour la marche et le franchissement du freezing.',
      'Travail de l’équilibre, des transferts et des demi-tours, avec prévention des chutes.',
      'Activité physique aérobie régulière, poursuivie au long cours.',
      'Séances programmées pendant les phases « on » du traitement pour maximiser l’efficacité.'
    ],
    keyFacts: [
      'La quantité et l’intensité de la pratique conditionnent le bénéfice : les séances passives n’apportent rien.',
      'L’indiçage rythmique améliore immédiatement la longueur de pas et la vitesse de marche.',
      'Le Mini-BESTest et le questionnaire de freezing (FOG-Q) suivent l’évolution.'
    ],
    evidence: 'Preuve élevée pour l’exercice, l’entraînement de la marche et l’indiçage externe.'
  },
  {
    id: 'pat-25',
    slug: 'vertige-positionnel-paroxystique-benin',
    name: 'Vertige positionnel paroxystique bénin',
    region: 'tete',
    specialty: 'vestibulaire',
    aliases: ['VPPB', 'vertige de position', 'BPPV', 'دوار الوضعة الحميد'],
    i18n: { en: { name: 'Benign paroxysmal positional vertigo' } },
    summary: 'Vertige rotatoire bref déclenché par les changements de position de la tête, lié au déplacement d’otoconies dans un canal semi-circulaire. Une manœuvre de repositionnement bien conduite suffit le plus souvent.',
    epidemiology: 'Cause la plus fréquente de vertige périphérique : prévalence sur la vie estimée à 2,4 %, avec un pic après 50 ans et une prédominance féminine.',
    presentation: [
      'Vertige rotatoire intense de moins d’une minute, déclenché par le coucher, le retournement dans le lit ou l’extension cervicale.',
      'Absence de signe auditif (ni surdité ni acouphène) dans la forme typique.',
      'Nystagmus positionnel avec latence, crescendo-decrescendo et épuisement à la répétition.',
      'Instabilité résiduelle et appréhension des mouvements de tête pendant quelques jours.'
    ],
    redFlags: [
      'Nystagmus vertical pur, non fatigable ou sans latence : origine centrale à explorer.',
      'Vertige avec céphalée brutale, diplopie, dysarthrie, ataxie ou déficit sensitivomoteur : urgence neurovasculaire.',
      'Surdité brutale ou acouphène récent associé : avis ORL rapide.',
      'Traumatisme cervical récent ou suspicion d’insuffisance vertébro-basilaire : adapter ou renoncer aux manœuvres.'
    ],
    management: [
      'Identifier le canal atteint par les manœuvres diagnostiques (Dix-Hallpike, test de rotation en décubitus).',
      'Réaliser la manœuvre de repositionnement adaptée (Epley pour le canal postérieur).',
      'Réévaluer à la séance suivante ; répéter la manœuvre si le test reste positif.',
      'Exercices d’habituation et de stabilisation du regard en cas d’instabilité résiduelle.',
      'Rassurer : le caractère bénin et l’efficacité du traitement font partie de la prise en charge.'
    ],
    keyFacts: [
      'Une à deux manœuvres de repositionnement suffisent dans la grande majorité des cas.',
      'Le diagnostic est clinique : aucune imagerie n’est nécessaire dans la forme typique.',
      'Les récidives sont fréquentes : apprendre au patient à reconnaître les symptômes.'
    ],
    evidence: 'Preuve élevée pour les manœuvres de repositionnement (recommandations internationales).'
  },
  {
    id: 'pat-26',
    slug: 'prothese-totale-genou',
    name: 'Prothèse totale de genou',
    region: 'genou',
    specialty: 'rhumatologie',
    aliases: ['arthroplastie du genou', 'PTG', 'total knee arthroplasty', 'مفصل الركبة الصناعي'],
    i18n: { en: { name: 'Total knee arthroplasty rehabilitation' } },
    summary: 'Rééducation après arthroplastie totale de genou : lutte contre l’œdème et le déficit d’extension, récupération de la flexion et restauration de la force du quadriceps.',
    epidemiology: 'Intervention parmi les plus fréquentes en chirurgie orthopédique, en forte croissance ; indication principale : la gonarthrose évoluée.',
    presentation: [
      'Œdème et douleur post-opératoires, sidération du quadriceps.',
      'Déficit d’extension active et passive, flexion limitée dans les premières semaines.',
      'Boiterie, difficulté aux escaliers et aux transferts.',
      'Déconditionnement fréquent lié aux mois de limitation pré-opératoire.'
    ],
    redFlags: [
      'Mollet douloureux, œdème unilatéral, dyspnée : suspicion de thrombose veineuse profonde ou d’embolie pulmonaire.',
      'Fièvre, écoulement ou rougeur de cicatrice : infection du site opératoire.',
      'Flexion inférieure à 90° à six semaines ou déficit d’extension persistant : avis chirurgical (raideur).',
      'Instabilité franche ou douleur mécanique brutale : avis spécialisé.'
    ],
    management: [
      'Contrôle de l’œdème et récupération prioritaire de l’extension complète.',
      'Mobilisation précoce et travail actif de la flexion, objectif de 110 à 120° à trois mois.',
      'Renforcement progressif du quadriceps et des fessiers, en chaîne fermée puis ouverte.',
      'Réentraînement à la marche, escaliers, équilibre et endurance.',
      'Reprise des activités à faible impact (marche, vélo, natation) ; impacts discutés avec le chirurgien.'
    ],
    keyFacts: [
      'Le déficit d’extension est plus invalidant que le déficit de flexion : le traiter en premier.',
      'Les scores KOOS et Oxford Knee Score documentent la récupération perçue.',
      'La force du quadriceps reste souvent déficitaire à un an sans renforcement structuré.'
    ],
    evidence: 'Preuve modérée à élevée pour la rééducation supervisée et le renforcement progressif.'
  },
  {
    id: 'pat-27',
    slug: 'lesion-meniscale',
    name: 'Lésion méniscale',
    region: 'genou',
    specialty: 'sport',
    aliases: ['déchirure du ménisque', 'meniscal tear', 'ménisectomie', 'تمزق الغضروف الهلالي'],
    i18n: { en: { name: 'Meniscal tear' } },
    summary: 'Lésion du ménisque, traumatique chez le sujet jeune ou dégénérative après 40 ans. Dans les formes dégénératives, l’exercice donne des résultats comparables à la chirurgie.',
    epidemiology: 'Lésion intra-articulaire du genou la plus fréquente. Les lésions dégénératives sont très répandues après 50 ans, souvent asymptomatiques.',
    presentation: [
      'Douleur mécanique de l’interligne, parfois accompagnée d’épanchement récidivant.',
      'Sensation d’accrochage, de pseudo-blocage, gêne à l’accroupissement et aux rotations.',
      'Forme traumatique : mécanisme en rotation genou fléchi, douleur d’apparition brutale.',
      'Forme dégénérative : installation progressive, souvent associée à une arthrose débutante.'
    ],
    redFlags: [
      'Blocage vrai en flexion avec impossibilité d’extension complète : suspicion d’anse de seau, avis chirurgical.',
      'Genou chaud et fébrile : éliminer une arthrite septique.',
      'Instabilité associée : rechercher une lésion ligamentaire (LCA).',
      'Épanchement massif immédiat post-traumatique : bilan lésionnel complet.'
    ],
    management: [
      'Lésions dégénératives : exercice supervisé en première intention, la chirurgie n’apportant pas de bénéfice supplémentaire.',
      'Renforcement du quadriceps et des fessiers, travail du contrôle en rotation.',
      'Éducation sur la fréquence des lésions asymptomatiques à l’imagerie.',
      'Formes traumatiques réparables du sujet jeune : coordination chirurgicale, puis protocole post-opératoire adapté.',
      'Après ménisectomie : reprise progressive, surveillance de l’évolution arthrosique.'
    ],
    keyFacts: [
      'Dans les lésions dégénératives, l’exercice égale la ménisectomie à deux ans.',
      'Un ménisque anormal à l’IRM n’explique pas nécessairement la douleur.',
      'Le KOOS suit le retentissement fonctionnel.'
    ],
    evidence: 'Preuve élevée pour l’exercice dans les lésions dégénératives (essais randomisés).'
  },
  {
    id: 'pat-28',
    slug: 'stenose-lombaire',
    name: 'Sténose lombaire',
    region: 'rachis',
    specialty: 'rhumatologie',
    aliases: ['canal lombaire étroit', 'claudication neurogène', 'lumbar spinal stenosis', 'تضيق القناة الفقرية'],
    i18n: { en: { name: 'Lumbar spinal stenosis' } },
    summary: 'Réduction du calibre du canal lombaire responsable d’une claudication neurogène : douleurs et lourdeurs des membres inférieurs à la marche, soulagées par la flexion du tronc et l’assise.',
    epidemiology: 'Première cause de chirurgie rachidienne après 65 ans. La prévalence radiologique augmente avec l’âge, sans corrélation stricte avec les symptômes.',
    presentation: [
      'Périmètre de marche limité, avec lourdeur, paresthésies ou faiblesse des membres inférieurs.',
      'Soulagement caractéristique en position assise ou penchée en avant (signe du caddie).',
      'Symptômes souvent bilatéraux, majorés en extension et en descente.',
      'Examen neurologique parfois normal au repos.'
    ],
    redFlags: [
      'Syndrome de la queue de cheval : troubles sphinctériens, anesthésie en selle — urgence.',
      'Déficit moteur progressif : avis chirurgical rapide.',
      'Claudication à l’effort avec abolition des pouls périphériques : évoquer une origine artérielle.',
      'Douleur nocturne permanente, fièvre, perte de poids : bilan médical.'
    ],
    management: [
      'Éducation et adaptation des activités : fractionner la marche, utiliser les positions soulageantes.',
      'Exercices en flexion tolérée, renforcement global, travail de l’endurance à la marche (tapis avec appui, vélo).',
      'Renforcement des membres inférieurs et travail de l’équilibre pour prévenir les chutes.',
      'Programme supervisé sur 8 à 12 semaines avant d’envisager la chirurgie dans les formes non déficitaires.',
      'Coordination médicale pour l’antalgie et la décision chirurgicale.'
    ],
    keyFacts: [
      'Le périmètre de marche est l’indicateur de suivi le plus parlant pour le patient.',
      'L’imagerie ne détermine pas à elle seule l’indication chirurgicale.',
      'Le vélo est souvent bien toléré alors que la marche est limitée : à exploiter pour l’endurance.'
    ],
    evidence: 'Preuve modérée pour l’exercice et l’éducation dans les formes non déficitaires.'
  },
  {
    id: 'pat-29',
    slug: 'spondyloarthrite-axiale',
    name: 'Spondyloarthrite axiale',
    region: 'rachis',
    specialty: 'rhumatologie',
    aliases: ['spondylarthrite ankylosante', 'axial spondyloarthritis', 'التهاب الفقار المحوري'],
    i18n: { en: { name: 'Axial spondyloarthritis' } },
    summary: 'Rhumatisme inflammatoire chronique du rachis et des articulations sacro-iliaques. L’exercice régulier est la pierre angulaire de la prise en charge non médicamenteuse.',
    epidemiology: 'Prévalence estimée entre 0,3 et 0,5 % de la population. Début typique avant 45 ans, souvent avec un retard diagnostique de plusieurs années.',
    presentation: [
      'Rachialgie de type inflammatoire : raideur matinale de plus de 30 minutes, amélioration par l’exercice, réveils en deuxième partie de nuit.',
      'Douleurs fessières à bascule, atteintes enthésopathiques (talon, grand trochanter).',
      'Perte progressive de mobilité rachidienne et d’ampliation thoracique.',
      'Manifestations extra-articulaires possibles : uvéite, psoriasis, maladie inflammatoire de l’intestin.'
    ],
    redFlags: [
      'Uvéite, dactylite, psoriasis ou troubles digestifs inflammatoires : orientation rhumatologique.',
      'Rachis ankylosé et traumatisme, même mineur : risque élevé de fracture vertébrale.',
      'Poussée inflammatoire majeure : adapter l’intensité et coordonner avec le rhumatologue.',
      'Douleur thoracique nouvelle : éliminer une cause cardiovasculaire.'
    ],
    management: [
      'Programme d’exercices quotidien : mobilité rachidienne, ampliation thoracique, renforcement postural.',
      'Éducation à l’auto-prise en charge et à la régularité, déterminante sur le long cours.',
      'Activité physique aérobie adaptée, poursuivie même en période calme.',
      'Travail respiratoire et de mobilité costale.',
      'Coordination avec le traitement médical, y compris sous biothérapie.'
    ],
    keyFacts: [
      'La régularité de l’exercice compte davantage que son intensité.',
      'Les indices BASDAI et BASFI documentent activité et fonction.',
      'La mesure de l’ampliation thoracique et l’indice de Schöber suivent l’enraidissement.'
    ],
    evidence: 'Preuve élevée pour l’exercice régulier (recommandations ASAS-EULAR).'
  },
  {
    id: 'pat-30',
    slug: 'insuffisance-cardiaque-chronique',
    name: 'Insuffisance cardiaque chronique',
    region: 'thorax',
    specialty: 'cardioresp',
    aliases: ['réadaptation cardiaque', 'chronic heart failure', 'قصور القلب المزمن'],
    i18n: { en: { name: 'Chronic heart failure' } },
    summary: 'Incapacité du cœur à assurer un débit adapté aux besoins. Le réentraînement à l’effort supervisé améliore la capacité fonctionnelle et la qualité de vie et réduit les hospitalisations.',
    epidemiology: 'Concerne 1 à 2 % de la population adulte et plus de 10 % après 70 ans. Première cause d’hospitalisation après 65 ans dans de nombreux pays.',
    presentation: [
      'Dyspnée d’effort, fatigue, intolérance à l’exercice classées de I à IV selon la NYHA.',
      'Œdèmes des membres inférieurs, prise de poids rapide en cas de décompensation.',
      'Déconditionnement musculaire périphérique majeur, souvent supérieur à l’atteinte cardiaque.',
      'Anxiété et évitement de l’effort fréquents.'
    ],
    redFlags: [
      'Prise de poids de plus de 2 kg en trois jours, orthopnée, œdèmes croissants : décompensation, avis médical.',
      'Douleur thoracique, syncope, palpitations soutenues à l’effort : arrêt immédiat de la séance.',
      'Fréquence cardiaque de repos inhabituellement élevée ou hypotension symptomatique.',
      'Insuffisance cardiaque non stabilisée : le réentraînement est différé.'
    ],
    management: [
      'Réentraînement en endurance à intensité individualisée, en continu ou en fractionné, sur cœur stabilisé.',
      'Renforcement musculaire périphérique à charge modérée et répétitions contrôlées.',
      'Éducation : surveillance du poids, reconnaissance des signes de décompensation, observance, sel et hydratation.',
      'Surveillance de séance : fréquence cardiaque, échelle de Borg, symptômes, tension artérielle.',
      'Coordination étroite avec le cardiologue et le médecin traitant.'
    ],
    keyFacts: [
      'La réadaptation à l’effort réduit les hospitalisations et améliore la qualité de vie.',
      'Le test de marche de 6 minutes et l’échelle de Borg guident la prescription.',
      'La classification NYHA structure les objectifs et l’intensité.'
    ],
    evidence: 'Preuve élevée (revues systématiques sur la réadaptation à l’effort dans l’insuffisance cardiaque).'
  },
  {
    id: 'pat-31',
    slug: 'fracture-extremite-superieure-femur',
    name: 'Fracture de l’extrémité supérieure du fémur',
    region: 'hanche',
    specialty: 'geriatrie',
    aliases: ['fracture du col du fémur', 'hip fracture', 'كسر عنق الفخذ'],
    i18n: { en: { name: 'Hip fracture in older adults' } },
    summary: 'Fracture de la hanche du sujet âgé, événement à fort retentissement fonctionnel et vital. La mise en charge précoce et un programme de rééducation intensif conditionnent le retour à l’autonomie.',
    epidemiology: 'Plusieurs millions de cas par an dans le monde. Mortalité de 20 à 30 % à un an et perte d’autonomie durable chez près de la moitié des patients.',
    presentation: [
      'Douleur inguinale et impossibilité d’appui après une chute de faible énergie.',
      'Après chirurgie : déficit majeur de force, appréhension à la mise en charge, œdème.',
      'Déconditionnement rapide, risque de syndrome de glissement.',
      'Antécédents fréquents de chutes et de fragilité osseuse.'
    ],
    redFlags: [
      'Confusion aiguë post-opératoire : rechercher un délirium, une infection, une douleur non contrôlée.',
      'Mollet douloureux, dyspnée : thrombose veineuse profonde ou embolie pulmonaire.',
      'Douleur inguinale persistante à la mise en charge : défaut de consolidation ou complication du matériel.',
      'Fièvre, écoulement de cicatrice : infection.'
    ],
    management: [
      'Mise en charge et verticalisation précoces, dès l’autorisation chirurgicale.',
      'Rééducation intensive et quotidienne : transferts, marche, escaliers, équilibre.',
      'Renforcement progressif des membres inférieurs, poursuivi plusieurs mois après la sortie.',
      'Prévention secondaire des chutes et évaluation du domicile.',
      'Coordination : traitement de l’ostéoporose, apports protéiques et vitamine D, révision des médicaments.'
    ],
    keyFacts: [
      'La rééducation prolongée au-delà de la sortie d’hospitalisation améliore la récupération fonctionnelle.',
      'La prévention de la deuxième fracture est un objectif à part entière.',
      'Les tests SPPB, TUG et vitesse de marche documentent la récupération.'
    ],
    evidence: 'Preuve élevée pour la mobilisation précoce et les programmes intensifs prolongés.'
  },
  {
    id: 'pat-32',
    slug: 'scoliose-idiopathique-adolescent',
    name: 'Scoliose idiopathique de l’adolescent',
    region: 'rachis',
    specialty: 'pediatrie',
    aliases: ['scoliose', 'adolescent idiopathic scoliosis', 'الجنف الشبابي'],
    i18n: { en: { name: 'Adolescent idiopathic scoliosis' } },
    summary: 'Déformation tridimensionnelle du rachis apparaissant à l’adolescence. Le risque d’aggravation dépend de l’angle et du potentiel de croissance restant ; les exercices spécifiques et le corset visent à le limiter.',
    epidemiology: 'Prévalence de 2 à 3 % chez les adolescents pour un angle de Cobb supérieur ou égal à 10°, avec une nette prédominance féminine pour les courbures évolutives.',
    presentation: [
      'Asymétrie du tronc, gibbosité visible au test de flexion antérieure.',
      'Asymétrie des épaules, des flancs et du bassin.',
      'Douleur souvent absente ou modérée ; le motif de consultation est fréquemment esthétique.',
      'Évolutivité maximale pendant le pic de croissance pubertaire.'
    ],
    redFlags: [
      'Douleur nocturne, raideur marquée ou signes neurologiques : imagerie complémentaire nécessaire.',
      'Courbure thoracique gauche atypique : évoquer une cause secondaire.',
      'Aggravation rapide en quelques mois : avis chirurgical spécialisé.',
      'Signes cutanés du rachis (touffe de poils, angiome, fossette) : suspicion de dysraphie.'
    ],
    management: [
      'Dépistage et surveillance régulière pendant la croissance (test de flexion antérieure, scoliomètre).',
      'Exercices spécifiques de correction posturale tridimensionnelle et d’auto-agrandissement.',
      'Renforcement et travail de la stabilité du tronc, entretien de la mobilité.',
      'Corset selon l’angle et le potentiel de croissance, en coordination avec le spécialiste : la rééducation en accompagne le port.',
      'Éducation de l’adolescent et de la famille : observance, image du corps, poursuite du sport.'
    ],
    keyFacts: [
      'Une rotation du tronc de 5 à 7° au scoliomètre justifie une radiographie.',
      'Les exercices spécifiques réduisent le risque d’aggravation par rapport à l’absence de traitement.',
      'Le sport n’est pas contre-indiqué : il doit être encouragé.'
    ],
    evidence: 'Preuve modérée pour les exercices spécifiques ; preuve élevée pour l’efficacité du corset dans les courbures à risque.'
  },
  {
    id: 'pat-33',
    slug: 'lymphoedeme-apres-cancer-du-sein',
    name: 'Lymphœdème après cancer du sein',
    region: 'epaule',
    specialty: 'oncologie',
    aliases: ['gros bras', 'lymphœdème du membre supérieur', 'breast cancer related lymphoedema', 'الوذمة اللمفية'],
    i18n: { en: { name: 'Breast cancer related lymphoedema' } },
    summary: 'Accumulation de liquide interstitiel riche en protéines dans le membre supérieur après traitement du cancer du sein. La prise en charge décongestive complète associe compression, exercice et soins de peau.',
    epidemiology: 'Survient chez environ 20 % des patientes après curage axillaire ; le risque augmente avec la radiothérapie, l’obésité et le nombre de ganglions prélevés.',
    presentation: [
      'Augmentation de volume du membre supérieur, sensation de lourdeur et de tension.',
      'Diminution de la souplesse cutanée, empreinte au doigt (signe du godet) aux stades initiaux.',
      'Limitation de la mobilité de l’épaule et gêne fonctionnelle au quotidien.',
      'Retentissement psychologique et sur l’image corporelle souvent important.'
    ],
    redFlags: [
      'Rougeur, chaleur, fièvre : érysipèle ou lymphangite — urgence médicale, antibiothérapie.',
      'Augmentation brutale de volume avec douleur : éliminer une thrombose veineuse.',
      'Apparition ou aggravation inexpliquée : évoquer une récidive tumorale et alerter l’oncologue.',
      'Douleur neuropathique majeure : évaluer une atteinte plexique post-radique.'
    ],
    management: [
      'Prise en charge décongestive complète : drainage lymphatique manuel, compression (bandages puis manchon), exercices sous compression, soins de peau.',
      'Exercice résistif progressif du membre supérieur : sûr et bénéfique, contrairement aux anciennes recommandations d’épargne.',
      'Récupération de la mobilité de l’épaule et prévention de la capsulite.',
      'Éducation : soins cutanés, prévention des plaies et des infections, gestion du poids.',
      'Surveillance volumétrique régulière pour objectiver l’effet du traitement.'
    ],
    keyFacts: [
      'Le renforcement progressif ne provoque pas l’aggravation du lymphœdème : ce message lève un évitement fréquent.',
      'La compression est le pilier du maintien des résultats.',
      'La mesure circonférentielle standardisée permet un suivi simple et reproductible.'
    ],
    evidence: 'Preuve élevée pour la compression et l’exercice résistif progressif.'
  },
  {
    id: 'pat-34',
    slug: 'paralysie-faciale-peripherique',
    name: 'Paralysie faciale périphérique',
    region: 'tete',
    specialty: 'neurologie',
    aliases: ['paralysie de Bell', 'paralysie faciale a frigore', 'Bell palsy', 'شلل الوجه النصفي'],
    i18n: { en: { name: 'Peripheral facial palsy' } },
    summary: 'Atteinte du nerf facial responsable d’un déficit moteur de l’hémiface. La rééducation neuromusculaire faciale accompagne la récupération et prévient les séquelles de type syncinésies.',
    epidemiology: 'Incidence de 20 à 30 cas pour 100 000 habitants et par an. Récupération complète spontanée dans environ 70 % des formes idiopathiques.',
    presentation: [
      'Asymétrie faciale au repos et à la mimique, atteinte des territoires supérieur et inférieur.',
      'Impossibilité de fermer complètement l’œil, effacement du pli nasogénien.',
      'Troubles associés possibles : hyperacousie, altération du goût, sécheresse oculaire.',
      'À distance : syncinésies, contractures, spasmes chez une minorité de patients.'
    ],
    redFlags: [
      'Atteinte bilatérale ou d’autres nerfs crâniens : bilan neurologique urgent.',
      'Vésicules dans la conque ou le conduit auditif : zona du ganglion géniculé.',
      'Otite, traumatisme crânien ou masse parotidienne : cause secondaire à explorer.',
      'Absence de récupération à trois ou quatre mois : imagerie et avis spécialisé.',
      'Atteinte de la fermeture oculaire : protection cornéenne indispensable, avis ophtalmologique.'
    ],
    management: [
      'Éducation et protection oculaire (larmes artificielles, occlusion nocturne) en coordination médicale.',
      'Rééducation neuromusculaire faciale : travail analytique devant miroir, exercices de faible intensité et de grande précision.',
      'Éviter les contractions maximales et l’électrostimulation intempestive, qui favorisent les syncinésies.',
      'Travail de la symétrie et des mimiques fonctionnelles (parole, alimentation, expression).',
      'Prise en charge des syncinésies installées par rééducation spécifique, en lien avec les traitements médicaux.'
    ],
    keyFacts: [
      'La qualité et la précision du geste importent plus que la force dans la rééducation faciale.',
      'L’échelle de House-Brackmann gradue la sévérité et suit l’évolution.',
      'La protection de l’œil est une priorité absolue tant que la fermeture est incomplète.'
    ],
    evidence: 'Preuve modérée pour la rééducation neuromusculaire faciale, notamment sur la prévention des syncinésies.'
  },
  {
    id: 'pat-35',
    slug: 'syndrome-femoro-acetabulaire',
    name: 'Syndrome fémoro-acétabulaire',
    region: 'hanche',
    specialty: 'sport',
    aliases: ['conflit de hanche', 'FAI syndrome', 'came et pince', 'اصطدام الورك'],
    i18n: { en: { name: 'Femoroacetabular impingement syndrome' } },
    summary: 'Douleur inguinale du sujet jeune et sportif associant symptômes, signes cliniques et morphologie osseuse particulière de la hanche. L’exercice et l’éducation constituent la première intention.',
    epidemiology: 'Cause fréquente de douleur inguinale chez le sportif jeune, en particulier dans les sports de pivot et de contact. Les morphologies came et pince sont fréquentes chez des sujets asymptomatiques.',
    presentation: [
      'Douleur inguinale profonde, majorée en flexion, adduction et rotation interne.',
      'Douleur à la station assise prolongée et lors des mouvements de pivot.',
      'Test de conflit antérieur (flexion-adduction-rotation interne) reproduisant la douleur.',
      'Déficit de force des abducteurs et des rotateurs, limitation de la rotation interne.'
    ],
    redFlags: [
      'Douleur inguinale nocturne inexpliquée : évoquer une ostéonécrose ou une fracture de fatigue.',
      'Antécédent de corticothérapie ou de drépanocytose : risque d’ostéonécrose.',
      'Douleur abdomino-pelvienne associée : envisager une cause viscérale ou gynécologique.',
      'Boiterie fébrile : éliminer une infection.'
    ],
    management: [
      'Éducation et adaptation de la charge sportive, en particulier des amplitudes provocantes.',
      'Renforcement progressif des abducteurs, extenseurs et rotateurs de hanche.',
      'Travail du contrôle lombo-pelvien et de la technique de mouvement en pivot.',
      'Progression vers les gestes spécifiques du sport pratiqué.',
      'Avis chirurgical discuté après un programme conservateur bien conduit de trois mois minimum.'
    ],
    keyFacts: [
      'La morphologie osseuse seule ne fait pas le diagnostic : symptômes et signes cliniques sont indispensables.',
      'Le score HAGOS est adapté à la hanche du sportif.',
      'Un programme conservateur structuré évite une part des interventions chirurgicales.'
    ],
    evidence: 'Preuve modérée pour l’exercice et l’éducation (consensus de Warwick).'
  }
];
