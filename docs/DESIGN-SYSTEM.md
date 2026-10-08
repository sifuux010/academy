# Design system — KINEDOK ACADÉMIE

Registre visuel visé : **médical, scientifique, sobre, professionnel**. Beaucoup
de blanc, une seule couleur d'accent, des ombres discrètes, aucune animation
décorative. L'objectif est que l'académie soit immédiatement reconnue comme une
extension officielle de KINEDOK, sans ressembler à un LMS générique.

## 1. Un seul point d'entrée : `src/styles/tokens.css`

Aucun composant ne code une couleur, un rayon ou une ombre en dur. Tout vient de
variables CSS. Remplacer les valeurs de ce fichier suffit à réaligner l'ensemble
du site.

### Couleurs de marque

| Token | Valeur livrée | Usage |
| --- | --- | --- |
| `--kinedok-primary` | `#23B8C7` | couleur d'action, liens, accents (turquoise du logo) |
| `--kinedok-primary-600` | `#1A9DAB` | survol |
| `--kinedok-primary-700` | `#14808C` | texte sur fond clair, liens |
| `--kinedok-primary-soft` | `#E6F7F9` | fonds de badges et de sections |
| `--kinedok-secondary` | `#34495E` | bleu ardoise du mot « Kine », pied de page |
| `--kinedok-accent` | `#0FB3A6` | accent secondaire |
| `--kinedok-text` | `#1F2D3A` | texte principal |
| `--kinedok-muted` | `#64748B` | texte secondaire |
| `--kinedok-border` | `#E2E8ED` | filets et bordures de cartes |
| `--kinedok-success` / `-warning` / `-danger` / `-live` | — | états, badge « en direct » |

> **Valeurs à confirmer.** Elles ont été relevées sur le logo KINEDOK fourni. Si
> la charte officielle indique d'autres codes hexadécimaux, remplacez-les dans ce
> seul fichier : aucun autre changement n'est requis.

### Échelles

- **Typographie** : `--text-xs` (12 px) → `--text-4xl` (46 px), police système
  (`Segoe UI`/Inter) et `--font-arabic` pour l'arabe. Aucune police distante :
  zéro requête réseau, zéro dépendance.
- **Espacement** : multiples de 4 px, `--space-1` (4) → `--space-20` (80).
- **Rayons** : `--radius-sm` 6 · `--radius-md` 10 · `--radius-lg` 14 ·
  `--radius-xl` 20 · `--radius-pill`.
- **Ombres** : `--shadow-xs` → `--shadow-lg`, volontairement basses en opacité.
- **Layout** : `--container-max` 1200 px (l'en-tête déborde à 1440 px),
  `--header-height` 68 px.

### Thème sombre

Les tokens sont redéfinis pour `@media (prefers-color-scheme: dark)` **et** pour
`:root[data-theme="dark"]`. Aucun composant n'a de règle spécifique au thème
sombre : la palette suffit.

## 2. Remplacer le logo

Le logo existe en **quatre variantes**, toutes monochromes turquoise — elles
fonctionnent donc sur fond clair comme sur fond sombre, sans version « dark » à
produire :

| Fichier | Ratio | Usage |
| --- | --- | --- |
| `kinedok-logo-compact.svg` | ~3,5 : 1 | en-tête (symbole + « Kinedok », sans baseline) |
| `kinedok-logo.svg` | ~3,7 : 1 | pied de page, documents imprimés (avec baseline) |
| `kinedok-logo-stacked.svg` | ~1 : 1 | pages de connexion et d'inscription, partages |
| `kinedok-mark.svg` | ~1 : 1 | symbole seul (favicon, petits usages) |

**Pour installer le fichier officiel**, déposez-le dans `public/brand/` sous le même
nom, en `.png` :

```text
public/brand/kinedok-logo-compact.png
public/brand/kinedok-logo.png
public/brand/kinedok-logo-stacked.png
public/brand/kinedok-mark.png
```

Aucune ligne de code à modifier : `detectOfficialLogos()` (dans `src/lib/brand.ts`,
appelé par `src/main.tsx`) teste leur présence au démarrage et bascule dessus ;
les `.svg` restent le repli pour les variantes non fournies. Un seul point de la
base de code référence un fichier de logo — le composant `<Logo variant=… />` de
`src/components/ui/Brand.tsx`, dont les URL viennent de `src/lib/brand.ts`.

Les fichiers vectoriels livrés sont une **reproduction** du logo de marque
(chronomètre en mouvement, silhouette en course, croissant et étoile, signature
« Kinedok » et baseline « La Kiné, maintenant »). Ils respectent la composition et
les couleurs, mais ne remplacent pas les originaux : le wordmark y est composé
avec une police système, non vectorisée.

> **Piège technique à connaître en cas de retouche des SVG :** les dégradés
> doivent rester en `gradientUnits="userSpaceOnUse"`. En unités de boîte
> englobante (valeur par défaut), les traits parfaitement horizontaux ou
> verticaux — poussoir du chronomètre, lignes de vitesse — ont une boîte plate et
> ne sont **pas peints du tout**.

Dans l'en-tête, le logo pointe vers `https://kinedokdz.com/` et le bloc texte
« ACADÉMIE / KINEDOK » vers l'accueil de la plateforme : c'est le lien explicite
entre l'écosystème et sa branche éducative.

## 3. Composants

Tous sont produits par `src/components/` et documentés par l'usage :

**Structure** — `header` (marque, navigation, recherche instantanée, langue,
compte, tiroir mobile), `footer` (sections, écosystème, mentions, langue),
`breadcrumb`, `sectionHead`, `workspaceShell` (espace membre et administration).

**Contenu** — `resourceCard`, `courseCard`, `webinarCard`, `toolCard`,
`pathologyCard`, `exerciseCard`, `featureCard`, `statCard`, `resultRow`.

**Formulaires** — `field()` (texte, e-mail, mot de passe, nombre, date,
`datetime-local`, sélection, zone de texte), `checkboxGroup`, `choice-card`
(sélection du type de compte), erreurs rattachées au champ.

**Navigation et état** — `tabs`, `pill-nav`, `accordion`, `pagination`,
`filter-panel` + `activeChips` + `bar`, `progress`, `rating`, `badge`, `tag`,
`avatar`, `alert`, `medicalNotice`, `emptyState`, `errorState`, `loadingState`,
`toast`, `openModal` / `confirm`.

### Boutons

| Classe | Usage |
| --- | --- |
| `.btn-primary` | action principale (une seule par écran) |
| `.btn-secondary` | action de confirmation secondaire (bleu ardoise) |
| `.btn-outline` | action secondaire courante |
| `.btn-ghost` | action tertiaire, barres d'outils |
| `.btn-danger` | action destructive (suppression de compte, de contenu) |
| `.icon-btn` | action iconographique (favori, partage, fermeture) |

Modificateurs : `.btn-sm`, `.btn-lg`, `.btn-block`.

## 4. Grille et points de rupture

```text
≥ 1340 px  navigation complète + champ de recherche dans l'en-tête
1100–1340  navigation complète + bouton de recherche compact
900–1100   tiroir mobile pour la navigation ; langue et compte restent visibles
620–900    tiroir complet (navigation, recherche, langue, compte) ;
           filtres en tiroir plein écran ; grilles à 2 colonnes
< 620      une colonne, grilles empilées, titres réduits
```

Le nombre d'entrées de navigation (7) et la longueur des libellés français
imposaient ces paliers : sans eux, l'en-tête débordait entre 900 et 1500 px.
Vérifié sans défilement horizontal à 375, 768, 1024, 1360 et 1600 px, en FR et AR.

## 5. Règles d'usage

**À faire**

- Une seule action principale par écran.
- Toujours associer un état vide utile (message + action) à une liste filtrable.
- Afficher l'avertissement pédagogique (`KA.ui.medicalNotice()`) sur toute page
  clinique et dans tout document exporté.
- Utiliser `.ltr-nums` pour les chiffres, durées, tailles et références.
- Passer chaque donnée par `KA.dom.esc()`.

**À éviter**

- Dégradés multicolores, ombres marquées, animations d'apparition en cascade.
- Icônes pleines et colorées (le jeu est linéaire, 1,7 px, `currentColor`).
- Plus de deux niveaux de profondeur visuelle dans une carte.
- Écrire une couleur en hexadécimal ailleurs que dans `tokens.css`.

## 6. Accessibilité intégrée au système

- Contrastes vérifiés en thème clair et sombre pour le texte, les badges et les
  boutons.
- `:focus-visible` visible sur tous les éléments interactifs, jamais supprimé.
- Cibles tactiles ≥ 38 × 38 px.
- Icônes décoratives en `aria-hidden="true"` ; icônes seules toujours
  accompagnées d'un `aria-label`.
- `prefers-reduced-motion` neutralise les transitions et l'animation du badge
  « en direct ».
