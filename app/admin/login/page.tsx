'use client';
import { useActionState } from 'react';
import { login } from '../actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null as any);
  return (
    <div className="adm login" >
      <form action={action} className="panel">
        <h1 style={{ fontFamily: 'var(--serif)' }}>Admin <span style={{ color: '#FF3E00' }}>Siakap Keli</span></h1>
        {state?.error && <div className="notice err">{state.error}</div>}
        <div className="field"><label htmlFor="email">E-mel</label><input id="email" name="email" type="email" required autoComplete="username" /></div>
        <div className="field"><label htmlFor="password">Kata laluan</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
        <button className="btn pri" disabled={pending} style={{ width: '100%', justifyContent: 'center' }}>{pending ? 'Sedang masuk…' : 'Log masuk'}</button>
      </form>
    </div>
  );
}
