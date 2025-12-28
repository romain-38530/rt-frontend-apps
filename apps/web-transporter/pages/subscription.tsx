import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirection vers la nouvelle page d'upgrade avec Stripe
export default function SubscriptionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/upgrade');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <p style={{ color: '#64748b' }}>Redirection...</p>
    </div>
  );
}
