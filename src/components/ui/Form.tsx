/* =====================================================================
   Champs de formulaire accessibles
   ---------------------------------------------------------------------
   Formulaires non contrôlés (valeurs lues à la soumission via FormData),
   comme dans la version d'origine : moins d'état, même comportement.
   Chaque erreur est rattachée à son champ (aria-invalid + role="alert").
   ===================================================================== */
import type { ChangeEvent, ReactNode } from 'react';

interface BaseFieldProps {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  /** Message d'erreur déjà traduit. */
  error?: string;
}

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id}>
      {label}
      {required ? (
        <>
          {' '}
          <span className="required" aria-hidden="true">
            *
          </span>
        </>
      ) : null}
    </label>
  );
}

function Feedback({ hint, error }: { hint?: string; error?: string }) {
  return (
    <>
      {hint ? <p className="hint">{hint}</p> : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function Field({
  name,
  label,
  type = 'text',
  defaultValue,
  required,
  autoComplete,
  placeholder,
  hint,
  error,
  maxLength
}: BaseFieldProps & {
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'datetime-local' | 'url';
  defaultValue?: string | number;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = `f-${name}`;
  return (
    <div className="field">
      <Label id={id} label={label} required={required} />
      <input
        className="input"
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <Feedback hint={hint} error={error} />
    </div>
  );
}

export type Option = string | { value: string; label: string };

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  required,
  hint,
  error,
  onChange,
  placeholderOption = true
}: BaseFieldProps & {
  options: Option[];
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  placeholderOption?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div className="field">
      <Label id={id} label={label} required={required} />
      <select
        className="select"
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        onChange={onChange}
      >
        {placeholderOption ? <option value="">—</option> : null}
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const text = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
      <Feedback hint={hint} error={error} />
    </div>
  );
}

export function TextareaField({
  name,
  label,
  defaultValue,
  required,
  hint,
  error,
  maxLength,
  placeholder
}: BaseFieldProps & { defaultValue?: string; maxLength?: number; placeholder?: string }) {
  const id = `f-${name}`;
  return (
    <div className="field">
      <Label id={id} label={label} required={required} />
      <textarea
        className="textarea"
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={error ? true : undefined}
        maxLength={maxLength}
        placeholder={placeholder}
      />
      <Feedback hint={hint} error={error} />
    </div>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
  checked,
  onChange,
  value
}: {
  name?: string;
  label: ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

export function CheckboxGroup({
  name,
  label,
  options,
  values,
  hideLabel
}: {
  name: string;
  label: string;
  options: string[];
  values?: string[];
  /**
   * Masque le libellé visuellement quand le contexte le porte déjà — une
   * ligne de formulaire, par exemple. Il reste annoncé : le groupe garde
   * son nom, seul l'affichage en double disparaît.
   */
  hideLabel?: boolean;
}) {
  const selected = values ?? [];
  return (
    <div className="field" role="group" aria-label={label}>
      <span className={hideLabel ? 'sr-only' : 'label'}>{label}</span>
      <div className="grid grid-2 gap-0">
        {options.map((option) => (
          <Checkbox key={option} name={name} value={option} label={option} defaultChecked={selected.includes(option)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ lecture */

export interface FormReader {
  get: (name: string) => string;
  getAll: (name: string) => string[];
  checked: (name: string) => boolean;
}

export function readForm(form: HTMLFormElement): FormReader {
  const data = new FormData(form);
  return {
    get: (name) => String(data.get(name) ?? '').trim(),
    getAll: (name) => data.getAll(name).map((v) => String(v)),
    checked: (name) => data.has(name)
  };
}

/** Place le focus sur le premier champ en erreur après le rendu. */
export function focusFirstError(form: HTMLFormElement | null): void {
  window.setTimeout(() => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
}

/** Traduit une table d'erreurs { champ: clé } en { champ: message }. */
export function translateErrors(errors: Record<string, string> | undefined, t: (key: string) => string): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(errors ?? {}).forEach(([key, value]) => {
    out[key] = t(value);
  });
  return out;
}
