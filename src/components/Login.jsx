import { useState } from 'react';
import { tokens as t } from '../theme.js';
import { login as apiLogin, register as apiRegister } from '../api/auth.js';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${t.hairline}`,
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  color: t.ink,
  background: '#fff',
  outline: 'none',
};

/**
 * Auth screen — email/password login and registration against the FastAPI backend.
 * Registration also collects phone (required by the API).
 */
export default function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const signup = mode === 'signup';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const user = signup
        ? await apiRegister({
            email: email.trim(),
            phone: phone.trim(),
            password,
            full_name: fullName.trim() || null,
          })
        : await apiLogin({ email: email.trim(), password });
      onAuthenticated?.(user);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: t.bg, padding: '24px',
    }}>
      <form onSubmit={submit} style={{
        width: '100%', maxWidth: '380px', background: t.bgCard, borderRadius: '12px',
        border: `1px solid ${t.hairline}`, padding: '28px 24px',
        boxShadow: '0 8px 30px rgba(43,36,32,0.06)',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: t.ink, letterSpacing: '-0.3px' }}>
            FarmTrack
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: t.inkSoft }}>
            {signup ? 'Create your account to start mapping parcels.' : 'Sign in to your land records.'}
          </p>
        </div>

        {signup && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: t.inkSoft }}>
            Full name <span style={{ fontWeight: 400 }}>(optional)</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: t.inkSoft }}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        {signup && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: t.inkSoft }}>
            Phone
            <input
              type="tel"
              required
              autoComplete="tel"
              placeholder="+2547…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: t.inkSoft }}>
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete={signup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {message && (
          <div role="alert" style={{
            fontSize: '12px', borderRadius: '6px', padding: '8px 10px',
            color: message.type === 'ok' ? '#065F46' : t.errorText,
            background: message.type === 'ok' ? '#ECFDF5' : t.errorBg,
            border: `1px solid ${message.type === 'ok' ? '#10B981' : t.errorBorder}`,
          }}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            background: t.ink, color: '#fff', border: 'none', borderRadius: '8px', padding: '12px',
            fontSize: '14px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
          <button
            type="button"
            onClick={() => { setMode(signup ? 'signin' : 'signup'); setMessage(null); }}
            style={{ background: 'none', border: 'none', color: t.sage, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            {signup ? 'Have an account? Sign in' : 'New here? Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
