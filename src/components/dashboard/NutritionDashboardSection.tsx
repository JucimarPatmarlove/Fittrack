// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { C } from '../../data/constants';
import { useNutritionStore } from '../../stores/useNutritionStore';
import { getTodayDateString } from '../../services/nutritionEngine';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export function NutritionDashboardSection({ profile }: { profile: any }) {
  const { currentMealLog, weightHistory, loadNutritionData, loadAllWeightLogs } = useNutritionStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadNutritionData(getTodayDateString());
    loadAllWeightLogs();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calcular métricas de hoje
  const getMealSum = (items: any[]) => items.reduce((sum, item) => sum + item.calories, 0);
  const totalCal = 
    getMealSum(currentMealLog?.breakfast || []) +
    getMealSum(currentMealLog?.lunch || []) +
    getMealSum(currentMealLog?.snack || []) +
    getMealSum(currentMealLog?.dinner || []);

  const targetCal = profile.targetCalories || 2000;

  const calData = [
    { name: 'Consumido', value: totalCal, fill: '#00ff88' },
    { name: 'Meta', value: targetCal, fill: 'rgba(255,255,255,0.1)' }
  ];

  const weightData = weightHistory.slice(-7).map(w => ({
    date: w.date.slice(-5).replace('-', '/'),
    weight: w.weight
  }));

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: C.muted }}>NUTRIÇÃO E EVOLUÇÃO</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'nutrition' }))}
          style={{ background: "transparent", color: "#00ff88", border: "1px solid #00ff88", borderRadius: 8, padding: "4px 10px", fontFamily: "'Bebas Neue'", fontSize: 12, cursor: "pointer" }}>
            GERIR DIETA
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <GlassCard style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: C.text, fontWeight: 'bold', marginBottom: 12 }}>Balanço Calórico (Hoje)</p>
          <div style={{ height: 120, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={calData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, Math.max(totalCal, targetCal) * 1.1]} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(8,11,15,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: '#00ff88' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: C.muted }}>
            <span>{totalCal} kcal consumidas</span>
            <span>Restam {Math.max(0, targetCal - totalCal)} kcal</span>
          </div>
        </GlassCard>

        {weightData.length > 1 && (
          <GlassCard style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: C.text, fontWeight: 'bold', marginBottom: 12 }}>Evolução de Peso</p>
            <div style={{ height: 120, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(8,11,15,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
                    itemStyle={{ color: '#ccff00' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#ccff00" strokeWidth={3} dot={{ fill: '#ccff00', r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
