interface FeedbackData {
    difficulty: 'easy' | 'good' | 'hard';
    pain: boolean;
    enjoyment: number;
}

interface Adaptation {
    action: 'modify' | 'increase' | 'change' | 'maintain';
    suggestion: string;
    reason?: string;
}

export class ProgressionSystem {
    static calculateNextWeight(currentWeight: number, repsCompleted: number, targetReps: number): number {
        if (repsCompleted >= targetReps + 2) {
            return Math.round((currentWeight * 1.05) / 2.5) * 2.5; // Arredonda para 2.5kg
        } else if (repsCompleted < targetReps - 2) {
            return currentWeight;
        }
        return currentWeight;
    }

    static shouldProgress(workoutHistory: any[], exerciseName: string): boolean {
        const last3Workouts = workoutHistory
            .filter(w => w.exercises.some((e: any) => e.name === exerciseName))
            .slice(-3);

        if (last3Workouts.length < 3) return false;

        return last3Workouts.every(w => {
            const ex = w.exercises.find((e: any) => e.name === exerciseName);
            // Confirma que todas as séries tentadas foram concluídas
            return ex?.sets.every((set: any) => set.weight > 0) ?? false;
        });
    }

    static adaptFromFeedback(feedback: FeedbackData): Adaptation {
        if (feedback.pain) {
            return { action: 'modify', reason: 'Dor detetada', suggestion: 'Substituir exercício ou reduzir a amplitude' };
        }

        if (feedback.difficulty === 'easy') {
            return { action: 'increase', suggestion: 'Aumentar carga em 2.5kg a 5kg no próximo treino' };
        }

        if (feedback.difficulty === 'hard' && feedback.enjoyment < 3) {
            return { action: 'change', suggestion: 'Tentar exercício alternativo no próximo ciclo' };
        }

        return { action: 'maintain', suggestion: 'Continuar progressão atual. O treino foi ideal.' };
    }
}