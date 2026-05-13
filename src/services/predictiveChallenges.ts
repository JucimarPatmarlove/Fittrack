import { WorkoutSession } from "../types";

export interface Challenge {
    id: string;
    type: 'strength' | 'volume' | 'consistency' | 'trending';
    targetExercise?: string;
    targetValue: number;
    deadline: string; // ISO date
    xpReward: number;
    status: 'active' | 'completed' | 'failed';
    title: string;
    description: string;
}

export const PredictiveChallenges = {
    // Regressão Linear Simples para prever o próximo 1RM ou Peso a levantar
    predictNextPerformance(history: WorkoutSession[], exerciseName: string): number | null {
        // Obter treinos que contêm o exercício, cronologicamente
        const workoutsWithEx = history
            .filter(w => w.exercises.some(e => e.name === exerciseName))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (workoutsWithEx.length < 3) return null; // Precisamos de pelo menos 3 datapoints

        const dataPoints = workoutsWithEx.map((w, index) => {
            const ex = w.exercises.find(e => e.name === exerciseName)!;
            // Pegar no melhor set para Simplificar (max weight)
            const bestWeight = Math.max(...ex.sets.filter(s => s.done !== false).map(s => s.weight));
            return { x: index, y: bestWeight === -Infinity ? 0 : bestWeight };
        });

        // Fórmula Regressão Linear Simples: y = mx + b
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        const n = dataPoints.length;

        for (const point of dataPoints) {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumXX += point.x * point.x;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Prever para o PRÓXIMO treino (x = n)
        const prediction = slope * n + intercept;

        // Arredondar para os 2.5kg mais próximos que existam comercialmente (ou 1kg)
        return Math.round(prediction * 2) / 2;
    },

    generateChallenges(history: WorkoutSession[]): Challenge[] {
        const challenges: Challenge[] = [];
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Tentar prever peso num exercício core
        const exercisesToPredict = ['Supino Plano', 'Agachamento', 'Press Militar'];
        for (const ex of exercisesToPredict) {
            const pred = this.predictNextPerformance(history, ex);
            if (pred && pred > 20) {
                // Adiciona ligeira margem (+2.5kg) para ser desafio real
                const target = pred + 2.5; 
                challenges.push({
                    id: `pred_${ex}_${Date.now()}`,
                    type: 'strength',
                    targetExercise: ex,
                    targetValue: target,
                    deadline: nextWeek,
                    xpReward: 150,
                    status: 'active',
                    title: `Desafio de IA Predita`,
                    description: `A IA estima que levantas ${pred}kg. Ultrapassa as previsões e bate ${target}kg no ${ex} para ganho de XP!`
                });
                break; // Apenas gera 1 desafio de força para focar
            }
        }

        // Se não houver histórico para gerar preditivo, gerar de consistência
        if (challenges.length === 0) {
            challenges.push({
                id: `cons_${Date.now()}`,
                type: 'consistency',
                targetValue: 3,
                deadline: nextWeek,
                xpReward: 100,
                status: 'active',
                title: 'Consistência de Aço',
                description: `Treina 3 vezes nos próximos 7 dias para provares dedicação.`
            });
        }

        // Trending 2026 Challenges
        const trendingPool = [
            { id: `trend_plank_${Date.now()}`, type: 'trending' as const, targetExercise: 'Plank Hover', targetValue: 60, deadline: nextWeek, xpReward: 100, status: 'active' as const, title: 'Plank Hover (Trend 2026)', description: 'Aguenta 60s numa variação de Plank Hover, o desafio mais viral de 2026!' },
            { id: `trend_deadhang_${Date.now()}`, type: 'trending' as const, targetExercise: 'Dead Hang', targetValue: 90, deadline: nextWeek, xpReward: 150, status: 'active' as const, title: 'Dead Hang (Trend 2026)', description: 'Pendura-te na barra durante 90s. Saúde da coluna e super força de aderência.' },
            { id: `trend_nord_${Date.now()}`, type: 'trending' as const, targetExercise: 'Nord Pilates', targetValue: 3, deadline: nextWeek, xpReward: 200, status: 'active' as const, title: 'Nord Pilates (Trend 2026)', description: 'Completa 3 exercícios de estabilidade/Pilates para controlares o corpo.' }
        ];
        
        // Adicionar um desafio aleatório de tendência para engajamento contínuo
        const randomTrend = trendingPool[Math.floor(Math.random() * trendingPool.length)];
        challenges.push(randomTrend);

        return challenges;
    },

    evaluateChallenge(challenge: Challenge, lastWorkout: WorkoutSession, history: WorkoutSession[]): boolean {
        if (challenge.type === 'strength' && challenge.targetExercise) {
            const ex = lastWorkout.exercises.find(e => e.name === challenge.targetExercise);
            if (ex) {
                const maxWeight = Math.max(...ex.sets.filter(s => s.done !== false).map(s => s.weight));
                return maxWeight >= challenge.targetValue;
            }
        }
        if (challenge.type === 'consistency') {
            const weekWorkouts = history.filter(w => new Date(w.date).getTime() > new Date(challenge.deadline).getTime() - 7 * 24 * 60 * 60 * 1000);
            return weekWorkouts.length >= challenge.targetValue;
        }
        return false;
    }
};
