/* =====================================================================
   Accès aux contenus premium
   ---------------------------------------------------------------------
   Module séparé pour éviter une dépendance circulaire auth ↔ abonnements.
   Un contenu `access: 'premium'` est servi aux membres qui ont :
   un rôle éditeur ou supérieur, le drapeau premium sur leur compte, ou
   un abonnement actif dont la formule ouvre le premium.
   ===================================================================== */
import type { Access } from '../model/common';
import { atLeast, currentUser } from './auth';
import { grantsPremium } from './subscriptions';

export function canAccess(item: { access?: Access } | null | undefined): boolean {
  if (!item || item.access !== 'premium') return true;
  const user = currentUser();
  if (!user) return false;
  if (atLeast('CONTENT_EDITOR')) return true;
  if (user.premium) return true;
  return grantsPremium(user.id);
}
