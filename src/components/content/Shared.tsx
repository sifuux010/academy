/* Blocs partagés par les fiches de contenu : listes, auteur, pathologies. */
import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { getById, pathologyName } from '../../lib/content';
import { Avatar } from '../ui';

export function BulletList({ items }: { items?: string[] | null }) {
  if (!items?.length) return null;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function OrderedList({ items }: { items?: string[] | null }) {
  if (!items?.length) return null;
  return (
    <ol>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ol>
  );
}

/** Carte « À propos de l'auteur / Formateur / Intervenant ». */
export function AuthorCard({ authorId, heading }: { authorId?: string; heading: string }) {
  const author = getById('authors', authorId);
  if (!author) return null;
  return (
    <section className="card mt-8">
      <h3 className="card-title">{heading}</h3>
      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <Avatar user={{ firstName: author.firstName, lastName: author.lastName }} />
        <div>
          <strong>
            {author.firstName} {author.lastName}
          </strong>
          <p className="text-sm text-muted">{author.title}</p>
          <p className="text-sm mb-0">{author.bio}</p>
        </div>
      </div>
    </section>
  );
}

/** Carte latérale listant les pathologies liées. */
export function PathologyTagsCard({ slugs, heading }: { slugs?: string[]; heading: string }) {
  const { href } = useI18n();
  if (!slugs?.length) return null;
  return (
    <div className="card">
      <strong>{heading}</strong>
      <div className="row-wrap mt-4">
        {slugs.map((slug) => (
          <Link key={slug} className="tag" to={href(`pathologies/${slug}`)}>
            {pathologyName(slug)}
          </Link>
        ))}
      </div>
    </div>
  );
}
