/* =====================================================================
   En-tête de fiche détaillée
   ---------------------------------------------------------------------
   Bandeau teinté — signature, titre, accroche, intervenants, action —
   suivi d'une barre de repères (durée, niveau, note, volume) posée à
   cheval sur le bas du bandeau.

   Sur mobile, l'action principale est répétée dans une barre collée en
   bas de l'écran : la décision reste à portée de pouce quand on a fait
   défiler toute la fiche. Elle est masquée à l'impression et aux
   lecteurs d'écran — le bouton d'origine, lui, reste dans le flux.
   ===================================================================== */
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface HeroFact {
  /** Valeur mise en avant, en gras. */
  value: string;
  /** Libellé sous la valeur. */
  label: string;
  /** Précision facultative, en petit. */
  hint?: string;
  icon?: IconName;
}

export interface HeroPerson {
  name: string;
  /** Initiales affichées à défaut de portrait. */
  initials: string;
  avatarUrl?: string;
}

export interface DetailHeroProps {
  /** Logo ou nom de l'établissement signataire. */
  signature?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  people?: HeroPerson[];
  peopleLabel?: string;
  /** Bouton principal : déjà construit par la page, qui sait quoi en faire. */
  action?: ReactNode;
  /** Ligne sous le bouton : nombre d'inscrits, accès inclus… */
  actionNote?: ReactNode;
  badges?: ReactNode;
  facts?: HeroFact[];
}

export function DetailHero({
  signature,
  eyebrow,
  title,
  subtitle,
  description,
  people = [],
  peopleLabel,
  action,
  actionNote,
  badges,
  facts = []
}: DetailHeroProps) {
  return (
    <div className="dh">
      <div className="dh-band">
        <div className="dh-band-inner">
          {signature ? <div className="dh-signature">{signature}</div> : null}
          {eyebrow ? <p className="dh-eyebrow">{eyebrow}</p> : null}

          <h1 className="dh-title">{title}</h1>
          {subtitle ? <p className="dh-subtitle">{subtitle}</p> : null}
          {description ? <p className="dh-desc">{description}</p> : null}

          {badges ? <div className="dh-badges">{badges}</div> : null}

          {people.length ? (
            <div className="dh-people">
              <span className="dh-avatars" aria-hidden="true">
                {people.slice(0, 3).map((person) => (
                  <span key={person.name} className="dh-avatar">
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt="" />
                    ) : (
                      person.initials
                    )}
                  </span>
                ))}
              </span>
              <span className="dh-people-names">
                {peopleLabel ? <span className="dh-people-label">{peopleLabel}</span> : null}
                {people.map((person) => person.name).join(' · ')}
              </span>
            </div>
          ) : null}

          {action ? (
            <div className="dh-action">
              {action}
              {actionNote ? <p className="dh-action-note">{actionNote}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      {facts.length ? (
        <div className="dh-facts">
          {facts.map((fact) => (
            <div key={fact.label} className="dh-fact">
              <span className="dh-fact-value">
                {fact.icon ? <Icon name={fact.icon} size={15} /> : null}
                {fact.value}
              </span>
              <span className="dh-fact-label">{fact.label}</span>
              {fact.hint ? <span className="dh-fact-hint">{fact.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      {action ? (
        <div className="dh-sticky" aria-hidden="true">
          {action}
        </div>
      ) : null}
    </div>
  );
}

/** Initiales d'un nom, pour l'avatar de repli. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
