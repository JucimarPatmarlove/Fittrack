import { WorkoutSession } from "../types";

export const NeuralFatigue = {
    // Retorna um Readiness Score entre 0 e 100
    // Opcionalmente retorna a justificação em string
    calculateReadiness(history: WorkoutSession[]): { score: number, label: string, color: string } {
        if (history.length === 0) return { score: 100, label: "Fresco como Alface", color: "#6a994e" };

        const now = new Date().getTime();
        const oneDay = 24 * 3600 * 1000;

        // Histórico recente (últimos 7 dias)
        const recentWorkouts = history.filter(w => (now - new Date(w.date).getTime()) <= 7 * oneDay);

        let fatiguePoints = 0;

        // Fator 1: Gaps Temporais (Quanto tempo desde o último treino?)
        const lastWorkout = [...history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const hoursSinceLast = (now - new Date(lastWorkout.date).getTime()) / 3600000;

        if (hoursSinceLast < 12) fatiguePoints += 40;
        else if (hoursSinceLast < 24) fatiguePoints += 25;
        else if (hoursSinceLast > 48) fatiguePoints -= 15; // Ganha descanso

        // Fator 2: Volume e Intensidade Recente
        for (const w of recentWorkouts) {
            const daysAgo = (now - new Date(w.date).getTime()) / oneDay;
            // Se foi ontem, pesa mais na fadiga
            let impact = 1;
            if (daysAgo <= 1) impact = 2;
            else if (daysAgo >= 3) impact = 0.5;

            // Uma aproximação de 'tonelagem massiva'
            const massiveWorkout = w.totalVolume > 5000; 
            if (massiveWorkout) fatiguePoints += 15 * impact;
            else fatiguePoints += 8 * impact;
        }

        // Limita a score entre 0 (destruído) e 100 (perfeito)
        let rawScore = 100 - fatiguePoints;
        if (rawScore > 100) rawScore = 100;
        if (rawScore < 0) rawScore = 0;

        const score = Math.round(rawScore);

        let label = "Totalmente Recuperado";
        let color = "#38b000"; // Verde forte

        if (score < 40) {
            label = "Exaustão (Rest Day aconselhado)";
            color = "#d90429"; // Vermelho
        } else if (score < 70) {
            label = "Fadiga Moderada";
            color = "#fb8500"; // Laranja
        }

        return { score, label, color };
    }
};
