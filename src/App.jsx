import { useEffect, useState } from 'react';
import Dashboard from './Dashboard.jsx';
import { request } from './api.js';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request('session')
      .then(() => setAuthenticated(true))
      .catch((error) => {
        if (error.status !== 401) setError(error.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await request('login', {
        username: fields.get('username'),
        password: fields.get('password'),
      });
      setAuthenticated(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="login-page" role="status">
        Conectando con Nova Salud…
      </div>
    );
  if (authenticated) return <Dashboard onSessionExpired={() => setAuthenticated(false)} />;
  return (
    <main className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />
      <section className="login-card">
        <div className="login-brand">
          <span className="brand-icon">✚</span>
          <span>Nova Salud<small>GESTIÓN DE BOTICA</small></span>
        </div>
        <p className="eyebrow">PORTAL DE ADMINISTRACIÓN</p>
        <h1>Tu botica,<br />bajo control.</h1>
        <p className="muted">Inicia sesión para gestionar el inventario y atender cada venta.</p>
        <form onSubmit={login} className="form-grid">
          <label>
            Usuario
            <input name="username" autoComplete="username" required maxLength={100} />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
            />
          </label>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary login-submit" disabled={busy}>
            {busy ? 'Verificando acceso…' : 'Entrar al sistema'}
          </button>
        </form>
      </section>
    </main>
  );
}
