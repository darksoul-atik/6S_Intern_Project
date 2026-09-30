'use client';

import { use } from 'react';
import { ProfileEditForm } from '@/features/users/components/profile-edit-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfileEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <ProfileEditForm targetId={resolvedParams.id} />;
}
