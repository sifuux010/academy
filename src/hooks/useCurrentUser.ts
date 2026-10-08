/* Membre connecté, réactif : le composant se redessine à la connexion,
   à la déconnexion et à chaque modification du profil. */
import { currentUser } from '../lib/auth';
import type { PublicUser } from '../model/account';
import { useStoreVersion } from '../state/store';

export function useCurrentUser(): PublicUser | null {
  useStoreVersion();
  return currentUser();
}
