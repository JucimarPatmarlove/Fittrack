// src/components/injury/WorkoutModifications.tsx

import React from 'react';
import { ArrowRightLeft, MinusCircle, AlertCircle } from 'lucide-react';
import { WorkoutModification } from '../../types/injury';

interface WorkoutModificationsProps {
  modifications: WorkoutModification[];
  onApplyModification?: (mod: WorkoutModification) => void;
  onApplyAll?: () => void;
  onDismiss?: () => void;
}

const TYPE_CONFIG = {
  keep: { icon: null, color: 'text-green-600', bg: 'bg-green-50' },
  reduce_load: { icon: MinusCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  reduce_volume: { icon: MinusCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  swap: { icon: ArrowRightLeft, color: 'text-orange-600', bg: 'bg-orange-50' },
  remove: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export const WorkoutModifications: React.FC<WorkoutModificationsProps> = ({
  modifications,
  onApplyModification,
  onApplyAll,
  onDismiss,
}) => {
  if (modifications.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h4 className="flex items-center gap-2 font-semibold text-amber-800 mb-3">
        <AlertCircle className="w-5 h-5" />
        Ajustes Recomendados para este Treino
      </h4>
      
      <div className="space-y-3">
        {modifications.map((mod, i) => {
          const config = TYPE_CONFIG[mod.originalType];
          const Icon = config.icon;
          
          return (
            <div 
              key={i} 
              className={`flex items-start gap-3 rounded-md p-3 ${config.bg}`}
            >
              {Icon && <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{mod.exerciseName}</p>
                <p className="text-sm text-gray-600 mt-1">{mod.suggestion}</p>
                
                {mod.alternativeExercise && (
                  <div className="mt-2 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">
                      Alternativa: {mod.alternativeExercise}
                    </span>
                  </div>
                )}
              </div>
              
              {onApplyModification && (
                <button
                  onClick={() => onApplyModification(mod)}
                  className="text-xs bg-white border rounded px-2 py-1 hover:bg-gray-50 transition font-medium"
                >
                  Aplicar
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {onApplyAll && (
          <button
            onClick={onApplyAll}
            className="w-full bg-amber-600 text-white py-2 rounded font-medium hover:bg-amber-700 transition"
          >
            Aplicar Todas as Modificações
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full text-center text-xs text-amber-700 hover:text-amber-900 underline py-2"
          >
            Entendi, quero ignorar o risco e continuar mesmo assim
          </button>
        )}
      </div>
    </div>
  );
};
