import React, { useState } from 'react';
import { useEffortStore } from '../../stores/useEffortStore';
import { Activity, Coins, Zap } from 'lucide-react';
import { C } from '../../data/constants';

interface EffortTrackerProps {
  onEffortLogged?: () => void;
  workoutDurationMinutes?: number;
}

export const EffortTracker: React.FC<EffortTrackerProps> = ({ 
  onEffortLogged, 
  workoutDurationMinutes = 45 
}) => {
  const { totalEffortPoints, fitTokens, addEffort, convertEffortToTokens } = useEffortStore();
  const [rpe, setRpe] = useState<number>(7);
  const [isLogged, setIsLogged] = useState(false);

  const handleLogEffort = () => {
    addEffort(rpe, workoutDurationMinutes);
    setIsLogged(true);
    if (onEffortLogged) {
      onEffortLogged();
    }
  };

  const getRpeColor = (val: number) => {
    if (val <= 3) return '#10b981'; // Green
    if (val <= 6) return '#fbbf24'; // Yellow
    if (val <= 8) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, width: '100%', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>
          <Activity size={20} color={C.accent} />
          EFFORT TRACKING
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.bg, padding: '4px 10px', borderRadius: 20 }}>
            <Zap size={14} color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#fff' }}>{totalEffortPoints}</span>
          </div>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.bg, padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}
            onClick={convertEffortToTokens} title="Convert to $FIT Tokens"
          >
            <Coins size={14} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#fff' }}>{fitTokens} $FIT</span>
          </div>
        </div>
      </div>

      {!isLogged ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 14, color: C.text }}>Rate of Perceived Exertion (RPE)</label>
              <span style={{ fontSize: 16, fontWeight: 'bold', color: getRpeColor(rpe) }}>{rpe}/10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={rpe} 
              onChange={(e) => setRpe(Number(e.target.value))}
              style={{ width: '100%', accentColor: C.accent }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginTop: 8 }}>
              <span>Very Light</span>
              <span>Moderate</span>
              <span>Maximum</span>
            </div>
          </div>

          <div style={{ background: C.bg, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: C.muted, margin: '0 0 4px 0' }}>Est. Points Earned</p>
              <p style={{ fontSize: 22, fontWeight: 'bold', color: C.accent, margin: 0 }}>+{rpe * workoutDurationMinutes}</p>
            </div>
            <button 
              onClick={handleLogEffort}
              style={{ background: `linear-gradient(90deg, ${C.accent}, #00d4ff)`, color: '#000', fontWeight: 'bold', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Log Effort
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Zap size={32} color="#10b981" />
          </div>
          <h4 style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>Effort Logged!</h4>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>You earned {rpe * workoutDurationMinutes} points. Keep pushing!</p>
        </div>
      )}
    </div>
  );
};
