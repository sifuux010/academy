/* Protection des routes : session requise, rôle minimal requis. */
import { Outlet } from 'react-router';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROLE_LEVEL } from '../../lib/auth';
import type { Role } from '../../model/common';
import { AuthRequired, RoleRequired } from '../ui';

export function RequireAuth() {
  const user = useCurrentUser();
  return user ? <Outlet /> : <AuthRequired />;
}

export function RequireRole({ role }: { role: Role }) {
  const user = useCurrentUser();
  if (!user) return <AuthRequired />;
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL[role] ? <Outlet /> : <RoleRequired />;
}
