/* =====================================================================
   Champs des écrans d'authentification
   ---------------------------------------------------------------------
   Champ à fond plein, avec une icône de tête ; un bouton d'œil pour les
   mots de passe, un indicatif pour le téléphone.

   Trois choix tenus :

   - **le libellé reste**, même quand une icône occupe la tête du champ.
     Une enveloppe ne dit pas « adresse professionnelle ou personnelle »,
     et un repère visuel n'est pas lisible par un lecteur d'écran.
   - **l'astérisque n'est pas seul.** Il est décoratif (`aria-hidden`) ;
     c'est `required` qui porte l'obligation là où elle est annoncée.
   - **l'œil annonce son état.** Son libellé change selon qu'il montre ou
     masque ; `aria-pressed` porte l'état. Sans cela, l'annonce serait la
     même dans les deux situations.
   ===================================================================== */
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes
} from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';

export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Icône de tête ; purement indicative. */
  icon?: IconName;
  /** Message d'erreur déjà traduit, rattaché par `aria-describedby`. */
  error?: string;
  hint?: string;
}

/** Construit les attributs partagés par les variantes. */
function useFieldIds(id: string | undefined, error?: string, hint?: string) {
  const auto = useId();
  const fieldId = id ?? auto;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');
  return { fieldId, errorId, hintId, describedBy: describedBy || undefined };
}

function Label({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label className="au-label" htmlFor={htmlFor}>
      {label}
      {required ? (
        <span className="au-req" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

function Messages({
  error,
  hint,
  errorId,
  hintId
}: {
  error?: string;
  hint?: string;
  errorId: string;
  hintId: string;
}) {
  return (
    <>
      {hint ? (
        <span className="au-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="au-error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}

export function AuthField({ label, icon, error, hint, id, required, ...rest }: AuthFieldProps) {
  const { fieldId, errorId, hintId, describedBy } = useFieldIds(id, error, hint);

  return (
    <div className="au-group">
      <Label htmlFor={fieldId} label={label} required={required} />
      <div className="au-input-wrap">
        {icon ? (
          <span className="au-input-icon" aria-hidden="true">
            <Icon name={icon} size={17} />
          </span>
        ) : null}
        <input
          {...rest}
          id={fieldId}
          required={required}
          className={`au-input${icon ? ' au-has-icon' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      </div>
      <Messages error={error} hint={hint} errorId={errorId} hintId={hintId} />
    </div>
  );
}

/** Champ de mot de passe, avec bascule d'affichage. */
export function AuthPasswordField({
  label,
  icon = 'lock',
  error,
  hint,
  id,
  required,
  ...rest
}: AuthFieldProps) {
  const { t } = useI18n();
  const { fieldId, errorId, hintId, describedBy } = useFieldIds(id, error, hint);
  const [shown, setShown] = useState(false);

  return (
    <div className="au-group">
      <Label htmlFor={fieldId} label={label} required={required} />
      <div className="au-input-wrap">
        {icon ? (
          <span className="au-input-icon" aria-hidden="true">
            <Icon name={icon} size={17} />
          </span>
        ) : null}
        <input
          {...rest}
          id={fieldId}
          required={required}
          type={shown ? 'text' : 'password'}
          className={`au-input au-has-eye${icon ? ' au-has-icon' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="au-eye"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? t('auth.shell.hidePassword') : t('auth.shell.showPassword')}
          aria-pressed={shown}
        >
          <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      <Messages error={error} hint={hint} errorId={errorId} hintId={hintId} />
    </div>
  );
}

/* ------------------------------------------------------------ liste -- */

export interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: IconName;
  options: (string | { value: string; label: string })[];
  /** Première ligne, affichée tant que rien n'est choisi. */
  placeholder?: string;
  error?: string;
  hint?: string;
}

export function AuthSelectField({
  label,
  icon,
  options,
  placeholder,
  error,
  hint,
  id,
  required,
  ...rest
}: AuthSelectProps) {
  const { fieldId, errorId, hintId, describedBy } = useFieldIds(id, error, hint);

  return (
    <div className="au-group">
      <Label htmlFor={fieldId} label={label} required={required} />
      <div className="au-input-wrap">
        {icon ? (
          <span className="au-input-icon" aria-hidden="true">
            <Icon name={icon} size={17} />
          </span>
        ) : null}
        <select
          {...rest}
          id={fieldId}
          required={required}
          defaultValue={rest.defaultValue ?? ''}
          className={`au-input au-select${icon ? ' au-has-icon' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const text = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
        <span className="au-select-chev" aria-hidden="true">
          <Icon name="chevronDown" size={16} />
        </span>
      </div>
      <Messages error={error} hint={hint} errorId={errorId} hintId={hintId} />
    </div>
  );
}

/* --------------------------------------------------------- téléphone -- */

/**
 * Indicatifs proposés devant le numéro.
 *
 * L'Algérie d'abord — c'est le public de la plateforme —, puis le Maghreb
 * et les pays francophones d'où viennent les autres inscriptions. Le
 * drapeau est un emoji, pas une image : il suit la police du système et
 * ne coûte aucune requête.
 */
const DIAL_CODES: { code: string; flag: string; name: string }[] = [
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' }
];

export interface AuthPhoneProps {
  /** Nom du champ numéro ; l'indicatif part sous `<name>Code`. */
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  autoComplete?: string;
}

/**
 * Numéro de téléphone : indicatif à part, numéro ensuite.
 *
 * Les deux partent dans le formulaire sous des noms distincts, puis sont
 * recomposés à la soumission. Un seul champ libre obligerait à deviner
 * l'indicatif à l'analyse, ce qui échoue dès qu'on écrit « 0550… ».
 */
export function AuthPhoneField({
  name,
  label,
  placeholder,
  required,
  error,
  hint,
  autoComplete = 'tel'
}: AuthPhoneProps) {
  const { t } = useI18n();
  const { fieldId, errorId, hintId, describedBy } = useFieldIds(undefined, error, hint);

  return (
    <div className="au-group">
      <Label htmlFor={fieldId} label={label} required={required} />
      <div className="au-phone">
        <span className="au-input-wrap au-phone-code">
          <label className="sr-only" htmlFor={`${fieldId}-code`}>
            {t('auth.register.dialCode')}
          </label>
          <select id={`${fieldId}-code`} name={`${name}Code`} className="au-input au-select" defaultValue="+213">
            {DIAL_CODES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.flag} {entry.code}
              </option>
            ))}
          </select>
          <span className="au-select-chev" aria-hidden="true">
            <Icon name="chevronDown" size={15} />
          </span>
        </span>
        <span className="au-input-wrap au-phone-number">
          <input
            id={fieldId}
            name={name}
            type="tel"
            inputMode="tel"
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className="au-input"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
        </span>
      </div>
      <Messages error={error} hint={hint} errorId={errorId} hintId={hintId} />
    </div>
  );
}

/* ============================================================ case -- */

/**
 * Case à cocher dessinée.
 *
 * La case native ne se met pas aux couleurs de la charte sur tous les
 * navigateurs. L'input reste là, seulement masqué visuellement : il garde
 * le focus, la navigation clavier et l'annonce de son état.
 */
export function AuthCheckbox({
  name,
  label,
  defaultChecked
}: {
  name: string;
  label: ReactNode;
  defaultChecked?: boolean;
}) {
  return (
    <label className="au-check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className="au-check-box" aria-hidden="true">
        <Icon name="check" size={12} />
      </span>
      <span>{label}</span>
    </label>
  );
}

/* ================================================== texte à liens ---- */

/**
 * Découpe un libellé traduit sur ses jetons `{clé}` et y insère des
 * nœuds.
 *
 * Écrire « J'accepte {terms} et {privacy}. » plutôt que de concaténer
 * trois fragments laisse chaque langue placer ses liens où sa grammaire
 * l'exige — l'arabe ne suit pas l'ordre du français.
 */
export function withNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{[a-zA-Z]+\})/g).map((part, index) => {
    const key = part.startsWith('{') && part.endsWith('}') ? part.slice(1, -1) : null;
    return <span key={index}>{key && key in nodes ? nodes[key] : part}</span>;
  });
}
