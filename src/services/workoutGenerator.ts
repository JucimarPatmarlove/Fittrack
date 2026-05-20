interface Exercise {
    name: string;
    bodyweight?: boolean;
    dumbbell?: boolean;
    barbell?: boolean;
    alternative?: string;
}

export interface UserContext {
    level: string;
    equipment: string[];
    injuries: string[];
    goal: string;
    timeAvailable: number;
    readinessScore?: number; // Added for Motra-style readiness adjustments
    weeklyEffortScore?: number; // Added for Overtraining protection
}

export interface WorkoutPlan {
    exercises: Exercise[];
    totalDuration: number;
    difficulty: string;
    notes: string[];
}

export class WorkoutGenerator {
    private baseExercises: Exercise[] = [
        { name: 'Barbell Back Squat', barbell: true, bodyweight: true },
        { name: 'Barbell Bench Press', barbell: true, dumbbell: true },
        { name: 'Cable Lat Pulldown Wide-Grip', barbell: false, dumbbell: false }
    ];

    generatePersonalizedWorkout(context: UserContext): WorkoutPlan {
        let exercises = this.baseExercises; // Simplificação para arranque

        exercises = this.filterByEquipment(exercises, context.equipment);
        exercises = this.adaptForInjuries(exercises, context.injuries);

        let finalDuration = context.timeAvailable;
        const notes = ["Foca-te na técnica antes de aumentar a carga."];
        
        // Motra-style Readiness Adjustment
        if (context.readinessScore !== undefined) {
            if (context.readinessScore < 40) {
                finalDuration = Math.max(15, finalDuration * 0.5);
                notes.push("⚠️ Prontidão BAIXA: Treino cortado para 50% focando em recuperação ativa.");
            } else if (context.readinessScore < 70) {
                finalDuration = Math.max(20, finalDuration * 0.8);
                notes.push("⚠️ Prontidão MODERADA: Volume reduzido para evitar overtraining.");
            } else {
                notes.push("🔥 Prontidão MÁXIMA: Dia de bater PRs!");
            }
        }

        // Overtraining Protection based on cumulative effort
        if (context.weeklyEffortScore !== undefined && context.weeklyEffortScore > 850) {
            finalDuration = Math.max(20, finalDuration * 0.9);
            notes.push(`🚨 Overtraining Alert: Esta semana acumulaste ${context.weeklyEffortScore} pontos de esforço. Volume reduzido em 10% para proteger o teu SNC.`);
        }

        return {
            exercises,
            totalDuration: finalDuration,
            difficulty: context.level,
            notes
        };
    }

    private filterByEquipment(exercises: Exercise[], equipment: string[]): Exercise[] {
        return exercises.filter(ex => {
            if (equipment.includes('bodyweight')) return ex.bodyweight;
            if (equipment.includes('dumbbells')) return ex.dumbbell;
            if (equipment.includes('barbell')) return ex.barbell;
            return true;
        });
    }

    private adaptForInjuries(exercises: Exercise[], injuries: string[]): Exercise[] {
        const adaptations: Record<string, string> = {
            'ombro': 'Elevação Lateral com elástico',
            'joelho': 'Leg Press',
            'coluna': 'Remada apoiada'
        };

        return exercises.map(ex => {
            const injury = injuries.find(i => adaptations[i.toLowerCase()]);
            if (injury && adaptations[injury]) {
                return { ...ex, alternative: adaptations[injury] };
            }
            return ex;
        });
    }
}