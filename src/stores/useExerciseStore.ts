import { create } from 'zustand';
import { get, set } from 'idb-keyval';
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
  isLoading: boolean;
  error: string | null;
  fetchExercises: () => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((setZustand, getZustand) => ({
  exercises: {},
  isLoading: false,
  error: null,

  fetchExercises: async () => {
    // Evita chamadas duplas se os dados já estiverem na memória RAM
    if (Object.keys(getZustand().exercises).length > 0) return;

    setZustand({ isLoading: true, error: null });

    try {
      const cachedVersion = await get('fittrack_db_version');
      let data = await get('fittrack_exercises_data');

      // Se não houver dados OU a versão estiver desatualizada, faz fetch
      if (!data || cachedVersion !== CURRENT_DB_VERSION) {
        console.log('[ExerciseStore] A descarregar nova base de dados de exercícios...');
        
        const response = await fetch('/data/exercises.json');
        if (!response.ok) throw new Error('Falha ao aceder ao JSON de exercícios');
        
        data = await response.json();
        
        // Guarda na cache local assíncrona
        await set('fittrack_exercises_data', data);
        await set('fittrack_db_version', CURRENT_DB_VERSION);
      }

      setZustand({ exercises: data as Record<string, ExerciseEntry>, isLoading: false });
    } catch (err: any) {
      console.error('[ExerciseStore] Erro crítico:', err);
      setZustand({ error: err.message, isLoading: false });
    }
  }
}));
