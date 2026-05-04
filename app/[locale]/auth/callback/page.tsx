import { Suspense } from 'react';
import AuthCallbackClient from '@/components/auth/AuthCallbackClient';

export default function LocalizedAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackClient />
    </Suspense>
  );
}
