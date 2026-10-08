/* =====================================================================
   Extraction du jeu de données TypeScript vers JSON.
   ---------------------------------------------------------------------
   Les fichiers de `src/data/` n'importent que des types : Node peut donc
   les exécuter directement (`--experimental-strip-types`), sans build ni
   node_modules. Le JSON produit alimente `manage.py seed_content`.

       node --experimental-strip-types backend/seed/export.mjs
   ===================================================================== */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', 'src', 'data');
const outDir = join(here, 'data');
mkdirSync(outDir, { recursive: true });

const modules = {
  taxonomies: 'taxonomies.ts',
  authors: 'authors.ts',
  pathologies: 'pathologies.ts',
  resources: 'resources.ts',
  courses: 'courses.ts',
  webinars: 'webinars.ts',
  tools: 'tools.ts',
  exercises: 'exercises.ts',
  plans: 'plans.ts',
};

const summary = {};
for (const [name, file] of Object.entries(modules)) {
  const mod = await import(new URL(`../../src/data/${file}`, import.meta.url).href);
  const value = mod[name] ?? mod.default;
  if (value === undefined) throw new Error(`export « ${name} » absent de ${file}`);
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(value, null, 2), 'utf8');
  summary[name] = Array.isArray(value) ? value.length : Object.keys(value).length;
}

console.log(JSON.stringify(summary, null, 2));
