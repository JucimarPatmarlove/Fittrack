import type React from 'react';
import { useEffect, useState } from 'react';
import { useGhostMode } from '../hooks/useGhostMode';
import { GhostSetBar } from './workout/GhostSetBar';

interface GhostSetComparisonProps {
  exerciseName: string;
  currentSets: any[];
  history: any[];
  theme: any;
  onPRDetected: (isPR: boolean) => void;
}

/**
 * GhostSetComparison
 * Wrapper component that manages ghost mode logic and renders the ghost set bar
 * Detects PRs and notifies parent
 */
export const GhostSetComparison: React.FC<GhostSetComparisonProps> = ({
  exerciseName,
  currentSets,
  history,
  theme,
  onPRDetected,
}) => {
  const { ghostState, checkForPR, triggerCelebration } = useGhostMode(exerciseName, history);
  const [celebrationActive, setCelebrationActive] = useState(false);

  // Get the best current set (working set, not warmup)
  const workingSets = currentSets.filter((s: any) => !s.isWarmup);
  const currentBest =
    workingSets.length > 0
      ? workingSets.reduce((prev: any, current: any) =>
          current.weight > prev.weight ||
          (current.weight === prev.weight && current.reps > prev.reps)
            ? current
            : prev,
        )
      : null;

  // Check for PR when current set changes
  useEffect(() => {
    if (currentBest && ghostState.ghostSet) {
      const isPR = checkForPR(currentBest.weight, currentBest.reps);
      if (isPR) {
        onPRDetected(true);
        setCelebrationActive(true);
        triggerCelebration();
        setTimeout(() => setCelebrationActive(false), 1500);
      }
    }
  }, [currentBest?.weight, currentBest?.reps, ghostState.ghostSet]);

  if (!ghostState.ghostSet || !currentBest) return null;

  return (
    <GhostSetBar
      ghostSet={ghostState.ghostSet}
      currentWeight={currentBest.weight}
      currentReps={currentBest.reps}
      isPR={checkForPR(currentBest.weight, currentBest.reps)}
      celebrationTrigger={celebrationActive}
      theme={theme}
    />
  );
};
