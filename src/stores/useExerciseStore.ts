import { get, set } from 'idb-keyval';
import { create } from 'zustand';

// Define um tipo genérico para os exercícios de forma a evitar ciclos de dependência
export interface ExerciseEntry {
  name: string;
  muscle: string;
  equipment: string;
  base?: Record<string, number[]>;
  modalities?: string[];
  media?: any;
  instructions?: string[];
}

// Sobe este número sempre que alterares o ficheiro exercises.json
const CURRENT_DB_VERSION = 1;

interface ExerciseState {
  exercises: Record<string, ExerciseEntry>;
  exerciseLibrary: Array<{
    id: string;
    name: string;
    muscles: string[];
    equipment: string;
    type: string;
    emoji: string;
  }>;
  isLoading: boolean;
  error: string | null;
  fetchExercises: () => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((setZustand, getZustand) => ({
  exercises: {},
  exerciseLibrary: [],
  isLoading: false,
  error: null,

  fetchExercises: async () => {
    // Evita chamadas duplas se os dados já estiverem na memória RAM
    if (Object.keys(getZustand().exercises).length > 0 && getZustand().exerciseLibrary.length > 0) return;

    setZustand({ isLoading: true, error: null });

    try {
      const cachedVersion = await get('fittrack_db_version');
      let exerciseDB = await get('fittrack_exercises_data');
      let exerciseLibrary = await get('fittrack_exercise_library');

      // Se não houver dados OU a versão estiver desatualizada, faz fetch
      if (!exerciseDB || !exerciseLibrary || cachedVersion !== CURRENT_DB_VERSION) {
        console.log('[ExerciseStore] A descarregar nova base de dados de exercícios...');

        // Fetch both JSON files in parallel
        const [dbResponse, libResponse] = await Promise.all([
          fetch('/data/exerciseDB.json'),
          fetch('/data/exercises-generated.json'),
        ]);

        if (!dbResponse.ok) throw new Error('Falha ao aceder ao exerciseDB.json');
        if (!libResponse.ok) throw new Error('Falha ao aceder ao exercises-generated.json');

        exerciseDB = await dbResponse.json();
        exerciseLibrary = await libResponse.json();

        // Guarda na cache local assíncrona
        await set('fittrack_exercises_data', exerciseDB);
        await set('fittrack_exercise_library', exerciseLibrary);
        await set('fittrack_db_version', CURRENT_DB_VERSION);
      }

      setZustand({ exercises: exerciseDB as Record<string, ExerciseEntry>, exerciseLibrary: exerciseLibrary as any, isLoading: false });
    } catch (err: any) {
      console.error('[ExerciseStore] Erro crítico:', err);
      setZustand({ error: err.message, isLoading: false });
    }
  },
}));