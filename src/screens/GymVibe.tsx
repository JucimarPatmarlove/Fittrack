import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useState } from 'react';
import { C } from '../data/constants';
import { useVibeStore } from '../stores/useVibeStore';

const PLAYLISTS = [
  {
    label: '💀 Heavy Iron',
    genre: 'Metal/Rock',
    goal: 'forca',
    spotifyUrl: 'https://open.spotify.com',
  },
  {
    label: '⚡ Beast Mode',
    genre: 'Hip-Hop/Trap',
    goal: 'hipertrofia',
    spotifyUrl: 'https://open.spotify.com',
  },
  {
    label: '🔥 Fat Burner',
    genre: 'EDM/House',
    goal: 'perda_peso',
    spotifyUrl: 'https://open.spotify.com',
  },
  {
    label: '🧘 Flow State',
    genre: 'Lo-fi/Ambient',
    goal: 'condicionamento',
    spotifyUrl: 'https://open.spotify.com',
  },
  {
    label: '🎯 Focus',
    genre: 'Techno/Minimal',
    goal: 'all',
    spotifyUrl: 'https://open.spotify.com',
  },
  {
    label: '🏃 Cardio Rush',
    genre: 'Pop/Dance',
    goal: 'perda_peso',
    spotifyUrl: 'https://open.spotify.com',
  },
];

export default function GymVibe({ profile }: any) {
  const [activeTab, setActiveTab] = useState<'myvibe' | 'gymnow' | 'playlists'>('myvibe');
  const { saveVibe, getRecentVibes, importVibesFromJSON, exportVibesToJSON, clearOldVibes } =
    useVibeStore();

  const [song, setSong] = useState('');
  const [url, setUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [toast, setToast] = useState('');

  const recentVibes = getRecentVibes(2);

  useEffect(() => {
    clearOldVibes();
    const interval = setInterval(clearOldVibes, 60000); // 1 min check
    return () => clearInterval(interval);
  }, [clearOldVibes]);

  const handlePublish = () => {
    if (!song.trim()) {
      setToast('A música é obrigatória!');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    saveVibe({
      userName: profile.name || 'Anónimo',
      song: song.trim(),
      url: url.trim() || null,
      isPublic,
      goal: profile.goal,
    });

    setSong('');
    setUrl('');
    setToast('Vibe publicado com sucesso! 🔥');
    setTimeout(() => setToast(''), 3000);
    if (isPublic) {
      setTimeout(() => setActiveTab('gymnow'), 1000);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importVibesFromJSON(file)
        .then(() => {
          setToast('Vibes importados!');
          setTimeout(() => setToast(''), 3000);
        })
        .catch((err) => {
          setToast('Erro ao importar: ' + err.message);
          setTimeout(() => setToast(''), 3000);
        });
    }
  };

  return (
    <div style={{ padding: '18px', maxWidth: 480, margin: '0 auto', paddingBottom: 90 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <p
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 24,
            letterSpacing: 2,
            margin: 0,
            color: C.accent,
          }}
        >
          GYM VIBE 🎵
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('myvibe')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'myvibe' ? C.accent : C.surface,
            color: activeTab === 'myvibe' ? '#000' : C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          O MEU VIBE
        </button>
        <button
          onClick={() => setActiveTab('gymnow')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'gymnow' ? C.accent : C.surface,
            color: activeTab === 'gymnow' ? '#000' : C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          GINÁSIO AGORA
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'playlists' ? C.accent : C.surface,
            color: activeTab === 'playlists' ? '#000' : C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          PLAYLISTS
        </button>
      </div>

      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: C.accentLow,
              color: C.accent,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              border: `1px solid ${C.accent}`,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: 13,
            }}
          >
            {toast}
          </motion.div>
        )}

        {activeTab === 'myvibe' && (
          <motion.div
            key="myvibe"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="glass" style={{ padding: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                O QUE ESTÁS A OUVIR?
              </label>
              <input
                type="text"
                value={song}
                onChange={(e) => setSong(e.target.value)}
                placeholder="Ex: Doom Soundtrack - BFG Division"
                style={{
                  width: '100%',
                  background: '#0f1419',
                  border: `1px solid #2a2f36`,
                  borderRadius: 8,
                  padding: 12,
                  color: C.text,
                  marginBottom: 16,
                  fontSize: 14,
                }}
              />

              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                LINK SPOTIFY / YOUTUBE (OPCIONAL)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  background: '#0f1419',
                  border: `1px solid #2a2f36`,
                  borderRadius: 8,
                  padding: 12,
                  color: C.text,
                  marginBottom: 20,
                  fontSize: 14,
                }}
              />

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px',
                  background: isPublic ? `${C.accent}22` : C.bg,
                  border: `1px solid ${isPublic ? C.accent : '#2a2f36'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 20,
                }}
              >
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: C.accent }}
                />
                <div>
                  <span
                    style={{
                      fontSize: 14,
                      color: isPublic ? C.accent : C.text,
                      fontWeight: 'bold',
                    }}
                  >
                    PARTILHAR COM O GINÁSIO
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: C.muted }}>
                    A tua música vai aparecer no feed durante 4 horas.
                  </span>
                </div>
              </label>

              <button
                onClick={handlePublish}
                style={{
                  width: '100%',
                  background: C.accent,
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  padding: 14,
                  fontFamily: "'Bebas Neue'",
                  fontSize: 18,
                  letterSpacing: 2,
                  cursor: 'pointer',
                }}
              >
                PUBLICAR VIBE
              </button>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                border: `1px dashed ${C.border}`,
                borderRadius: 12,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                🛠 MODO LABORATÓRIO (P2P Simulação)
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <label
                  style={{
                    flex: 1,
                    background: C.surface,
                    padding: 8,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  IMPORTAR JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    style={{ display: 'none' }}
                  />
                </label>
                <button
                  onClick={exportVibesToJSON}
                  style={{
                    flex: 1,
                    background: C.surface,
                    padding: 8,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: C.text,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  EXPORTAR JSON
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'gymnow' && (
          <motion.div
            key="gymnow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {recentVibes.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: C.muted,
                  background: C.surface,
                  borderRadius: 12,
                }}
              >
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🎧</span>
                <p style={{ margin: 0, fontSize: 14 }}>O ginásio está em silêncio.</p>
                <p style={{ margin: 0, fontSize: 12 }}>Partilha o teu Vibe para animar a malta!</p>
              </div>
            ) : (
              recentVibes.map((vibe) => {
                const ageMinutes = Math.floor((Date.now() - vibe.timestamp) / 60000);
                const isHot = ageMinutes < 30;
                return (
                  <div
                    key={vibe.id}
                    className="glass"
                    style={{
                      padding: 16,
                      position: 'relative',
                      overflow: 'hidden',
                      borderLeft: isHot ? `4px solid ${C.accent}` : `1px solid ${C.border}`,
                    }}
                  >
                    {isHot && (
                      <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `radial-gradient(circle at right, ${C.accent}44, transparent)`,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          background: C.dim,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: C.accent,
                          fontSize: 14,
                        }}
                      >
                        {vibe.userName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: C.text,
                          }}
                        >
                          {vibe.userName}
                        </span>
                        <span style={{ display: 'block', fontSize: 10, color: C.muted }}>
                          há {ageMinutes} min
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: 11,
                            color: C.muted,
                            display: 'block',
                            marginBottom: 2,
                          }}
                        >
                          está a ouvir
                        </span>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: isHot ? C.accent : '#fff',
                          }}
                        >
                          {vibe.song}
                        </span>
                      </div>
                      <button
                        onClick={() => vibe.url && window.open(vibe.url, '_blank')}
                        disabled={!vibe.url}
                        style={{
                          background: vibe.url ? C.accentLow : C.surface,
                          color: vibe.url ? C.accent : C.muted,
                          border: `1px solid ${vibe.url ? C.accent : C.border}`,
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 'bold',
                          cursor: vibe.url ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        ▶ Abrir
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === 'playlists' && (
          <motion.div
            key="playlists"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            {PLAYLISTS.map((pl, i) => (
              <div
                key={i}
                className="glass"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 14, color: '#fff' }}>{pl.label}</h4>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      color: C.muted,
                      background: C.surface,
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginBottom: 12,
                    }}
                  >
                    {pl.genre}
                  </span>
                </div>
                <button
                  onClick={() => window.open(pl.spotifyUrl, '_blank')}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: `1px solid ${C.accent}`,
                    color: C.accent,
                    padding: '8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ▶ Spotify
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
