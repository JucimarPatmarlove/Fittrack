import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, Apple, Flame, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
// @ts-nocheck
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { MealItem } from '../db/schema';
import { PRESET_FOODS } from '../services/nutritionEngine';
// Adapta os imports às localizações exatas do teu V7
import { useNutritionStore } from '../stores/useNutritionStore';
import { validateMealItem } from '../utils/validation';

// ─── TEMA DARK NEON (V7) ─────────────────────────────────────────────────────
const theme = {
  bg: '#080b0f',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassHover: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  accent: '#ccff00', // Neon Lime (Primário)
  success: '#00ff88', // Emerald Neon
  text: '#eceae4',
  muted: 'rgba(255, 255, 255, 0.5)',
  danger: '#ff3366',
};

const NutritionPlanner: React.FC = () => {
  // Estado Global via Zustand
  const { profile, currentMealLog: mealsLog, addMeal, removeMeal } = useNutritionStore();
  const currentDate = new Date().toISOString().split('T')[0] || '';

  // O estado atual das refeições no Zustand não expõe "meals" como array de logs se quisermos aceder ao dia específico,
  // expõe apenas "currentMealLog", que é o log da data atual se carregado corretamente.
  const todayMeals = mealsLog || { breakfast: [], lunch: [], snack: [], dinner: [] };

  // Estado Local da UI
  const [activeSegment, setActiveSegment] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>(
    'breakfast',
  );
  const [presetFoodIndex, setPresetFoodIndex] = useState('0');
  const [customFood, setCustomFood] = useState({
    name: PRESET_FOODS[0]?.name || '',
    cal: PRESET_FOODS[0]?.calories || 0,
    p: PRESET_FOODS[0]?.protein || 0,
    c: PRESET_FOODS[0]?.carb || 0,
    f: PRESET_FOODS[0]?.fat || 0,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Estado da IA
  const [userQuery, setUserQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState<{ id: string; sender: 'user' | 'ai'; text: string }[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Bem-vindo ao **NutriChef AI**. Posso gerar receitas com o que tens no frigorífico ou ajustar os teus macros. O que vamos cozinhar hoje?',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat]);

  // Cálculos do dia
  const getSum = (items: MealItem[]) =>
    items.reduce(
      (acc, curr) => ({
        cal: acc.cal + curr.calories,
        p: acc.p + curr.protein,
        c: acc.c + curr.carb,
        f: acc.f + curr.fat,
      }),
      { cal: 0, p: 0, c: 0, f: 0 },
    );

  const dailyTotals = (['breakfast', 'lunch', 'snack', 'dinner'] as const).reduce(
    (acc, seg) => {
      const sum = getSum(todayMeals[seg]);
      return { cal: acc.cal + sum.cal, p: acc.p + sum.p, c: acc.c + sum.c, f: acc.f + sum.f };
    },
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  // Handlers
  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar com Zod antes de submeter
    const mealData = {
      name: customFood.name,
      calories: Number(customFood.cal),
      protein: Number(customFood.p),
      carb: Number(customFood.c),
      fat: Number(customFood.f),
    };

    const result = validateMealItem(mealData);
    if (!result.success) {
      setValidationErrors(result.errors || {});
      return;
    }

    // Limpar erros e submeter
    setValidationErrors({});
    await addMeal(currentDate, activeSegment, {
      id: Date.now().toString(),
      name: result.data!.name,
      calories: result.data!.calories,
      protein: result.data!.protein,
      carb: result.data!.carb,
      fat: result.data!.fat,
    });
  };

  const handlePresetChange = (idx: string) => {
    setPresetFoodIndex(idx);
    setValidationErrors({}); // Limpar erros ao mudar preset
    if (idx !== 'custom') {
      const food = PRESET_FOODS[Number(idx)];
      if (food) {
        setCustomFood({
          name: food.name,
          cal: food.calories,
          p: food.protein,
          c: food.carb,
          f: food.fat,
        });
      }
    } else {
      setCustomFood({ name: '', cal: 0, p: 0, c: 0, f: 0 });
    }
  };

  const handleAskAI = async (e?: React.FormEvent, presetPrompt?: string) => {
    e?.preventDefault();
    const query = presetPrompt || userQuery;
    if (!query.trim()) return;

    setAiChat((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: query }]);
    setUserQuery('');
    setIsAiLoading(true);

    try {
      // Chamada à tua Vercel Function Blindada
      const res = await fetch('/api/nutrichef', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' /* Adiciona a injeção do JWT Efémero aqui */,
        },
        body: JSON.stringify({
          goal: profile.goal,
          targetCalories: profile.targetCalories || 2000,
          userMessage: query,
        }),
      });
      const data = await res.json();
      setAiChat((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'ai', text: data.text || 'Erro na matriz neural.' },
      ]);
    } catch (err) {
      setAiChat((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: 'Falha de conexão com o terminal NutriChef.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const targetCal = profile.targetCalories || 2000;
  const targetProt = profile.targetProtein || 120;
  const targetCarb = profile.targetCarb || 200;
  const targetFat = profile.targetFat || 60;

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '16px',
      }}
    >
      {/* ─── TOPO: DASHBOARD METABÓLICO ────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Bloco 1: Balanço Calórico */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            background: theme.glass,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                color: theme.muted,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Balanço Diário
            </span>
            <Flame size={20} color={theme.accent} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '3rem',
                fontFamily: '"Bebas Neue", sans-serif',
                color: theme.text,
              }}
            >
              {Math.max(0, targetCal - dailyTotals.cal)}
            </h2>
            <span
              style={{ color: theme.muted, fontSize: '0.9rem', fontFamily: '"DM Mono", monospace' }}
            >
              kcal restantes
            </span>
          </div>
          <div
            style={{
              marginTop: '16px',
              height: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (dailyTotals.cal / targetCal) * 100)}%` }}
              style={{
                height: '100%',
                background: theme.accent,
                boxShadow: `0 0 10px ${theme.accent}`,
              }}
            />
          </div>
        </div>

        {/* Bloco 2: Macros (P / C / G) */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            background: theme.glass,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                color: theme.muted,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Macronutrientes
            </span>
            <Activity size={20} color={theme.success} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <MacroGauge
              label="Proteína"
              current={dailyTotals.p}
              target={targetProt}
              color={theme.success}
            />
            <MacroGauge
              label="Carboidratos"
              current={dailyTotals.c}
              target={targetCarb}
              color="#00d4ff"
            />
            <MacroGauge
              label="Gorduras"
              current={dailyTotals.f}
              target={targetFat}
              color="#ffaa00"
            />
          </div>
        </div>
      </div>

      {/* ─── CORPO: LOG DE REFEIÇÕES VS IA (Grid 7/5) ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        {/* ESQUERDA: Gestor de Refeições */}
        <div style={{ gridColumn: 'span 2' }}>
          <div
            className="glass-card"
            style={{
              background: theme.glass,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((seg) => (
                <button
                  key={seg}
                  onClick={() => setActiveSegment(seg)}
                  style={{
                    flex: 1,
                    padding: '16px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: activeSegment === seg ? theme.accent : theme.muted,
                    borderBottom:
                      activeSegment === seg ? `2px solid ${theme.accent}` : '2px solid transparent',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {seg === 'breakfast'
                    ? 'Pequeno-Almoço'
                    : seg === 'lunch'
                      ? 'Almoço'
                      : seg === 'snack'
                        ? 'Lanche'
                        : 'Jantar'}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {/* Formulário Input */}
              <form
                onSubmit={handleAddFood}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select
                    value={presetFoodIndex}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                      outline: 'none',
                    }}
                  >
                    {PRESET_FOODS.map((f, i) => (
                      <option key={i} value={i}>
                        {f.name} ({f.calories}kcal)
                      </option>
                    ))}
                    <option value="custom">-- Adicionar Personalizado --</option>
                  </select>

                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: theme.accent,
                      color: '#000',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Plus size={18} /> Registar
                  </button>
                </div>

                {/* Campos customizados com validação visual */}
                {presetFoodIndex === 'custom' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '16px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <ValidatedInput
                      label="Nome"
                      placeholder="Ex: Peito de Frango 100g"
                      type="text"
                      value={customFood.name}
                      onChange={(v) => setCustomFood((p) => ({ ...p, name: v }))}
                      error={validationErrors.name}
                    />
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      <ValidatedInput
                        label="Calorias (kcal)"
                        type="number"
                        placeholder="0"
                        value={String(customFood.cal)}
                        onChange={(v) => setCustomFood((p) => ({ ...p, cal: Number(v) || 0 }))}
                        error={validationErrors.calories}
                      />
                      <ValidatedInput
                        label="Proteínas (g)"
                        type="number"
                        placeholder="0"
                        value={String(customFood.p)}
                        onChange={(v) => setCustomFood((p) => ({ ...p, p: Number(v) || 0 }))}
                        error={validationErrors.protein}
                      />
                      <ValidatedInput
                        label="Carboidratos (g)"
                        type="number"
                        placeholder="0"
                        value={String(customFood.c)}
                        onChange={(v) => setCustomFood((p) => ({ ...p, c: Number(v) || 0 }))}
                        error={validationErrors.carb}
                      />
                      <ValidatedInput
                        label="Gorduras (g)"
                        type="number"
                        placeholder="0"
                        value={String(customFood.f)}
                        onChange={(v) => setCustomFood((p) => ({ ...p, f: Number(v) || 0 }))}
                        error={validationErrors.fat}
                      />
                    </div>
                  </div>
                )}

                {/* Banner de erro global */}
                {Object.keys(validationErrors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(255,51,102,0.1)',
                      border: `1px solid ${theme.danger}`,
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      color: theme.danger,
                    }}
                  >
                    <AlertTriangle size={16} />
                    Corrige os campos assinalados antes de registar.
                  </motion.div>
                )}
              </form>

              {/* Lista Renderizada */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence>
                  {todayMeals[activeSegment].map((item: MealItem) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${theme.success}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: theme.text, fontSize: '0.9rem' }}>
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: theme.muted,
                            fontFamily: '"DM Mono", monospace',
                            marginTop: '4px',
                          }}
                        >
                          P: {item.protein}g | C: {item.carb}g | G: {item.fat}g
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: theme.accent,
                            fontFamily: '"DM Mono", monospace',
                          }}
                        >
                          {item.calories} kcal
                        </span>
                        <button
                          onClick={() => removeMeal(currentDate, activeSegment, item.id!)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: theme.danger,
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {todayMeals[activeSegment].length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: theme.muted,
                      fontSize: '0.9rem',
                    }}
                  >
                    Nenhum registo para esta refeição.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DIREITA: NutriChef AI Chat */}
        <div style={{ gridColumn: 'span 1' }}>
          <div
            className="glass-card"
            style={{
              background: theme.glass,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              height: '600px',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `${theme.accent}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${theme.accent}`,
                }}
              >
                <Apple size={18} color={theme.accent} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontFamily: '"Bebas Neue", sans-serif',
                    letterSpacing: '1px',
                    color: theme.text,
                  }}
                >
                  NutriChef AI
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: theme.success,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '1px',
                  }}
                >
                  ● Online
                </span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {aiChat.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      background: msg.sender === 'user' ? theme.accent : 'rgba(255,255,255,0.05)',
                      color: msg.sender === 'user' ? '#000' : theme.text,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderBottomRightRadius: msg.sender === 'user' ? 0 : '12px',
                      borderBottomLeftRadius: msg.sender === 'ai' ? 0 : '12px',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      border: msg.sender === 'ai' ? `1px solid ${theme.border}` : 'none',
                    }}
                  >
                    {msg.text.replace(/\*\*/g, '')}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    color: theme.accent,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Sparkles size={14} className="animate-pulse" /> A processar matriz nutricional...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleAskAI}
              style={{
                padding: '16px',
                borderTop: `1px solid ${theme.border}`,
                display: 'flex',
                gap: '8px',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ex: Receita com frango e batata doce..."
                disabled={isAiLoading}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '12px',
                  color: theme.text,
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isAiLoading}
                style={{
                  background: theme.accent,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={18} color="#000" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Auxiliar para Macros
const MacroGauge = ({
  label,
  current,
  target,
  color,
}: { label: string; current: number; target: number; color: string }) => (
  <div>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        marginBottom: '8px',
      }}
    >
      <span style={{ color: theme.text, fontWeight: 600 }}>{label}</span>
      <span style={{ color: theme.muted, fontFamily: '"DM Mono", monospace' }}>
        {current} / {target}g
      </span>
    </div>
    <div
      style={{
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, (current / target) * 100)}%`,
          height: '100%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  </div>
);

// Componente de Input com Validação Visual (Dark Neon)
const ValidatedInput: React.FC<{
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}> = ({ label, type, placeholder, value, onChange, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label
      style={{
        fontSize: '0.7rem',
        color: theme.muted,
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        background: 'rgba(0,0,0,0.4)',
        color: theme.text,
        outline: 'none',
        border: error ? `1.5px solid ${theme.danger}` : `1px solid ${theme.border}`,
        boxShadow: error ? `0 0 8px rgba(255,51,102,0.25)` : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    />
    {error && (
      <span style={{ fontSize: '0.7rem', color: theme.danger, lineHeight: 1.3 }}>{error}</span>
    )}
  </div>
);

export default NutritionPlanner;
