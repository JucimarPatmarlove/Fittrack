import { motion } from 'framer-motion';
// @ts-nocheck
import { useState } from 'react';
import { C } from '../../data/constants';
import { AnthropicService } from '../../services/anthropicService';
import { useDualWorkoutStore } from '../../stores/useDualWorkoutStore';
import { usePlanStore } from '../../stores/usePlanStore';

interface WeeklyPlanGeneratorProps {
  profile: any;
  setProfile: (p: any) => void;
  onClose: () => void;
}

const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function WeeklyPlanGenerator({
  profile,
  setProfile,
  onClose,
}: WeeklyPlanGeneratorProps) {
  const [weight, setWeight] = useState(profile.weight || '');
  const [height, setHeight] = useState(profile.height || '');
  const [gender, setGender] = useState(profile.gender || 'Feminino');
  const [age, setAge] = useState(profile.age || 25);
  const [goal, setGoal] = useState(profile.goal || 'Hipertrofia');

  const [equipment, setEquipment] = useState(profile.availableEquipment?.[0] || 'Ginásio Completo');
  const [trainingDays, setTrainingDays] = useState<string[]>(
    profile.trainingDays || ['Segunda', 'Quarta', 'Sexta'],
  );
  const [duration, setDuration] = useState(profile.preferredWorkoutDuration || 60);
  const [injuries, setInjuries] = useState(profile.injuries?.join(', ') || '');
  const [philosophy, setPhilosophy] = useState(profile.philosophy || 'classic');
  const [classicStyle, setClassicStyle] = useState(profile.classicStyle || 'upper_lower');
  const [dayPreferences, setDayPreferences] = useState<Record<string, string>>(
    profile.dayPreferences || {},
  );
  const [preferredSlot, setPreferredSlot] = useState<'morning' | 'afternoon'>('morning');
  const [customDays, setCustomDays] = useState<string[]>(
    Object.entries(profile.dayPreferences || {})
      .filter(([_day, val]) => {
        return (
          val &&
          ![
            'Padrão',
            'Pernas',
            'Peito',
            'Costas',
            'Ombros',
            'Braços',
            'Core',
            'Cardio/HIIT',
          ].includes(val as string)
        );
      })
      .map(([day]) => day),
  );

  const { setCurrentPlan } = usePlanStore();
  const { scheduleWorkout } = useDualWorkoutStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [step, setStep] = useState('info');

  const toggleDay = (day: string) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSaveInfo = () => {
    if (!weight || !height) {
      alert('Preenche pelo menos o Peso e Altura!');
      return;
    }
    if (trainingDays.length === 0) {
      alert('Seleciona pelo menos um dia de treino!');
      return;
    }
    setProfile({
      ...profile,
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      gender,
      goal,
      philosophy,
      classicStyle,
      availableEquipment: [equipment],
      trainingDays: trainingDays,
      preferredWorkoutDuration: Number(duration),
      injuries: injuries
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s),
      dayPreferences: dayPreferences,
    });
    setStep('generate');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    let generated: any = null;
    try {
      generated = await AnthropicService.generateWeeklyPlan(
        {
          ...profile,
          weight: Number(weight),
          height: Number(height),
          age: Number(age),
          gender,
          goal,
          philosophy,
          classicStyle,
          availableEquipment: [equipment],
          trainingDays: trainingDays,
          preferredWorkoutDuration: Number(duration),
          injuries: injuries
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s),
          dayPreferences: dayPreferences,
        },
        philosophy,
      );
    } catch (error: any) {
      console.error('Erro crítico na geração do plano:', error);
      alert(
        'Erro crítico: Não foi possível processar o plano. Ocorreu uma falha no motor offline ou na IA.',
      );
    } finally {
      setIsGenerating(false);
    }

    if (generated && generated.plan) {
      const newPlan = {
        id: crypto.randomUUID(),
        name: generated.name || 'Plano IA Gerado',
        type: philosophy as any,
        description: generated.description || generated.reasoning || 'Plano personalizado.',
        workouts: generated.plan,
        createdAt: Date.now(),
      };
      setPlan(newPlan);
      setCurrentPlan(newPlan);

      // Injetar treinos gerados no Calendário Global (Agenda)
      const daysMap: Record<string, number> = {
        domingo: 0,
        segunda: 1,
        terça: 2,
        quarta: 3,
        quinta: 4,
        sexta: 5,
        sábado: 6,
      };
      const today = new Date();
      const currentDay = today.getDay();

      generated.plan.forEach((dayPlan: any) => {
        // Normalizar "Segunda-feira" -> "segunda"
        const normalizedDay = dayPlan.day.toLowerCase().split('-')[0].trim();
        const targetDay = daysMap[normalizedDay];

        if (targetDay !== undefined) {
          let daysUntil = targetDay - currentDay;
          if (daysUntil < 0) daysUntil += 7; // Empurra para a próxima semana se o dia já passou

          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysUntil);

          // Prevenir bug de fuso horário do toISOString() que empurra 1 dia para a frente
          const year = targetDate.getFullYear();
          const month = String(targetDate.getMonth() + 1).padStart(2, '0');
          const day = String(targetDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          const isRest =
            dayPlan.focus.toLowerCase().includes('descanso') ||
            dayPlan.focus.toLowerCase().includes('recupera');
          if (!isRest) {
            scheduleWorkout(dateString, preferredSlot, newPlan.id, `${dayPlan.focus}`);
          }
        }
      });
    } else if (generated && generated.error) {
      alert('Erro detalhado da IA: ' + generated.error);
    } else {
      alert('Falha ao gerar plano. Verifica a tua ligação ou tenta novamente.');
    }
  };



  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,11,15,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: 24,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.accent}`,
          borderRadius: 14,
          padding: 26,
          maxWidth: 400,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontFamily: "'Bebas Neue'",
              fontSize: 24,
              letterSpacing: 2,
              color: C.accent,
              margin: 0,
            }}
          >
            📅 PLANO DE ELITE IA
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {step === 'info' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p style={{ fontSize: 13, color: '#fff', marginBottom: 16 }}>
              Configura as variáveis de biofeedback para uma precisão de Personal Trainer.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                  GÉNERO
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 10,
                    color: C.text,
                  }}
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                  IDADE
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 10,
                    color: C.text,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                  PESO (KG)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 10,
                    color: C.text,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                  ALTURA (CM)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 10,
                    color: C.text,
                  }}
                />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
              OBJETIVO PRINCIPAL
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                marginBottom: 12,
              }}
            >
              <option value="Emagrecimento/Definição">Emagrecimento / Definição</option>
              <option value="Hipertrofia">Hipertrofia (Ganhar Músculo)</option>
              <option value="Recomposição Corporal">Recomposição Corporal</option>
              <option value="Força Pura">Força Pura</option>
            </select>

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
              PERÍODO PREFERENCIAL DO TREINO
            </label>
            <select
              value={preferredSlot}
              onChange={(e) => setPreferredSlot(e.target.value as 'morning' | 'afternoon')}
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                marginBottom: 12,
              }}
            >
              <option value="morning">Manhã (🌅)</option>
              <option value="afternoon">Tarde/Noite (🌙)</option>
            </select>

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
              FILOSOFIA / METODOLOGIA DE TREINO
            </label>
            <select
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                marginBottom: 12,
              }}
            >
              <option value="classic">💪 Musculação Clássica (Isolamento/Hipertrofia)</option>
              <option value="powerbuilding">⚡ Powerbuilding (Força + Estética / Ondulação)</option>
              <option value="hiit">📈 HIIT (Intervalos/Condicionamento)</option>
              <option value="functional">🧘 Cross-Training / Funcional (WODs/AMRAPs)</option>
            </select>

            {philosophy === 'classic' && (
              <>
                <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                  ESTILO DE DIVISÃO (CLÁSSICO)
                </label>
                <select
                  value={classicStyle}
                  onChange={(e) => setClassicStyle(e.target.value)}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 10,
                    color: C.text,
                    marginBottom: 12,
                  }}
                >
                  <option value="bro_split">Bro Split (1 Grupo por dia)</option>
                  <option value="upper_lower">Upper / Lower (Superiores/Inferiores)</option>
                  <option value="push_pull_legs">Push / Pull / Legs</option>
                  <option value="fullbody">Full Body</option>
                </select>
              </>
            )}

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>
              DIAS DE TREINO NA SEMANA
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {WEEK_DAYS.map((d) => {
                const isSelected = trainingDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    style={{
                      background: isSelected ? C.accent : C.surface,
                      color: isSelected ? C.bg : C.text,
                      border: `1px solid ${isSelected ? C.accent : C.border}`,
                      borderRadius: 20,
                      padding: '6px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: isSelected ? 'bold' : 'normal',
                    }}
                  >
                    {d.substring(0, 3)}
                  </button>
                );
              })}
            </div>

            {trainingDays.length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>
                  FOCO POR DIA DE TREINO
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {trainingDays.map((day) => {
                    const currentVal = dayPreferences[day] || 'Padrão';
                    const isCustom = customDays.includes(day);
                    const selectValue = isCustom
                      ? 'custom'
                      : [
                            'Padrão',
                            'Pernas',
                            'Peito',
                            'Costas',
                            'Ombros',
                            'Braços',
                            'Core',
                            'Cardio/HIIT',
                          ].includes(currentVal)
                        ? currentVal
                        : 'Padrão';

                    return (
                      <div
                        key={day}
                        style={{
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{ fontSize: 13, fontWeight: 'bold', width: 70, color: C.accent }}
                          >
                            {day}
                          </span>
                          <select
                            value={selectValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                setCustomDays((prev) => [...prev, day]);
                                setDayPreferences((prev) => ({ ...prev, [day]: '' }));
                              } else {
                                setCustomDays((prev) => prev.filter((d) => d !== day));
                                setDayPreferences((prev) => ({ ...prev, [day]: val }));
                              }
                            }}
                            style={{
                              flex: 1,
                              background: C.bg,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: '6px 8px',
                              color: C.text,
                              fontSize: 12,
                            }}
                          >
                            <option value="Padrão">Padrão (IA decide)</option>
                            <option value="Pernas">Pernas (Inferiores)</option>
                            <option value="Peito">Peito</option>
                            <option value="Costas">Costas</option>
                            <option value="Ombros">Ombros</option>
                            <option value="Braços">Braços (Bíceps/Tríceps)</option>
                            <option value="Core">Core / Abdominais</option>
                            <option value="Cardio/HIIT">Cardio / HIIT</option>
                            <option value="custom">Outro (Personalizado...)</option>
                          </select>
                        </div>
                        {isCustom && (
                          <input
                            type="text"
                            placeholder="Ex: Pernas (Foco Quadríceps)"
                            value={dayPreferences[day] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDayPreferences((prev) => ({ ...prev, [day]: val }));
                            }}
                            style={{
                              width: '100%',
                              background: C.bg,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: '6px 8px',
                              color: C.text,
                              fontSize: 12,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
              EQUIPAMENTO
            </label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                marginBottom: 12,
              }}
            >
              <option value="Ginásio Completo">Ginásio Comercial</option>
              <option value="Apenas Halteres">Home Gym (Halteres)</option>
              <option value="Peso Corporal">Calistenia (Sem Material)</option>
            </select>

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
              DURAÇÃO IDEAL (MINUTOS)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                marginBottom: 12,
              }}
            >
              <option value={30}>30 min (Expresso)</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>

            <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>
              LESÕES / LIMITAÇÕES (Separado por vírgula)
            </label>
            <input
              type="text"
              placeholder="ex: Joelhos, Lombar, etc"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                marginBottom: 20,
              }}
            />

            <button
              onClick={handleSaveInfo}
              style={{
                width: '100%',
                background: C.accent,
                color: C.bg,
                border: 'none',
                borderRadius: 8,
                padding: 12,
                fontFamily: "'Bebas Neue'",
                fontSize: 18,
                letterSpacing: 1,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              CONTINUAR
            </button>
          </motion.div>
        )}

        {step === 'generate' && !plan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <p style={{ fontSize: 13, color: '#fff', marginBottom: 20 }}>
              A IA vai compilar um plano de {trainingDays.length} dias de treino, adaptado para{' '}
              {equipment}, focando em {duration} mins e salvaguardando o teu perfil biomecânico.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #e8c84a, #e8a44a)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: 12,
                fontFamily: "'Bebas Neue'",
                fontSize: 18,
                cursor: isGenerating ? 'wait' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? 'A COMPUTAR MOTOR DE ELITE...' : '✨ GERAR PLANO AGORA'}
            </button>
            <button
              onClick={() => setStep('info')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: C.muted,
                fontSize: 12,
                marginTop: 10,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Voltar atrás e editar
            </button>
          </motion.div>
        )}

        {plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div
              style={{
                background: `${C.accent}22`,
                border: `1px solid ${C.accent}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 12, color: '#fff', margin: 0, fontStyle: 'italic' }}>
                "{plan.reasoning}"
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.workouts.map((day: any, i: number) => {
                const isRest =
                  day.focus.toLowerCase().includes('descanso') ||
                  day.focus.toLowerCase().includes('recupera');
                return (
                  <div
                    key={i}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: C.accent }}>
                        {day.day}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.text,
                          fontWeight: 'bold',
                          background: C.bg,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {day.focus}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        margin: 0,
                        lineHeight: 1.4,
                        marginBottom: isRest ? 0 : 10,
                      }}
                    >
                      {day.exercises.join(' • ')}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                alert('Plano Ativo no Dashboard!');
                onClose();
              }}
              style={{
                width: '100%',
                background: C.accent,
                color: '#000',
                border: `none`,
                borderRadius: 8,
                padding: 12,
                fontFamily: "'Bebas Neue'",
                fontSize: 18,
                cursor: 'pointer',
                marginTop: 20,
              }}
            >
              APLICAR E FECHAR
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
