import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

const ALLOWED_EMAIL = 'officialklip@gmail.com';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '16px',
        letterSpacing: '2px',
      }}>
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/control-panel/login" replace />;
  }

  if (user.email !== ALLOWED_EMAIL) {
    signOut();
    return <Navigate to="/control-panel/login" replace />;
  }

  return <>{children}</>;
}
