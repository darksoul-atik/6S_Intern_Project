'use client';

import { use } from 'react';
import { ProfileView } from '@/features/users/components/profile-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DeveloperProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <ProfileView targetId={resolvedParams.id} />;
}
