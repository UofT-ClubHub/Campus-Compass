import type { User } from '@/model/types';

export type Role = 'admin' | 'exec' | 'user';

export function getRole(user?: Pick<User, 'is_admin' | 'is_executive' | 'managed_clubs'> | null): Role {
  return user?.is_admin ? 'admin' : user?.is_executive || user?.managed_clubs?.length ? 'exec' : 'user';
}

// Mid-tone shades with alpha backgrounds read on both the light and dark themes (data-theme)
export const ROLE_STYLES: Record<Role, { label: string; badge: string; border: string }> = {
  admin: { label: 'Admin', badge: 'bg-purple-500/15 text-purple-500 border border-purple-500/30', border: 'border-l-4 border-l-purple-500' },
  exec: { label: 'Exec', badge: 'bg-blue-500/15 text-blue-500 border border-blue-500/30', border: 'border-l-4 border-l-blue-500' },
  user: { label: 'User', badge: 'bg-gray-500/15 text-gray-500 border border-gray-500/30', border: 'border-l-4 border-l-gray-500' },
};

export default function RoleBadge({ user }: { user?: Pick<User, 'is_admin' | 'is_executive' | 'managed_clubs'> | null }) {
  if (!user) return null;
  const { label, badge } = ROLE_STYLES[getRole(user)];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{label}</span>;
}
