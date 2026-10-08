/* =====================================================================
   Écran d'authentification
   ---------------------------------------------------------------------
   Un fond pleine page, une carte posée à droite.

   Le volet gauche — titre, accroche, arguments, illustration, ornements —
   **est l'image de fond** (`public/auth/hero.webp`) : rien n'en est
   rendu en HTML. Remplacer ce fichier change tout le volet, sans toucher
   au code.

   Sur téléphone le fond est **retiré** (`display: none` en CSS), pas
   replié : il porte un argumentaire, pas une information nécessaire, et
   le garder repousserait le formulaire hors de l'écran alors que le
   remplir est la seule raison de venir là.

   La carte garde donc la charge de ce qui doit rester lisible partout :
   le titre du formulaire, le lien vers l'écran complémentaire, et les
   mentions légales.
   ===================================================================== */
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';

/** Marque Google, pour le bouton de connexion tierce. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z" />
    </svg>
  );
}

/**
 * Emblème de la carte : la toque de l'académie, entourée de deux éclats.
 *
 * Les éclats sont tracés ici plutôt qu'empruntés aux ornements de
 * l'accueil : ils encadrent un emblème de 44 px et demandent des
 * proportions qui leur sont propres.
 */
function CardEmblem() {
  return (
    <span className="au-emblem" aria-hidden="true">
      <svg className="au-emblem-spark au-emblem-spark-start" viewBox="0 0 24 28" fill="none" focusable="false">
        <path d="M12 2v7M4 7l4 5M20 7l-4 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="au-emblem-mark">
        <Icon name="graduation" size={30} />
      </span>
      <svg className="au-emblem-spark au-emblem-spark-end" viewBox="0 0 24 28" fill="none" focusable="false">
        <path d="M12 2v7M4 7l4 5M20 7l-4 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export interface AuthShellProps {
  /** Titre de la carte. */
  formTitle: string;
  formSubtitle?: string;
  children: ReactNode;
  /** Lien vers l'écran complémentaire, en tête de carte. */
  switchPrompt?: string;
  switchLabel?: string;
  switchTo?: string;
  /** Affiche le bouton de connexion tierce au-dessus du formulaire. */
  withProvider?: boolean;
  /** Mentions légales sous le bouton d'envoi. */
  legal?: ReactNode;
}

export function AuthShell({
  formTitle,
  formSubtitle,
  children,
  switchPrompt,
  switchLabel,
  switchTo,
  withProvider = false,
  legal
}: AuthShellProps) {
  const { t, href } = useI18n();

  return (
    <div className="au">
      {/* Décoratif : tout ce qu'il montre est répété en texte dans la carte
          ou ailleurs sur le site. `alt` vide, pas de description. */}
      <img className="au-bg" src="/auth/hero.webp" alt="" aria-hidden="true" />

      <div className="au-stage">
        <div className="au-card">
          <div className="au-card-top">
            <Link className="au-back" to={href('')}>
              <Icon name="arrowLeft" size={17} className="icon-flip" />
              {t('common.actions.back')}
            </Link>
            {switchTo && switchLabel ? (
              <p className="au-switch">
                {switchPrompt}{' '}
                <Link className="au-link" to={switchTo}>
                  {switchLabel}
                </Link>
              </p>
            ) : null}
          </div>

          <CardEmblem />
          <h1 className="au-card-title">{formTitle}</h1>
          {formSubtitle ? <p className="au-card-sub">{formSubtitle}</p> : null}

          {withProvider ? (
            <>
              <button type="button" className="au-provider" disabled title={t('auth.shell.providerSoon')}>
                <GoogleMark />
                {t('auth.shell.google')}
              </button>
              <div className="au-divider">{t('auth.shell.or')}</div>
            </>
          ) : null}

          {children}

          {legal ? <p className="au-legal">{legal}</p> : null}
        </div>
      </div>
    </div>
  );
}
