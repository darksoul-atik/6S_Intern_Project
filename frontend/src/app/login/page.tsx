import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a10]" />}>
      <LoginForm />
    </Suspense>
  );
}
