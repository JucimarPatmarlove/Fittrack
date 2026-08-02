import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, MapPin, Activity, Flame } from 'lucide-react';
import { C } from '../data/constants';
import { useCommunityStore } from '../stores/useCommunityStore';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function CommunityFeed({ profile }: any) {
  const { feed, giveKudos, populateMocksIfEmpty, addComment } = useCommunityStore();
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);

  useEffect(() => {
    populateMocksIfEmpty();
  }, [populateMocksIfEmpty]);

  const handleCommentSubmit = (postId: string) => {
    const text = commentInput[postId];
    if (text && text.trim()) {
      addComment(postId, text.trim(), profile?.name || 'Eu');
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
    }
  };

  return (
    <div style={{ padding: "18px", maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: 2, margin: 0, color: C.accent }}>COMUNIDADE</p>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>O teu feed de atividades global.</p>
        </div>
        <div style={{ background: 'rgba(204,255,0,0.1)', color: C.accent, padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>
          {feed.length} Treinos
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {feed.map((post) => {
          const timeAgo = formatDistanceToNow(post.timestamp, { addSuffix: true, locale: pt });
          
          return (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Header: User & Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: C.accent }}>
                  {post.avatarInitials}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: 16 }}>{post.userName}</h4>
                  <span style={{ color: C.muted, fontSize: 12 }}>{timeAgo}</span>
                </div>
              </div>

              {/* Title & Stats */}
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 20, fontWeight: 'bold', color: '#fff' }}>{post.workoutName}</h3>
                
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {post.durationMinutes > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>Tempo</span>
                      <span style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>{post.durationMinutes}m</span>
                    </div>
                  )}
                  {post.metrics.distanceKm && (
                    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}>
                      <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>Distância</span>
                      <span style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>{post.metrics.distanceKm.toFixed(2)} km</span>
                    </div>
                  )}
                  {post.metrics.pace && (
                    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}>
                      <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>Ritmo</span>
                      <span style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>{post.metrics.pace.toFixed(2)} /km</span>
                    </div>
                  )}
                  {post.metrics.volume && (
                    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}>
                      <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>Volume</span>
                      <span style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>{post.metrics.volume} kg</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Element (Mini-map for walks, abstract for gym) */}
              <div style={{ height: 150, borderRadius: 12, overflow: 'hidden', background: C.surface, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.isWalkingCoach ? (
                  <>
                    {/* Simulated Path */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline points="10,80 30,50 60,70 90,20" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 12 }}>
                      <MapPin size={12} color={C.accent} />
                      <span style={{ fontSize: 10, color: '#fff' }}>Rota GPS Registada</span>
                    </div>
                  </>
                ) : (
                  <>
                     <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(45deg, ${C.surface}, #1e2532)` }} />
                     <Activity size={48} color="rgba(255,255,255,0.05)" />
                     <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 12 }}>
                      <Flame size={12} color="#ff3366" />
                      <span style={{ fontSize: 10, color: '#fff' }}>{post.metrics.calories || 300} kcal Queimadas</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <button 
                  onClick={() => giveKudos(post.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: post.hasGivenKudos ? '#ff3366' : C.text, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <motion.div whileTap={{ scale: 1.5 }}>
                    <Heart size={20} fill={post.hasGivenKudos ? '#ff3366' : 'none'} color={post.hasGivenKudos ? '#ff3366' : C.muted} />
                  </motion.div>
                  <span>{post.kudos}</span>
                </button>
                <button 
                  onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.text, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <MessageSquare size={20} color={C.muted} />
                  <span>{post.comments.length}</span>
                </button>
              </div>

              {/* Comments Section */}
              <AnimatePresence>
                {activeCommentPost === post.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {post.comments.map((comment, i) => (
                        <div key={i} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8 }}>
                          <span style={{ fontWeight: 'bold', color: C.accent, marginRight: 8 }}>{comment.user}</span>
                          <span style={{ color: '#ccc' }}>{comment.text}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input 
                          type="text" 
                          placeholder="Adiciona um comentário..." 
                          value={commentInput[post.id] || ''}
                          onChange={(e) => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: '#fff', padding: '8px 12px', borderRadius: 20, fontSize: 13 }}
                        />
                        <button onClick={() => handleCommentSubmit(post.id)} style={{ background: C.accent, border: 'none', color: '#000', padding: '8px 16px', borderRadius: 20, fontWeight: 'bold', fontSize: 12, cursor: 'pointer' }}>
                          Enviar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
