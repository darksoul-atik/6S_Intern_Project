import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User List — DevPulse',
  description: 'Manage users, roles, and platform permissions.',
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
