import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
    setSubmitting(false);
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo">ФОРСАЖ</div>
        <p className="login-subtitle">Панель управления</p>

        {error && <div className="login-error">{error}</div>}

        <div className="admin-field">
          <label className="admin-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="admin-input"
            placeholder="admin@forsazh.online"
            required
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="admin-input"
            placeholder="Введите пароль"
            required
          />
        </div>

        <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
          {submitting ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
