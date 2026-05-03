import { useState } from 'react';
import { sb } from '../lib/supabase.js';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    const { error: err } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) { setError(err.message); } else { setSent(true); }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-text1 font-semibold text-xl tracking-tight">ArtTech</span>
          <span className="text-text3 text-sm ml-1">Precios</span>
          <p className="text-text3 text-xs mt-2">Gestión de precios para vendedores</p>
        </div>

        <div className="card">
          {!sent ? (
            <>
              <h1 className="section-title mb-1">Iniciar sesión</h1>
              <p className="text-text3 text-xs mb-4">Te enviaremos un enlace mágico a tu correo.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="label">Correo electrónico</label>
                  <input type="email" className="input" placeholder="tu@correo.com"
                    value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
                {error && <p className="text-danger text-xs">{error}</p>}
                <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="text-2xl mb-3">📬</div>
              <h2 className="section-title mb-1">Revisa tu correo</h2>
              <p className="text-text2 text-sm">
                Enviamos un enlace a <span className="text-text1">{email}</span>.<br />
                Haz clic en él para entrar.
              </p>
              <button className="btn mt-4 text-xs" onClick={() => { setSent(false); setEmail(''); }}>
                Usar otro correo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
