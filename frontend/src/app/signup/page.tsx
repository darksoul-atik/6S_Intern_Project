import { Suspense } from 'react';
import { SignupForm } from '@/features/auth/components/signup-form';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a10]" />}>
      <SignupForm />
    </Suspense>
  );
}
