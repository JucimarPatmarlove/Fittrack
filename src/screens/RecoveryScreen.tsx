// src/screens/RecoveryScreen.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlobalBackground } from '../components/ui/GlobalBackground';
import { SleepInput } from '../components/recovery/SleepInput';
import { SorenessMap } from '../components/recovery/SorenessMap';
import { HRVInput } from '../components/recovery/HRVInput';
import { MoodTracker } from '../components/recovery/MoodTracker';
import { useInjuryStore } from '../stores/useInjuryStore';
import { RecoveryInput } from '../types/injury';
import { calculateRecoveryScore } from '../services/injuryPrediction/recoveryTracker';

export default function RecoveryScreen() {
  const { recoveryData, setRecoveryData } = useInjuryStore();
  
  const [hours, setHours] = useState(recoveryData?.sleepHours ?? 7);
  const [quality, setQuality] = useState(recoveryData?.sleepQuality ?? 6);
  const [soreness, setSoreness] = useState<Record<string, number>>(recoveryData?.muscleSoreness ?? {});
  const [hrv, setHrv] = useState<number | undefined>(recoveryData?.hrv);
  const [restingHR, setRestingHR] = useState<number | undefined>(recoveryData?.restingHR);
  const [mood, setMood] = useState(recoveryData?.mood ?? 7);
  const [stressLevel, setStressLevel] = useState(recoveryData?.stressLevel ?? 5);

  const [saved, setSaved] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Calcula live score para feedback visual
  useEffect(() => {
    const data: RecoveryInput = {
      sleepHours: hours,
      sleepQuality: quality,
      muscleSoreness: soreness,
      hrv,
      restingHR,
      mood,
      stressLevel,
    };
    setScore(calculateRecoveryScore(data));
  }, [hours, quality, soreness, hrv, restingHR, mood, stressLevel]);

  const handleRegionClick = (region: string) => {
    setSoreness(prev => {
      const current = prev[region] || 0;
      const next = current >= 10 ? 0 : current + 2;
      
      if (next === 0) {
        const copy = { ...prev };
        delete copy[region];
        return copy;
      }
      return { ...prev, [region]: next };
    });
  };

  const handleClearRegion = (region: string) => {
    setSoreness(prev => {
      const copy = { ...prev };
      delete copy[region];
      return copy;
    });
  };

  const handleSave = () => {
    const data: RecoveryInput = {
      sleepHours: hours,
      sleepQuality: quality,
      muscleSoreness: soreness,
      hrv,
      restingHR,
      mood,
      stressLevel,
    };
    setRecoveryData(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#00ff88'; // green
    if (s >= 50) return '#e8c84a'; // yellow
    return '#ef4444'; // red
  };

  return (
    <GlobalBackground>
      <div className="min-h-screen pb-24 pt-6 px-4 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-['Bebas_Neue'] text-4xl text-[#e8c84a] tracking-wider m-0">
              FISIOTERAPIA DIGITAL
            </h1>
            <p className="text-gray-400 text-sm">Atualiza o teu estado biológico diário</p>
          </div>
          
          {score !== null && (
            <div className="flex flex-col items-center justify-center bg-[#131920] w-14 h-14 rounded-full border border-gray-800 shadow-lg">
              <span className="font-bold text-lg leading-none" style={{ color: getScoreColor(score) }}>
                {score}
              </span>
              <span className="text-[9px] text-gray-500 font-bold">SCORE</span>
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SleepInput
            hours={hours}
            quality={quality}
            onHoursChange={setHours}
            onQualityChange={setQuality}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <SorenessMap
            soreness={soreness}
            onRegionClick={handleRegionClick}
            onClearRegion={handleClearRegion}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <MoodTracker
            mood={mood}
            stressLevel={stressLevel}
            onMoodChange={setMood}
            onStressChange={setStressLevel}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <HRVInput
            hrv={hrv}
            restingHR={restingHR}
            onHRVChange={setHrv}
            onRestingHRChange={setRestingHR}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="mt-8">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-4 rounded-xl font-['Bebas_Neue'] text-2xl tracking-wider transition-all duration-300 ${
              saved
                ? 'bg-[#00ff88] text-black scale-[0.98]'
                : 'bg-[#e8c84a] text-black hover:bg-[#f6d75b] shadow-[0_4px_20px_rgba(232,200,74,0.4)]'
            }`}
          >
            {saved ? 'DADOS SINCRONIZADOS ✓' : 'ANALISAR RISCO'}
          </button>
        </motion.div>
      </div>
    </GlobalBackground>
  );
}
