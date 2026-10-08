/* =====================================================================
   Documents imprimables / PDF
   ---------------------------------------------------------------------
   « Télécharger » ouvre la fiche complète mise en page pour l'impression
   ou l'enregistrement en PDF par le navigateur. Le contenu affiché est
   le contenu réel de la fiche. Quand les PDF officiels seront déposés
   sur le stockage, il suffira de servir `fileUrl` à la place.
   ===================================================================== */
import { dirOf, getLocale, term, translate as t } from '../i18n/core';
import type { Certificate, PublicUser } from '../model/account';
import type { Course, Exercise, Pathology, Resource, Tool } from '../model/content';
import { logoSource } from './brand';
import { authorName, courseStats, pathologyName, titleOf } from './content';
import { formatDate, formatDuration } from './format';
import { esc } from './html';

function bulletList(items: string[] | undefined): string {
  if (!items?.length) return '';
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function orderedList(items: string[] | undefined): string {
  if (!items?.length) return '';
  return `<ol>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>`;
}

/** Ouvre un document autonome mis en page ; renvoie null si la fenêtre est bloquée. */
export function printDocument(title: string, bodyHtml: string, meta?: string): Window | null {
  const win = window.open('', '_blank');
  if (!win) return null;
  const locale = getLocale();
  /* Document imprimé : toujours sur fond blanc, donc logo bicolore.
     Fenêtre vierge : le chemin du logo doit être absolu. */
  const logoUrl = new URL(logoSource('horizontal', 'light'), window.location.href).href;
  const doc =
    `<!DOCTYPE html><html lang="${locale}" dir="${dirOf(locale)}"><head><meta charset="utf-8">` +
    `<title>${esc(title)} — KINEDOK ACADÉMIE</title>` +
    '<style>' +
    'body{font-family:"Segoe UI",Arial,sans-serif;color:#1F2D3A;margin:0;padding:32px;line-height:1.55}' +
    '.doc{max-width:780px;margin:0 auto}' +
    'header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2BBECD;padding-bottom:12px;margin-bottom:24px}' +
    'h1{font-size:22px;margin:0 0 6px}h2{font-size:15px;margin:22px 0 8px;color:#17838F;text-transform:uppercase;letter-spacing:.06em}' +
    '.meta{font-size:12px;color:#64748B;margin-bottom:18px}' +
    'ul,ol{padding-inline-start:20px;margin:0 0 10px}li{margin-bottom:4px}' +
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px}' +
    'th,td{border:1px solid #E2E8ED;padding:6px 8px;text-align:start}' +
    '.notice{margin-top:28px;padding:12px;border:1px solid #E2E8ED;background:#FDF3E4;font-size:11px;color:#8a5a00}' +
    'footer{margin-top:24px;border-top:1px solid #E2E8ED;padding-top:10px;font-size:11px;color:#64748B;display:flex;justify-content:space-between}' +
    '@media print{body{padding:0}}' +
    '</style></head><body><div class="doc">' +
    `<header><div><img src="${esc(logoUrl)}" alt="KINEDOK ACADÉMIE" style="height:46px;width:auto">` +
    '<div style="font-size:11px;letter-spacing:.16em;color:#64748B;margin-top:2px">ACADÉMIE</div></div>' +
    `<div style="font-size:11px;color:#64748B;text-align:end">academie.kinedokdz.com<br>${esc(formatDate(new Date()))}</div></header>` +
    `<h1>${esc(title)}</h1>` +
    (meta ? `<p class="meta">${esc(meta)}</p>` : '') +
    bodyHtml +
    `<div class="notice"><strong>${esc(t('common.disclaimer.title'))}</strong><br>${esc(t('common.disclaimer.body'))}</div>` +
    `<footer><span>KINEDOK ACADÉMIE</span><span>${esc(t('common.footer.rights', { year: new Date().getFullYear() }))}</span></footer>` +
    '</div><script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>' +
    '</body></html>';
  win.document.open();
  win.document.write(doc);
  win.document.close();
  return win;
}

export function resourceBody(resource: Resource): string {
  return (
    `<h2>${esc(t('common.labels.description'))}</h2><p>${esc(resource.description)}</p>` +
    (resource.abstract ? `<h2>${esc(t('library.abstract'))}</h2><p>${esc(resource.abstract)}</p>` : '') +
    (resource.keyPoints?.length ? `<h2>${esc(t('library.keyPoints'))}</h2>${bulletList(resource.keyPoints)}` : '') +
    `<h2>${esc(t('library.metadata'))}</h2><table><tbody>` +
    `<tr><th>${esc(t('common.labels.type'))}</th><td>${esc(term('resourceTypes', resource.type))}</td></tr>` +
    `<tr><th>${esc(t('common.labels.author'))}</th><td>${esc(authorName(resource.authorId))}</td></tr>` +
    `<tr><th>${esc(t('common.labels.publishedOn'))}</th><td>${esc(formatDate(resource.publishedAt))}</td></tr>` +
    `<tr><th>${esc(t('common.labels.region'))}</th><td>${esc(term('regions', resource.region))}</td></tr>` +
    `<tr><th>${esc(t('common.labels.specialty'))}</th><td>${esc(term('specialties', resource.specialty))}</td></tr>` +
    `<tr><th>${esc(t('common.labels.level'))}</th><td>${esc(term('levels', resource.level))}</td></tr>` +
    `<tr><th>${esc(t('common.labels.pathology'))}</th><td>${esc(resource.pathologies.map(pathologyName).join(', ') || '—')}</td></tr>` +
    '</tbody></table>' +
    (resource.references?.length ? `<h2>${esc(t('common.labels.references'))}</h2>${bulletList(resource.references)}` : '')
  );
}

export function toolBody(tool: Tool): string {
  return (
    `<h2>${esc(t('tools.purpose'))}</h2><p>${esc(tool.purpose)}</p>` +
    (tool.indications.length ? `<h2>${esc(t('common.labels.indications'))}</h2>${bulletList(tool.indications)}` : '') +
    (tool.contraindications.length
      ? `<h2>${esc(t('common.labels.contraindications'))}</h2>${bulletList(tool.contraindications)}`
      : '') +
    (tool.equipment.length ? `<h2>${esc(t('common.labels.equipment'))}</h2>${bulletList(tool.equipment)}` : '') +
    `<h2>${esc(t('tools.procedure'))}</h2>${orderedList(tool.procedure)}` +
    `<h2>${esc(t('tools.scoring'))}</h2><p>${esc(tool.scoring)}</p>` +
    `<h2>${esc(t('tools.interpretation'))}</h2>${bulletList(tool.interpretation)}` +
    (tool.psychometrics ? `<h2>${esc(t('tools.psychometrics'))}</h2><p>${esc(tool.psychometrics)}</p>` : '') +
    `<h2>${esc(t('common.labels.references'))}</h2>${bulletList(tool.references)}` +
    `<h2>${esc(t('common.labels.results'))}</h2><table><tbody>` +
    `<tr><th style="width:32%">${esc(t('common.labels.date'))}</th><td></td></tr>` +
    `<tr><th>${esc(t('tools.scoring'))}</th><td></td></tr>` +
    `<tr><th>${esc(t('tools.interpretation'))}</th><td></td></tr>` +
    '</tbody></table>'
  );
}

export function exerciseBody(exercise: Exercise): string {
  return (
    `<h2>${esc(t('exercises.objective'))}</h2><p>${esc(exercise.goal)}</p>` +
    `<h2>${esc(t('exercises.howTo'))}</h2>${orderedList(exercise.steps)}` +
    `<h2>${esc(t('exercises.dosage'))}</h2><table><tbody>` +
    `<tr><th>${esc(t('exercises.sets'))}</th><td>${esc(exercise.dosage.sets)}</td></tr>` +
    `<tr><th>${esc(t('exercises.reps'))}</th><td>${esc(exercise.dosage.reps)}</td></tr>` +
    `<tr><th>${esc(t('exercises.hold'))}</th><td>${esc(exercise.dosage.hold)}</td></tr>` +
    `<tr><th>${esc(t('exercises.frequency'))}</th><td>${esc(exercise.dosage.frequency)}</td></tr>` +
    '</tbody></table>' +
    `<h2>${esc(t('exercises.progression'))}</h2><p>${esc(exercise.progression)}</p>` +
    `<h2>${esc(t('exercises.regression'))}</h2><p>${esc(exercise.regression)}</p>` +
    `<h2>${esc(t('exercises.precautions'))}</h2>${bulletList(exercise.precautions)}` +
    `<h2>${esc(t('exercises.targetMuscles'))}</h2><p>${esc(exercise.targetMuscles.join(', '))}</p>`
  );
}

/** Kit de bilan : synthèse de la pathologie + toutes ses fiches d'évaluation. */
export function pathologyKitBody(pathology: Pathology, tools: Tool[]): string {
  let body =
    `<h2>${esc(t('pathologies.keyFacts'))}</h2>${bulletList(pathology.keyFacts)}` +
    `<h2>${esc(t('pathologies.redFlags'))}</h2>${bulletList(pathology.redFlags)}`;
  tools.forEach((tool) => {
    body +=
      `<h2>${esc(titleOf(tool))} — ${esc(term('toolTypes', tool.type))}</h2>` +
      `<p>${esc(tool.purpose)}</p>${orderedList(tool.procedure)}` +
      `<p><strong>${esc(t('tools.scoring'))} :</strong> ${esc(tool.scoring)}</p>`;
  });
  return body;
}

export function printCertificate(course: Course, user: PublicUser, certificate: Certificate): Window | null {
  const stats = courseStats(course);
  const body =
    '<div style="text-align:center;padding:32px 0">' +
    `<h2 style="border:0;color:#2BBECD;letter-spacing:.12em">${esc(t('dashboard.certificate.title'))}</h2>` +
    `<p style="font-size:15px;margin-top:24px">${esc(
      t('dashboard.certificate.body', {
        name: `${user.firstName} ${user.lastName}`,
        course: titleOf(course),
        hours: formatDuration(stats.minutes)
      })
    )}</p>` +
    `<p style="margin-top:28px;font-size:12px;color:#64748B">${esc(
      t('dashboard.certificate.issued', { date: formatDate(certificate.at) })
    )}<br>${esc(t('dashboard.certificate.reference', { ref: certificate.ref }))}</p>` +
    '</div>';
  return printDocument(t('dashboard.certificate.title'), body, `${titleOf(course)} · ${authorName(course.instructorId)}`);
}
