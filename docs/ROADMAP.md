# Limites connues et suite du développement

## 1. Limites de la version livrée

Elles sont énoncées sans détour : ce qui suit n'est pas implémenté ou l'est de
façon volontairement partielle.

### Persistance

- Comptes, favoris, progression, certificats et modifications de contenu sont
  stockés dans le **navigateur** (`localStorage`), pas sur un serveur. Aucune
  synchronisation entre appareils, aucun partage entre visiteurs.
- L'administration modifie les contenus localement : les ajouts ne sont visibles
  que par la personne qui les a créés.

### Authentification

- Le hachage PBKDF2-SHA-256 (150 000 itérations, sel par compte) s'exécute côté
  client : c'est correct pour une démonstration hors ligne, ce n'est pas un
  substitut à un hachage serveur Argon2id.
- La vérification d'e-mail et la réinitialisation de mot de passe sont
  **simulées** (aucun e-mail n'est envoyé, aucun jeton n'est consommé).
- Pas de limitation de débit ni de double authentification.

### Contenus

- Les fichiers PDF, DOCX et vidéos réels **n'existent pas**. « Télécharger »
  génère un document mis en page à partir du contenu réel de la fiche et ouvre
  l'aperçu d'impression du navigateur (« Enregistrer au format PDF »). C'est
  fonctionnel et honnête, mais ce n'est pas le fichier officiel.
- Le lecteur vidéo est une zone de lecture symbolique : aucun flux n'est diffusé.
- Les liens de webinaires (`liveUrl`, `replayUrl`) sont fictifs.
- Le contenu scientifique est réaliste, rédigé avec ses références, mais il doit
  être **relu et validé par l'équipe éditoriale** avant toute publication.

### Quiz

- La correction se fait côté client : les réponses correctes sont présentes dans
  `src/data/courses.ts`. Acceptable pour de l'auto-évaluation, insuffisant pour un
  examen certifiant. Le schéma prévoit déjà la correction serveur
  (`QuizAnswer.isCorrect` non exposé, `POST /api/quiz/:id/attempt`).

### Autres

- Le certificat est un document imprimable sans signature numérique ni page de
  vérification publique.
- Les statistiques d'administration comptent les événements du navigateur local.
- Aucun paiement : les entités `Plan` / `Subscription` existent, rien n'est branché.
- Le logo est un placeholder ; les couleurs sont relevées sur le logo fourni et
  doivent être confirmées par la charte officielle.
- Pas de tests automatisés (la validation a été faite manuellement dans le
  navigateur : 33 routes, 3 langues, 5 largeurs d'écran, parcours d'inscription,
  de progression et d'administration).

## 2. Étapes suivantes, par ordre de valeur

### Étape 1 — décisions à prendre (avant tout code)

1. **Charte graphique officielle** : codes hexadécimaux exacts, fichier logo
   vectoriel, police de marque le cas échéant.
2. **Sous-domaine** : `academie.kinedokdz.com` confirmé ?
3. **Périmètre gratuit / payant** : quels contenus resteront libres ?
4. **Contenus réels** : qui fournit les PDF, qui valide scientifiquement, sous
   quelle licence (les questionnaires validés — EIFEL, KOOS, WOMAC, SPADI… — ont
   des conditions d'usage et de diffusion à vérifier avant mise en ligne).
5. **Authentification partagée** avec le site principal KINEDOK : souhaitée dès
   maintenant, ou plus tard ?

### Étape 2 — passage au back-end (2 à 3 semaines)

1. Initialiser Next.js + Tailwind + next-intl (commandes dans
   [`ARCHITECTURE.md`](ARCHITECTURE.md) § 8).
2. Appliquer `db/schema.prisma` ou `db/supabase.sql`, exécuter le seed depuis
   `src/data/*.ts`.
3. Brancher Supabase Auth (ou route handlers) sur l'API `KA.auth` existante.
4. Porter les pages publiques (SSR + `generateMetadata` pour le référencement).
5. Porter l'espace membre puis l'administration (validation Zod côté serveur).
6. Créer les buckets de stockage et les URL signées.

### Étape 3 — mise en production (1 semaine)

1. Import des contenus réels et des fichiers.
2. E-mails transactionnels : vérification d'adresse, réinitialisation, rappels de
   webinaires (24 h / 1 h), notification de nouveau contenu.
3. Correction serveur des quiz + page publique de vérification des certificats
   (`/certificats/[reference]`).
4. En-têtes de sécurité, limitation de débit, journalisation des erreurs.
5. Sauvegardes automatiques de la base.

### Étape 4 — après l'ouverture

- **Recherche** : index `tsvector` français + arabe, tolérance aux fautes de
  frappe (`pg_trgm`), suggestions.
- **Recommandations** : remplacer l'heuristique actuelle (profil + historique +
  pathologies consultées) par un modèle appuyé sur les données d'usage réelles.
- **Programmes d'exercices** : permettre au kinésithérapeute de composer un
  programme et de l'envoyer au patient (PDF ou lien) — la brique « Ajouter à un
  programme » est déjà prévue dans l'interface.
- **Espace formateur** : dépôt de contenus, suivi des inscrits, revenus.
- **Application mobile** : l'API et le modèle de données sont partagés avec
  l'écosystème KINEDOK ; une PWA (manifest + service worker) est l'étape
  intermédiaire la moins coûteuse, avec mise en cache hors ligne des fiches
  cliniques.
- **Offres payantes** : activer `Plan` / `Subscription`, codes promotionnels,
  accès institutionnel (écoles, cliniques).
- **Tests** : Vitest pour la logique (filtres, progression, recommandations),
  Playwright pour les parcours critiques dans les trois langues.

## 3. Dette technique identifiée

| Sujet | Impact | Action |
| --- | --- | --- |
| Correction des quiz côté client | Sécurité | Déplacer vers l'API à l'étape 2 |
| Statistiques dans le navigateur | Fiabilité | Table `AnalyticsEvent` à l'étape 2 |
| Contraintes `@@unique` sur colonnes nullables | Intégrité | Index partiels (DATABASE.md § 5) |
| Absence de tests | Régressions | Vitest + Playwright à l'étape 4 |
| Documents générés à l'impression | Qualité perçue | Remplacer par les PDF officiels |
| Logo placeholder | Image de marque | Fichier officiel (une substitution de fichier) |
