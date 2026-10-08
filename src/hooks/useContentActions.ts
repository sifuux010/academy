/* =====================================================================
   Actions sur les contenus : téléchargements, impressions, certificats
   ---------------------------------------------------------------------
   Contrôle d'accès premium, journalisation du téléchargement, ouverture
   du document imprimable et message de retour, au même endroit.
   ===================================================================== */
import { useNavigate } from 'react-router';
import { useToast } from '../components/feedback/ToastProvider';
import { useI18n } from '../i18n/I18nContext';
import { canAccess } from '../lib/access';
import { certificateFor, recordDownload } from '../lib/activity';
import { currentUser } from '../lib/auth';
import { authorName, getById, titleOf } from '../lib/content';
import { formatDate } from '../lib/format';
import {
  exerciseBody,
  pathologyKitBody,
  printCertificate,
  printDocument,
  resourceBody,
  toolBody
} from '../lib/print';
import type { Exercise, Pathology, Resource, Tool } from '../model/content';

export function useContentActions() {
  const toast = useToast();
  const navigate = useNavigate();
  const { t, term, href } = useI18n();

  const requireLogin = (message?: string) => {
    toast(message ?? t('common.states.authRequiredBody'), 'error');
    navigate(href('connexion'));
  };

  const opened = (win: Window | null) => {
    if (win) toast(t('common.toast.downloadStarted'), 'success');
    else toast(t('common.toast.genericError'), 'error');
  };

  const downloadResource = (resource: Resource) => {
    if (!canAccess(resource)) {
      requireLogin();
      return;
    }
    recordDownload('resources', resource.id);
    opened(
      printDocument(
        titleOf(resource),
        resourceBody(resource),
        `${term('resourceTypes', resource.type)} · ${authorName(resource.authorId)} · ${formatDate(resource.publishedAt)}`
      )
    );
  };

  const downloadTool = (tool: Tool) => {
    if (!canAccess(tool)) {
      requireLogin();
      return;
    }
    recordDownload('tools', tool.id);
    opened(printDocument(titleOf(tool), toolBody(tool), `${term('toolTypes', tool.type)} · ${term('regions', tool.region)}`));
  };

  const printExercise = (exercise: Exercise) => {
    recordDownload('exercises', exercise.id);
    opened(
      printDocument(
        titleOf(exercise),
        exerciseBody(exercise),
        `${term('regions', exercise.region)} · ${term('objectives', exercise.objective)}`
      )
    );
  };

  const downloadPathologyKit = (pathology: Pathology, tools: Tool[]) => {
    tools.forEach((tool) => recordDownload('tools', tool.id));
    opened(
      printDocument(
        `${t('tools.kitTitle')} — ${titleOf(pathology)}`,
        pathologyKitBody(pathology, tools),
        `${term('regions', pathology.region)} · ${term('specialties', pathology.specialty)}`
      )
    );
  };

  const downloadCertificate = (courseId: string) => {
    const user = currentUser();
    const course = getById('courses', courseId);
    const certificate = certificateFor(courseId);
    if (!user || !course || !certificate) return;
    if (!printCertificate(course, user, certificate)) toast(t('common.toast.genericError'), 'error');
  };

  return { requireLogin, downloadResource, downloadTool, printExercise, downloadPathologyKit, downloadCertificate };
}
