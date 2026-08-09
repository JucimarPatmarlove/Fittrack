// src/components/injury/InjuryRiskPanel.tsx

import { Activity, ChevronDown, ChevronUp, Heart, Moon } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { BodyRegion, InjuryRiskReport, WorkoutModification } from '../../types/injury';
import { BodyMap } from './BodyMap';
import { RiskBadge } from './RiskBadge';
import { WorkoutModifications } from './WorkoutModifications';

interface InjuryRiskPanelProps {
  report: InjuryRiskReport;
  compact?: boolean;
  onStartWorkout?: () => void;
  onApplyAllModifications?: (mods: WorkoutModification[]) => void;
  onDismiss?: () => void;
}

export const InjuryRiskPanel: React.FC<InjuryRiskPanelProps> = ({
  report,
  compact = false,
  onStartWorkout,
  onApplyAllModifications,
  onDismiss,
}) => {
  const [expandedRegion, setExpandedRegion] = useState<BodyRegion | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);

  const handleRegionClick = (region: BodyRegion) => {
    setExpandedRegion(expandedRegion === region ? null : region);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition">
        <BodyMap flaggedRegions={report.flaggedRegions} compact />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <RiskBadge level={report.overallRisk} score={report.overallRiskScore} size="sm" />
          </div>
          <p className="text-xs text-gray-500 truncate">
            {report.flaggedRegions.length > 0
              ? `${report.flaggedRegions.length} região(ões) em alerta`
              : 'Sistemas verdes. Pronto para treinar!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div
        className={`p-4 ${report.overallRisk === 'critical' ? 'bg-red-50' : report.overallRisk === 'high' ? 'bg-orange-50' : 'bg-green-50'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity
              className={`w-6 h-6 ${report.overallRisk === 'critical' ? 'text-red-600' : report.overallRisk === 'high' ? 'text-orange-600' : 'text-green-600'}`}
            />
            <div>
              <h3 className="font-bold text-gray-900">Análise de Risco de Lesão</h3>
              <p className="text-xs text-gray-600">Baseado no teu AC Ratio e Esforço</p>
            </div>
          </div>
          <RiskBadge level={report.overallRisk} score={report.overallRiskScore} size="lg" />
        </div>
      </div>

      {/* Body Map + Detalhes */}
      <div className="p-4 flex flex-col md:flex-row gap-6">
        <div className="flex justify-center md:justify-start">
          <BodyMap flaggedRegions={report.flaggedRegions} onRegionClick={handleRegionClick} />
        </div>

        <div className="flex-1">
          {report.flaggedRegions.some((r) => r.recoveryScore < 50) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                <Moon className="w-4 h-4" />
                Métricas de Recuperação Baixas
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {report.flaggedRegions
                  .filter((r) => r.recoveryScore < 50)
                  .slice(0, 4)
                  .map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Heart className="w-3 h-3 text-blue-500" />
                      <span className="text-blue-700 capitalize">
                        {r.region.replace('_', ' ')}: {r.recoveryScore}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {report.recommendations.slice(0, 3).map((rec, i) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                {rec}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="px-4 border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="py-3 flex items-center justify-center w-full gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetails ? 'Ocultar stress articular' : 'Ver stress articular detalhado'}
        </button>

        {showDetails && (
          <div className="pb-4 space-y-3">
            {report.flaggedRegions.map((region) => (
              <div
                key={region.region}
                className={`p-3 rounded-lg border ${region.riskLevel === 'critical' ? 'border-red-200 bg-red-50' : region.riskLevel === 'high' ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 capitalize flex items-center gap-2">
                    {region.region.replace(/_/g, ' ')}
                  </span>
                  <RiskBadge level={region.riskLevel} size="sm" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-white p-2 rounded border">
                    <span className="block text-gray-400 mb-1">Stress Agudo</span>
                    <span className="font-bold text-gray-700">{region.acuteStress.toFixed(0)}</span>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <span className="block text-gray-400 mb-1">Stress Crónico</span>
                    <span className="font-bold text-gray-700">
                      {region.chronicStress.toFixed(0)}
                    </span>
                  </div>
                  <div
                    className={`bg-white p-2 rounded border ${region.acuteChronicRatio > 1.3 ? 'border-red-300' : ''}`}
                  >
                    <span className="block text-gray-400 mb-1">AC Ratio</span>
                    <span
                      className={`font-bold ${region.acuteChronicRatio > 1.3 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {region.acuteChronicRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
                {region.sessionsInLast7Days > 3 && (
                  <p className="mt-2 text-xs text-amber-600 font-medium">
                    ⚠️ Músculo treinado {region.sessionsInLast7Days} vezes nos últimos 7 dias.
                  </p>
                )}
              </div>
            ))}

            {report.flaggedRegions.length === 0 && (
              <p className="text-center text-sm text-green-600 py-4 font-medium">
                🎉 O teu corpo está totalmente recuperado e pronto para a carga máxima!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modificações Sugeridas */}
      {report.suggestedModifications.length > 0 && (
        <div className="px-4 pb-4">
          <WorkoutModifications
            modifications={report.suggestedModifications}
            onApplyAll={
              onApplyAllModifications
                ? () => onApplyAllModifications(report.suggestedModifications)
                : undefined
            }
            onDismiss={onDismiss}
          />
        </div>
      )}

      {/* Downtime Warning */}
      {report.predictedDowntime && report.predictedDowntime >= 3 && (
        <div className="mx-4 mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Continuar com esta sobrecarga pode resultar numa paragem forçada de ~
            {report.predictedDowntime} dias.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
        {report.overallRisk !== 'critical' && onStartWorkout && (
          <button
            onClick={onStartWorkout}
            className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition shadow-sm"
          >
            Iniciar Treino
          </button>
        )}

        {report.overallRisk === 'critical' && onDismiss && (
          <div className="flex-1 flex flex-col gap-2">
            <button
              disabled
              className="w-full bg-red-100 text-red-500 py-3 rounded-lg font-bold cursor-not-allowed border border-red-200"
            >
              Treino Bloqueado (Risco Crítico)
            </button>
            <button onClick={onDismiss} className="text-xs text-gray-500 underline text-center">
              Ignorar aviso e treinar à minha responsabilidade
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
