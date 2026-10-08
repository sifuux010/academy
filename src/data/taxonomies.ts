/* =====================================================================
   Taxonomies — vocabulaires contrôlés de la plateforme
   ---------------------------------------------------------------------
   Les clés (et non les libellés) sont stockées en base : les libellés
   viennent des dictionnaires i18n (taxonomies.*). En production ces
   listes correspondent aux tables de référence resource_categories,
   body_regions, specialties, levels… (cf. docs/DATABASE.md).
   ===================================================================== */

export const taxonomies = {

  resourceTypes: [
    'revue', 'article', 'litterature', 'protocole', 'therapeutique',
    'exercice', 'livre', 'ebook', 'guide', 'fiche', 'reco', 'pedagogique', 'resume'
  ],

  toolTypes: ['test', 'questionnaire', 'score', 'bilan'],

  levels: ['etudiant', 'debutant', 'intermediaire', 'avance', 'expert'],

  regions: [
    'rachis', 'epaule', 'coude', 'poignet', 'hanche', 'cuisse',
    'genou', 'cheville', 'tete', 'thorax', 'global'
  ],

  specialties: [
    'musculosquelettique', 'sport', 'neurologie', 'cardioresp',
    'pediatrie', 'geriatrie', 'rhumatologie', 'posturologie', 'perineologie',
    'oncologie', 'vestibulaire'
  ],

  languages: ['fr', 'en', 'ar'],

  formats: ['pdf', 'docx', 'video', 'xlsx', 'html'],

  difficulty: ['facile', 'modere', 'difficile'],

  objectives: [
    'mobilite', 'force', 'proprioception', 'controle',
    'etirement', 'endurance', 'antalgie'
  ],

  access: ['free', 'premium'],

  /* --- Listes de formulaires ---------------------------------------- */
  countries: [
    'Algérie', 'Maroc', 'Tunisie', 'France', 'Belgique', 'Suisse', 'Canada',
    'Égypte', 'Jordanie', 'Liban', 'Arabie saoudite', 'Émirats arabes unis',
    'Qatar', 'Mauritanie', 'Libye', 'Sénégal', 'Côte d’Ivoire', 'Autre'
  ],

  academicYears: ['1re année', '2e année', '3e année', '4e année', '5e année', 'Master', 'Doctorat'],

  profStatuses: [
    'Libéral / cabinet privé',
    'Salarié en clinique',
    'Hospitalier',
    'Centre de rééducation',
    'Kinésithérapie du sport / club',
    'Enseignant / formateur',
    'Recherche',
    'En recherche d’emploi'
  ],

  expertiseAreas: [
    'Musculo-squelettique', 'Sport', 'Neurologie', 'Cardio-respiratoire',
    'Pédiatrie', 'Gériatrie', 'Rhumatologie', 'Thérapie manuelle',
    'Rééducation post-opératoire', 'Périnéologie', 'Posturologie', 'Recherche clinique'
  ],

  spokenLanguages: ['Français', 'Arabe', 'Anglais', 'Tamazight', 'Espagnol', 'Turc'],

  /* Rôles applicatifs — l'autorisation s'appuie sur cette hiérarchie. */
  roles: ['STUDENT', 'PHYSIOTHERAPIST', 'INSTRUCTOR', 'CONTENT_EDITOR', 'ADMIN', 'SUPER_ADMIN'],

  /* Suggestions affichées sous la recherche globale (page d'accueil). */
  quickSearches: ['lombalgie', 'LCA', 'tendinopathie', 'épaule', 'AVC', 'gonarthrose', 'entorse de cheville']
};
