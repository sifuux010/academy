import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LOCALES, persistLocale } from '../../i18n/core';
import { useI18n } from '../../i18n/I18nContext';
import { track } from '../../lib/analytics';
import { logoSource, type LogoVariant } from '../../lib/brand';
import type { Appearance, Locale, ThemeMode } from '../../model/common';
import { useStoreVersion } from '../../state/store';
import { THEME_MODES, useTheme } from '../../theme/ThemeContext';
import { Icon, type IconName } from '../icons/Icon';

/* ---------------------------------------------------------------- logo */

export function Logo({
  variant,
  appearance,
  className = 'brand-logo',
  alt,
  style
}: {
  variant: LogoVariant;
  /** Force une apparence (surfaces toujours sombres comme le pied de page). */
  appearance?: Appearance;
  className?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  useStoreVersion(); // redessine après détection des fichiers officiels
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <img
      className={className}
      src={logoSource(variant, appearance ?? theme.appearance)}
      alt={alt ?? t('common.brand.name')}
      style={style}
    />
  );
}

/* ------------------------------------------------------------- thème */

const THEME_ICONS: Record<ThemeMode, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' };

/** Bouton unique faisant tourner système → clair → sombre. */
export function ThemeToggle() {
  const { mode, cycle } = useTheme();
  const { t } = useI18n();
  const label = `${t('common.theme.label')} : ${t(`common.theme.${mode}`)}`;
  return (
    <button type="button" className="icon-btn" onClick={cycle} aria-label={label} title={label}>
      <Icon name={THEME_ICONS[mode]} size={18} />
    </button>
  );
}

/** Trois choix explicites (paramètres, tiroir mobile). */
export function ThemeChoice() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  return (
    <div className="row-wrap">
      {THEME_MODES.map((option) => (
        <button
          key={option}
          type="button"
          className={`btn btn-sm ${mode === option ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={mode === option}
          onClick={() => setMode(option)}
        >
          <Icon name={THEME_ICONS[option]} size={16} />
          {t(`common.theme.${option}`)}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ langue */

/** Change de langue en conservant la page courante. */
export function useSwitchLocale(): (code: Locale) => void {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useI18n();
  return (code: Locale) => {
    if (code === locale) return;
    persistLocale(code);
    track('locale_changed', { locale: code });
    const path = location.pathname.replace(/^\/(fr|en|ar)(?=\/|$)/, `/${code}`);
    navigate(`${path}${location.search}`, { replace: true });
  };
}

export function LanguageSwitch() {
  const { t, locale } = useI18n();
  const switchLocale = useSwitchLocale();
  return (
    <div className="lang-switch" role="group" aria-label={t('common.footer.language')}>
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          type="button"
          aria-pressed={loc.code === locale}
          title={loc.name}
          onClick={() => switchLocale(loc.code)}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}

/** Variante à boutons pleine largeur (pied de page, paramètres). */
export function LanguageButtons({ className }: { className?: string }) {
  const { locale } = useI18n();
  const switchLocale = useSwitchLocale();
  return (
    <div className={className ? `row-wrap ${className}` : 'row-wrap'}>
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          type="button"
          className={`btn btn-sm ${loc.code === locale ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={loc.code === locale}
          onClick={() => switchLocale(loc.code)}
        >
          {loc.name}
        </button>
      ))}
    </div>
  );
}
