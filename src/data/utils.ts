// @ts-nocheck
import { UserProfile } from "../types";
import { WorkoutSession } from "../db/schema";;
import { ME } from "./constants";

export function calculate1RM(weight: number, reps: number): number {
    if (reps === 0) return 0;
    return Math.round(weight * (36 / (37 - reps)));
}

export function estimateCaloriesBurned(workout: WorkoutSession, profile: UserProfile): number {
    const MET = 6; // MET médio para musculação intensa
    const hours = workout.duration / 3600;
    return Math.round(MET * profile.weight * hours);
}

export function calculateRecovery(history: WorkoutSession[], goalId: string = 'hipertrofia') {
    const now = new Date();
    const muscles = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core'];
    
    // Horas necessárias para recuperação completa com base no objetivo
    let recoveryHoursFull = 48; // default hipertrofia
    if (goalId === 'forca') recoveryHoursFull = 72;
    else if (goalId === 'condicionamento' || goalId === 'perda_peso') recoveryHoursFull = 24;

    return muscles.map(muscle => {
        const lastWorkout = history
            .filter(w => w.exercises.some((e: any) => e.muscle === muscle))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const limitMs = recoveryHoursFull * 3600 * 1000;
        
        let recoveryPct = 100;
        let hoursLeft = 0;
        let color = "#3dd68c"; // verde
        let lastTrained = null;

        if (lastWorkout) {
            const msSince = now.getTime() - new Date(lastWorkout.date).getTime();
            lastTrained = new Date(lastWorkout.date);
            
            if (msSince < limitMs) {
                recoveryPct = Math.round((msSince / limitMs) * 100);
                hoursLeft = Math.ceil((limitMs - msSince) / (1000 * 3600));
            }
        }

        if (recoveryPct > 80) color = "#3dd68c"; // green
        else if (recoveryPct > 40) color = "#e8a44a"; // orange
        else color = "#e84a4a"; // red

        return {
            muscle,
            emoji: ME[muscle] || "💪",
            lastTrained,
            recoveryPct,
            hoursLeft,
            color
        };
    });
}

export function bmi(kg: number, cm: number): string {
    return (kg / Math.pow(cm / 100, 2)).toFixed(1);
}

export function bmiLabel(b: number) {
    if (b < 18.5) return { label: "Abaixo do peso", color: "#4a9ee8" };
    if (b < 25) return { label: "Peso normal", color: "#3dd68c" };
    if (b < 30) return { label: "Excesso de peso", color: "#e8a44a" };
    return { label: "Obesidade", color: "#e84a4a" };
}

export function checkAutoProgression(history: any[], exerciseName: string, maxBaseReps: number = 10): boolean {
    const lastWorkingouts = history
        .filter(w => w.exercises.some((e: any) => e.name === exerciseName))
        .slice(-2);
        
    if (lastWorkingouts.length < 2) return false;

    // Se nas 2 últimas sessões, tentou fazer a base.max e completou em todas as séries?
    return lastWorkingouts.every(w => {
        const ex = w.exercises.find((e: any) => e.name === exerciseName);
        if (!ex || ex.sets.length === 0) return false;
        
        // Todas as séries completas e alcançou/ultrapassou maxBaseReps
        return ex.sets.every((s: any) => s.reps >= maxBaseReps && s.weight > 0);
    });
}