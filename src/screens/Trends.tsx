// src/screens/Trends.tsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';
import { motion } from 'framer-motion';
import { C } from '../data/constants';
import { GlobalBackground } from '../components/ui/GlobalBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { getAllWorkouts } from '../db/schema';

export default function Trends({ history }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [acwrData, setAcwrData] = useState<any[]>([]);
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [walkingData, setWalkingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const workouts = await getAllWorkouts();
      const last30Days = workouts.filter(w => w.date > Date.now() - 30 * 24 * 3600 * 1000);
      const sorted = last30Days.sort((a, b) => a.date - b.date);

      const readinessVolumeData = [];
      for (const w of sorted) {
        readinessVolumeData.push({
          date: new Date(w.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
          readiness: w.readinessScore ?? 70,
          volume: w.totalVolumeKg ?? w.totalVolume ?? 0,
        });
      }
      setChartData(readinessVolumeData);

      const acwrPoints = [];
      for (let i = 0; i < sorted.length; i += 3) {
        const week = sorted.slice(i, i + 3);
        const acute = week.reduce((sum, w) => sum + (w.totalVolumeKg ?? w.totalVolume ?? 0), 0);
        const chronic = sorted.slice(Math.max(0, i - 3), i).reduce((sum, w) => sum + (w.totalVolumeKg ?? w.totalVolume ?? 0), 0) / 3;
        const ratio = chronic > 0 ? acute / chronic : 1;
        acwrPoints.push({
          week: `S${Math.floor(i / 3) + 1}`,
          acwr: Number(ratio.toFixed(2)),
        });
      }
      setAcwrData(acwrPoints);

      setXpHistory([
        { date: 'Semana 1', xp: 500 },
        { date: 'Semana 2', xp: 1200 },
        { date: 'Semana 3', xp: 2100 },
        { date: 'Semana 4', xp: 3500 },
      ]);

      const walkingSessions = history.filter((w: any) => w.name && w.name.includes('Caminhada'));
      const walkingPoints = walkingSessions.map((w: any) => {
         let distanceKm = 0;
         if (w.exercises && w.exercises[0] && w.exercises[0].sets && w.exercises[0].sets[0]) {
             distanceKm = w.exercises[0].sets[0].reps / 1000;
         }
         const durationMins = w.duration || 0;
         const pace = distanceKm > 0 ? (durationMins / distanceKm) : 0;
         
         return {
            date: new Date(w.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
            distancia: Number(distanceKm.toFixed(2)),
            ritmo: Number(pace.toFixed(1))
         };
      });
      setWalkingData(walkingPoints);

      setLoading(false);
    };
    loadData();
  }, [history]);

  return (
    <GlobalBackground>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "18px 18px 120px", display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 2, color: C.text, margin: 0 }}>
                TENDÊNCIAS AVANÇADAS <span style={{ color: C.accent }}>📈</span>
            </h1>
        </motion.div>

        {loading ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>A carregar tendências...</div>
        ) : (
            <>
            <GlassCard style={{ padding: 20 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>PRONTIDÃO VS VOLUME</h2>
                <div style={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke={C.muted} fontSize={10} />
                        <YAxis yAxisId="left" stroke={C.muted} fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" stroke={C.accent} fontSize={10} />
                        <Tooltip contentStyle={{ background: '#080b0f', borderColor: C.accent, borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line yAxisId="left" type="monotone" dataKey="readiness" stroke={C.green} name="Readiness" strokeWidth={3} dot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="volume" stroke={C.accent} name="Volume (kg)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
                </div>
                <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 }}>Readiness elevado + volume moderado = recuperação ótima</p>
            </GlassCard>

            <GlassCard style={{ padding: 20 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>⚖️ RÁCIO AGUDO/CRÓNICO (ACWR)</h2>
                <div style={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={acwrData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="week" stroke={C.muted} fontSize={10} />
                        <YAxis domain={[0, 2]} stroke={C.muted} fontSize={10} />
                        <Tooltip contentStyle={{ background: '#080b0f', borderColor: C.accent, borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <ReferenceLine y={0.8} stroke={C.green} strokeDasharray="3 3" label={{ value: "Mín. Seguro", fill: C.green, fontSize: 10 }} />
                        <ReferenceLine y={1.3} stroke={C.accent} strokeDasharray="3 3" label={{ value: "Máx. Seguro", fill: C.accent, fontSize: 10 }} />
                        <ReferenceArea y1={1.5} y2={2} fill={C.red} fillOpacity={0.15} />
                        <Line type="monotone" dataKey="acwr" stroke={C.red} strokeWidth={3} name="ACWR" dot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
                </div>
                <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 }}>ACWR &gt; 1.5 = risco elevado de lesão. Reduza volume imediatamente.</p>
            </GlassCard>

            <GlassCard style={{ padding: 20 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>🏆 EVOLUÇÃO DE EXPERIÊNCIA (XP)</h2>
                <div style={{ height: 250, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={xpHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke={C.muted} fontSize={10} />
                        <YAxis stroke={C.muted} fontSize={10} />
                        <Tooltip contentStyle={{ background: '#080b0f', borderColor: C.accent, borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        <Area type="monotone" dataKey="xp" stroke={C.accent} fill={`${C.accent}44`} name="XP Acumulado" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
                </div>
                <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 }}>Quanto mais consistente, mais rápido sobes de nível!</p>
            </GlassCard>

            {walkingData.length > 0 && (
                <GlassCard style={{ padding: 20 }}>
                    <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.text, margin: "0 0 16px 0", letterSpacing: 1 }}>🏃‍♂️ RADAR: DISTÂNCIA E RITMO</h2>
                    <div style={{ height: 300, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={walkingData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke={C.muted} fontSize={10} />
                            <YAxis yAxisId="left" stroke={C.muted} fontSize={10} />
                            <YAxis yAxisId="right" orientation="right" stroke={C.accent} fontSize={10} />
                            <Tooltip contentStyle={{ background: '#080b0f', borderColor: C.accent, borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line yAxisId="left" type="monotone" dataKey="distancia" stroke={C.green} name="Distância (km)" strokeWidth={3} dot={{ r: 4 }} />
                            <Line yAxisId="right" type="monotone" dataKey="ritmo" stroke={C.accent} name="Ritmo (min/km)" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 }}>Evolução do teu rendimento nas caminhadas com Radar.</p>
                </GlassCard>
            )}
            </>
        )}
      </div>
    </GlobalBackground>
  );
}
