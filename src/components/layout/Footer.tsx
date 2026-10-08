/* =====================================================================
   Pied de page
   ---------------------------------------------------------------------
   Quatre colonnes — la marque, deux colonnes de liens, un bloc de
   contact — puis une barre de bas de page.

   Surface sombre dans les deux thèmes : elle ne suit pas l'inversion
   clair/sombre, sans quoi un pied de page clair porterait un texte clair.
   Le logo prend donc sa version pour fond sombre.

   Les intitulés de colonne sont jaunes : c'est le seul endroit du site
   où le jaune porte autre chose qu'un ornement, et il y sert à découper
   quatre listes qui se ressembleraient sinon.
   ===================================================================== */
import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { Accent } from '../home/Decor';
import { Icon } from '../icons/Icon';
import { LanguageButtons, Logo } from '../ui';
import { MAIN_SITE } from './Header';

/** Adresse de contact de l'académie, reprise de la page Contact. */
const CONTACT_EMAIL = 'academie@kinedokdz.com';

export function Footer() {
  const { t, href } = useI18n();

  const explore = [
    { path: 'bibliotheque', label: t('common.nav.library') },
    { path: 'formations', label: t('common.nav.courses') },
    { path: 'webinaires', label: t('common.nav.webinars') },
    { path: 'outils', label: t('common.nav.tools') },
    { path: 'pathologies', label: t('common.nav.pathologies') },
    { path: 'exercices', label: t('common.nav.exercises') }
  ];

  const resources = [
    { path: 'abonnements', label: t('common.nav.subscriptions') },
    { path: 'a-propos', label: t('common.footer.about') },
    { path: 'faq', label: t('common.footer.faq') },
    { path: 'avertissement-medical', label: t('common.footer.medical') }
  ];

  return (
    <footer id="site-footer" className="site-footer" role="contentinfo">
      <div className="ka-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo variant="horizontal" appearance="dark" className="footer-brand-logo" alt="KINEDOK ACADÉMIE" />
            <p className="footer-about">{t('common.footer.aboutText')}</p>
            <p className="footer-note">{t('common.footer.demoNotice')}</p>
          </div>

          <nav className="footer-col" aria-label={t('common.footer.explore')}>
            <h4>{t('common.footer.explore')}</h4>
            <div className="footer-links">
              {explore.map((item) => (
                <Link key={item.path} to={href(item.path)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav className="footer-col" aria-label={t('common.footer.resources')}>
            <h4>{t('common.footer.resources')}</h4>
            <div className="footer-links">
              {resources.map((item) => (
                <Link key={item.path} to={href(item.path)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="footer-col">
            <h4>{t('common.footer.connect')}</h4>
            <div className="footer-contact">
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <span className="footer-contact-icon">
                  <Icon name="mail" size={15} />
                </span>
                {CONTACT_EMAIL}
              </a>
              <a href={MAIN_SITE} target="_blank" rel="noopener noreferrer">
                <span className="footer-contact-icon">
                  <Icon name="globe" size={15} />
                </span>
                {t('common.footer.mainSite')}
                <Icon name="external" size={13} />
              </a>
              <Link to={href('contact')}>
                <span className="footer-contact-icon">
                  <Icon name="inbox" size={15} />
                </span>
                {t('common.footer.contact')}
              </Link>
            </div>
          </div>

          {/* Signature : la devise de l'académie, posée dans un rond tracé.
              Décorative — elle ne dit rien qu'on ne lise ailleurs. */}
          <p className="footer-seal" aria-hidden="true">
            <Accent>{t('common.footer.tagline')}</Accent>
            <span className="footer-seal-heart">
              <Icon name="heart" size={18} />
            </span>
          </p>
        </div>

        <div className="footer-bottom">
          <span>{t('common.footer.rights', { year: new Date().getFullYear() })}</span>
          <div className="footer-bottom-links">
            <Link to={href('confidentialite')}>{t('common.footer.privacy')}</Link>
            <Link to={href('conditions')}>{t('common.footer.terms')}</Link>
          </div>
          <LanguageButtons className="footer-lang" />
        </div>
      </div>
    </footer>
  );
}
