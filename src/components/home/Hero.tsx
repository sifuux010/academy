/* =====================================================================
   Carrousel de bannières
   ---------------------------------------------------------------------
   Deux bannières côte à côte sur grand écran, une seule au doigt — c'est
   la grille CSS qui change, pas le balisage.

   Trois égards, parce qu'un carrousel est l'un des motifs les plus
   faciles à rendre hostile :

   - il n'avance **jamais seul** ; rien ne disparaît sous les yeux de qui
     lit lentement ;
   - les pastilles sont de vrais boutons, nommés, avec `aria-current` ;
   - le défilement natif reste la source de vérité : le balayage et le
     clavier marchent sans code supplémentaire, et le sens suit la
     direction du document (en arabe, `scrollLeft` est négatif).
   ===================================================================== */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';
import { Blob, Doodle } from './Decor';
import type { HomeBanner } from '../../hooks/useHomeData';

/** Les habillages clairs portent un bouton plein, les sombres un bouton blanc. */
const LIGHT_THEMES = new Set(['sand', 'mint']);

function Banner({ banner }: { banner: HomeBanner }) {
  const { href } = useI18n();
  const external = /^https?:\/\//.test(banner.ctaHref);
  const target = banner.ctaHref.startsWith('/')
    ? href(banner.ctaHref.slice(1))
    : banner.ctaHref;
  const btnClass = `lp-btn ${LIGHT_THEMES.has(banner.theme) ? 'lp-btn-primary' : 'lp-btn-light'}`;

  return (
    <article className={`lp-banner lp-hero-${banner.theme}`}>
      <div className="lp-banner-body">
        {banner.partner?.logoUrl ? (
          <img className="lp-banner-logo" src={banner.partner.logoUrl} alt={banner.partner.name} />
        ) : banner.eyebrow && !banner.imageUrl ? (
          /* Sur une bannière illustrée, la pastille est sacrifiée : le
             visuel donne déjà le contexte, et la hauteur est comptée. */
          <span className="lp-banner-badge">{banner.eyebrow}</span>
        ) : null}

        <h2 className="lp-banner-title">{banner.title}</h2>
        {banner.body ? <p className="lp-banner-text">{banner.body}</p> : null}

        {banner.ctaLabel ? (
          <div className="lp-banner-actions">
          {external ? (
            <a className={btnClass} href={target} target="_blank" rel="noopener noreferrer">
              {banner.ctaLabel}
              <Icon name="arrowRight" size={16} className="icon-flip" />
            </a>
          ) : (
            <Link className={btnClass} to={target}>
              {banner.ctaLabel}
              <Icon name="arrowRight" size={16} className="icon-flip" />
            </Link>
          )}
          </div>
        ) : null}
      </div>

      {banner.imageUrl ? (
        /* `alt=""` : le visuel illustre le titre, il ne le complète pas.
           Le décrire répéterait ce que le texte dit déjà.

           Il vient après le texte dans le document — c'est l'ordre de
           lecture — et passe à gauche par `order` sur grand écran. */
        <div className="lp-banner-art">
          <img className="lp-banner-image" src={banner.imageUrl} alt="" loading="lazy" />
        </div>
      ) : (
        <>
          <Blob seed={banner.title.length} className="lp-banner-blob" />
          <Doodle name="dots" className="lp-banner-dots" />
          <div className="lp-banner-art lp-banner-pattern" aria-hidden="true" />
        </>
      )}
    </article>
  );
}

export function Hero({ banners }: { banners: HomeBanner[] }) {
  const { t, dir } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const step = first.getBoundingClientRect().width + 16;
    setIndex(Math.round(Math.abs(track.scrollLeft) / step));
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [banners.length]);

  const goTo = (next: number) => {
    const track = trackRef.current;
    const slide = track?.children[next] as HTMLElement | undefined;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !slide || !first) return;
    const offset = slide.offsetLeft - first.offsetLeft;
    track.scrollTo({ left: dir === 'rtl' ? -offset : offset, behavior: 'smooth' });
  };

  if (!banners.length) return null;

  return (
    <section className="lp-hero" aria-roledescription="carousel" aria-label={t('showcase.carousel')}>
      <div className="lp-hero-track" ref={trackRef} onScroll={onScroll}>
        {banners.map((banner) => (
          <Banner key={banner.id} banner={banner} />
        ))}
      </div>

      {banners.length > 1 ? (
        <div className="lp-dots" role="tablist" aria-label={t('showcase.chooseSlide')}>
          {banners.map((banner, position) => (
            <button
              key={banner.id}
              type="button"
              role="tab"
              className={`lp-dot${position === index ? ' is-active' : ''}`}
              aria-current={position === index}
              aria-label={banner.title}
              onClick={() => goTo(position)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
