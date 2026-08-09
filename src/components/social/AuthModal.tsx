import { useState } from 'react';
import { useSocialStore } from '../../stores/useSocialStore';
import { C } from '../../data/constants';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: C.dim,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 12,
  color: '#fff',
  marginBottom: 8,
  fontFamily: "'DM Mono'",
  fontSize: 14,
};

const SIGNIN_TEXT = 'Entra na tua conta para veres leaderboards, duelos e clubes.';
const SIGNUP_TEXT = 'Cria uma conta pública — o teu username e as marcas que publicares ficam visíveis a outros utilizadores.';
const SUBMIT_LABEL: Record<'signin' | 'signup', string> = { signin: 'ENTRAR', signup: 'CRIAR CONTA' };
const TOGGLE_LABEL: Record<'signin' | 'signup', string> = {
  signin: 'Ainda não tens conta? Regista-te',
  signup: 'Já tens conta? Entra',
};

function isSubmitDisabled(mode: 'signin' | 'signup', authLoading: boolean, email: string, password: string, username: string): boolean {
  if (authLoading || !email || !password) return true;
  return mode === 'signup' && !username;
}

export const AuthModal = () => {
  const { signIn, signUp, authLoading, authError } = useSocialStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const isSignIn = mode === 'signin';
  const isDisabled = isSubmitDisabled(mode, authLoading, email, password, username);
  const submitLabel = authLoading ? 'A processar...' : SUBMIT_LABEL[mode];

  const handleSubmit = async () => {
    if (isSignIn) {
      await signIn(email, password);
      return;
    }
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (clean.length < 3 || clean.length > 24) {
      alert("O username deve ter entre 3 e 24 caracteres.");
      return;
    }
    await signUp(email, password, clean);
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
        {isSignIn ? SIGNIN_TEXT : SIGNUP_TEXT}
      </p>

      {!isSignIn && (
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (ex: jucimar_pt)"
          style={inputStyle}
        />
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={inputStyle}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Palavra-passe"
        style={inputStyle}
      />

      {authError && (
        <p style={{ fontSize: 12, color: C.red, marginBottom: 8 }}>{authError}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: 14,
          background: C.accent,
          color: C.bg,
          fontWeight: 'bold',
          borderRadius: 8,
          cursor: 'pointer',
          border: 'none',
          opacity: authLoading ? 0.6 : 1,
        }}
      >
        {submitLabel}
      </button>

      <button
        onClick={() => setMode(isSignIn ? 'signup' : 'signin')}
        style={{ width: '100%', marginTop: 10, background: 'transparent', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer' }}
      >
        {TOGGLE_LABEL[mode]}
      </button>
    </div>
  );
};