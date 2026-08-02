import { useState } from 'react';
import { motion } from 'framer-motion';

export const REWARDS = {
  muscleGroups: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'],
  bonuses: ['+15% Recovery', 'Rival AI -10%', 'XP Boost x2', 'Desconto 20%'],
  durations: ['próximas 4h', 'próximo treino', '24h', 'permanente (Premium)'],
};

export const spinRoulette = () => {
  const now = Date.now();
  const lastSpin = localStorage.getItem('last_roulette_spin');
  if (lastSpin && (now - parseInt(lastSpin)) < 24 * 60 * 60 * 1000) {
    // Para simplificar testes, iremos apenas retornar msg local, 
    // mas pode ser modificado para libertar o botão localmente.
    return { error: 'Apenas 1 spin por dia. Volta amanhã!' };
  }
  
  const pityCounter = parseInt(localStorage.getItem('roulette_pity') || '0');
  
  const muscle = REWARDS.muscleGroups[Math.floor(Math.random() * REWARDS.muscleGroups.length)];
  let bonus = REWARDS.bonuses[Math.floor(Math.random() * REWARDS.bonuses.length)];
  let duration = REWARDS.durations[Math.floor(Math.random() * REWARDS.durations.length)];
  
  if (pityCounter >= 4) {
      bonus = '+15% Recovery';
      duration = 'permanente (Premium)';
      localStorage.setItem('roulette_pity', '0');
  } else {
      if (bonus !== '+15% Recovery') {
          localStorage.setItem('roulette_pity', (pityCounter + 1).toString());
      } else {
          localStorage.setItem('roulette_pity', '0');
      }
  }

  const reward = { muscle, bonus, duration, timestamp: now };
  localStorage.setItem('last_roulette_spin', now.toString());
  localStorage.setItem('current_roulette_reward', JSON.stringify(reward));
  return { success: true, reward };
};

export const RecoveryRoulette = () => {
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState('');
  
  const handleSpin = async () => {
    setSpinning(true);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Delay da animação
    
    const result = spinRoulette();
    if (result.error) {
      setError(result.error);
    } else {
      setReward(result.reward);
    }
    setSpinning(false);
  };
  
  return (
    <div style={{ background: '#1a1f25', borderRadius: 12, padding: 14, border: '1px solid rgba(232, 200, 74, 0.2)', marginBottom: 20 }}>
      <h3 style={{ color: '#e8c84a', fontFamily: "'Bebas Neue'", fontSize: 20, marginBottom: 8 }}>🎰 RECOVERY ROULETTE</h3>
      
      <div style={{ position: 'relative', height: 80, background: '#080b0f', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        <motion.div
           style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
           animate={spinning ? { x: [0, -100, 100, -50, 50, 0] } : {}}
           transition={{ duration: 0.5, repeat: spinning ? 3 : 0 }}
        >
          {reward ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 'bold' }}>{reward.bonus}</p>
              <p style={{ fontSize: 11, color: '#999' }}>{reward.muscle} • {reward.duration}</p>
            </div>
          ) : (
            <p style={{ fontSize: 32, opacity: 0.3 }}>🎲🎲🎲</p>
          )}
        </motion.div>
      </div>
      
      <button
        onClick={handleSpin}
        disabled={spinning || !!reward}
        style={{
           width: '100%', padding: '12px', borderRadius: 8, border: 'none',
           background: (spinning || reward) ? '#555' : 'linear-gradient(to right, #e8c84a, #d4b03a)',
           color: '#080b0f', fontWeight: 'bold', cursor: (spinning || reward) ? 'not-allowed' : 'pointer'
        }}
      >
        {spinning ? 'A RODAR...' : reward ? 'BÓNUS DIÁRIO RECLAMADO' : 'LANÇAR (1X/DIA)'}
      </button>
      
      {error && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 8 }}>{error}</p>}
    </div>
  );
};
