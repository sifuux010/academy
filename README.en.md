# KINEDOK ACADÉMIE — React + TypeScript + Vite + Tailwind CSS

> **Quick start** — Node.js 20 or later is required.
>
> ```bash
> npm install
> npm run dev
> ```
>
> Open http://localhost:5173 — you are redirected to `/fr`, `/en` or `/ar`.
> **This code was written on a machine without Node.js: it has never been compiled or run.**
> Static checks were done (see below), but expect a first round of `npm run typecheck` fixes.

**Education branch of the [KINEDOK](https://kinedokdz.com/) ecosystem** — a
scientific library, online courses, webinars and clinical tools for
physiotherapists and physiotherapy students.

Built with **React 19 + strict TypeScript + Vite + Tailwind CSS v4**: a scientific
library, courses (progress, quizzes, certificates), webinars, printable clinical
tools, pathologies, exercises, global search, subscriptions, member area, profile
and settings, full administration, FR / EN / AR with real RTL, light / dark /
system theme.

Version française : [README.md](README.md).

---

## 1. Project status — read this first

| Item | Status |
|---|---|
| Complete source code (every section and feature) | ✅ written |
| `tsc` / `vite build` compilation | ❌ **never run** (no Node.js on the development machine) |
| Static checks done without Node | ✅ every relative import and every imported name resolved; unused imports and hook variables (`noUnusedLocals`); identical structure of the fr / en / ar dictionaries; every translation key in use exists; every CSS class in use exists in the design system |
| Automated tests | ❌ none (see the production checklist) |

Recommended first step for the developer:

```bash
npm run typecheck
```

then fix any type errors (the code was written in strict mode, but without a
compiler to validate it).

## 2. Installation

The dependencies are declared in `package.json` (React 19, react-router 7,
Vite, TypeScript, Tailwind CSS 4): a single command is enough.

```bash
npm install
```

To start from the very latest versions instead of the declared ranges:

```bash
npm install react@latest react-dom@latest react-router@latest
```

```bash
npm install -D vite@latest @vitejs/plugin-react@latest typescript@latest tailwindcss@latest @tailwindcss/vite@latest @types/react@latest @types/react-dom@latest
```

| Script | Purpose |
|---|---|
| `npm run dev` | development server (port 5173) |
| `npm run typecheck` | TypeScript check only |
| `npm run build` | `tsc --noEmit` then `vite build` → `dist/` |
| `npm run preview` | serves `dist/` (port 4173) |

Recommended next: ESLint with `eslint-plugin-react-hooks` (the code already
contains a few justified `eslint-disable-line react-hooks/exhaustive-deps`
comments).

## 3. Demo accounts

Created in the browser on first launch (`src/lib/auth.ts`, `DEMO_USERS`).

| Profile | E-mail | Password |
|---|---|---|
| Main administrator (SUPER_ADMIN) | master@kinedokdz.com | KinedokMaster2026! |
| Secondary administrator (SUPER_ADMIN) | admin@kinedokdz.com | Admin2024! |
| Physiotherapist | demo@kinedokdz.com | Demo2024! |
| Student | etudiant@kinedokdz.com | Etudiant2024! |

> ⚠️ **Security** — these passwords are in plain text in the source code sent to
> the browser: acceptable for a demo, **not in production**. Before going live,
> remove `DEMO_USERS`, create the administrator account on the server (Argon2id
> hashing) and redo every role check on the server.

## 4. Folder structure

```text
.
├── index.html                  single-page app, theme applied before first paint
├── package.json                npm scripts and dependencies
├── vite.config.ts              React + Tailwind (@tailwindcss/vite)
├── tsconfig.json               strict TypeScript
├── vercel.json                 SPA fallback for Vercel
├── public/
│   ├── brand/                  SVG logos (two-tone = light, monochrome = dark)
│   ├── _redirects              SPA fallback for Netlify / Cloudflare Pages
│   └── .htaccess               SPA fallback for Apache
├── src/
│   ├── main.tsx                bootstrap: storage, content, logos, demo accounts, render
│   ├── App.tsx                 route table (/:locale/…)
│   ├── styles/                 design system + index.css (Tailwind v4)
│   ├── data/                   typed demo data set (content, plans, taxonomies)
│   ├── locales/                dictionaries fr.ts (reference), en.ts, ar.ts
│   ├── model/                  domain types (content, accounts, subscriptions)
│   ├── i18n/                   active language, translation, plurals, prefixed links
│   ├── theme/                  light / dark / system theme
│   ├── state/store.ts          reactivity: useSyncExternalStore over a version counter
│   ├── lib/                    services (auth, content, activity, subscriptions,
│   │                           search, analytics, printing, SEO, storage, brand)
│   ├── hooks/                  useSeo, useCurrentUser, useContentActions…
│   ├── components/
│   │   ├── ui/                 badges, breadcrumbs, alerts, tabs, forms…
│   │   ├── cards/              content cards
│   │   ├── filters/            filter panel, sorting, pills
│   │   ├── layout/             header, footer, layouts, guards
│   │   ├── feedback/           modals and notifications
│   │   └── content/            shared detail-page blocks
│   └── pages/                  one page (or page group) per section
├── db/
│   ├── schema.prisma           PostgreSQL schema (Prisma)
│   └── supabase.sql            DDL + RLS policies for Supabase
└── docs/                       French functional documentation
```

## 5. Technical choices

**Routing.** Every page lives under `/:locale` (`fr`, `en`, `ar`). A path
without a language is redirected to the detected language, and so is `/`. The
`RequireAuth` / `RequireRole` guards protect the member area and the
administration (content editor for content, ADMIN for members and
subscriptions). The host must serve `index.html` for any unknown URL: files are
provided for Netlify / Cloudflare (`public/_redirects`), Apache
(`public/.htaccess`) and Vercel (`vercel.json`).

**Styles — original design system.** The design system
is reused as-is in `src/styles/` and loaded into the Tailwind layers (`base`,
`components`); the `tokens.css` variables stay outside any layer so they take
precedence over Tailwind's. Two precautions guarantee identical rendering:

- Tailwind's *preflight* is not loaded (the original base styles assume no
  global reset);
- design-system classes that share a name with a Tailwind utility (`text-sm`,
  `grid`, `mt-4`…) are excluded from generation (`@source not inline(...)` in
  `index.css`); otherwise Tailwind would, for example, impose its own line
  height.

`.container` was renamed `.ka-container` to avoid a clash with the Tailwind
utility. The brand colours are exposed as utilities (`bg-kinedok`,
`text-muted`, `border-line`…) and follow the theme.

**Reactivity.** Services write to localStorage and then call `notify()`;
components subscribe through `useStoreVersion()` (`useSyncExternalStore`).
“Silent” writes (views, search history, statistics) do not trigger a re-render.
Browser tabs stay in sync (`storage` event).

**Internationalisation.** TypeScript dictionaries, no dependency. `useI18n()`
provides `t`, `tn` (plural), `term` (taxonomies), `loc` (translated content) and
`href` (link prefixed with the language). Arabic sets `dir="rtl"` on `<html>`;
`rtl.css` adapts the layout.

**Logos.** `public/brand/*.svg`: two-colour in the light theme, turquoise
monochrome in the dark theme; the footer (always dark) uses the dark version and
printed documents the light one. Drop the official files
`public/brand/kinedok-logo.png`, `kinedok-logo-compact.png`,
`kinedok-logo-stacked.png` (and their `-dark` variants) in place: they are
detected at start-up and replace the SVGs without any code change.

**Downloads.** Tool sheets, resources, exercises, assessment kits and
certificates open as a printable document (which the browser can save as PDF).
Once the real PDFs are in storage, serve `fileUrl` instead.

**SEO.** Title, description, Open Graph, canonical URL and schema.org
structured data are updated on every page (`hooks/useSeo.ts`). Rendering is
client-side only: for the best search ranking in production, add pre-rendering
or server-side rendering.

## 6. Behaviour worth knowing

- List sorting: choosing “Newest” on a list whose default sort is different
  (courses, tools) now works.
- Webinars (administration): the start time no longer shifts by the time-zone
  offset each time it is saved.
- Pathologies created from the administration: the title is stored in `name`,
  like the pathologies of the demo data set.
- After a passed quiz, the progress shown in the side column updates
  immediately.
- In development, `<StrictMode>` runs some effects twice (views, page views):
  this only happens in development mode.

## 7. Before production

1. Backend: schemas are provided in `db/schema.prisma` and
   `db/supabase.sql`. Replace `src/lib/storage.ts` with API calls; keep the
   service signatures so the pages do not need to change.
2. Server-side authentication (Argon2id, HttpOnly sessions, e-mail
   verification, reset by link); remove `DEMO_USERS`.
3. Role checks and validation redone on the server for every administration
   action and every subscription.
4. Quiz grading on the server (the answers are currently in the client).
5. File storage (PDFs, videos, avatars) and signed URLs for premium content.
6. Subscription payment (currently: request, then manual approval).
7. Security headers and CSP on the host.
8. Tests: Vitest + Testing Library (services, components), Playwright
   (sign-up → course → certificate journey, administration, RTL).
9. Medical review of the content before publication (a disclaimer is already
   shown on every clinical page).

Detailed functional documentation (in French): `docs/` (architecture, i18n,
security, sections).
