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
}

export interface WorkoutPlan {
    exercises: Exercise[];
    totalDuration: number;
    difficulty: string;
    notes: string[];
}

export class WorkoutGenerator {
    private baseExercises: Exercise[] = [
        { name: 'Agachamento', barbell: true, bodyweight: true },
        { name: 'Supino', barbell: true, dumbbell: true },
        { name: 'Puxada Frontal', barbell: false, dumbbell: false }
    ];

    generatePersonalizedWorkout(context: UserContext): WorkoutPlan {
        let exercises = this.baseExercises; // Simplificação para arranque

        exercises = this.filterByEquipment(exercises, context.equipment);
        exercises = this.adaptForInjuries(exercises, context.injuries);

        return {
            exercises,
            totalDuration: context.timeAvailable,
            difficulty: context.level,
            notes: ["Foca-te na técnica antes de aumentar a carga."]
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