import React, { useState } from 'react';
import { useEffortStore } from '../../stores/useEffortStore';
import { Activity, Coins, Zap } from 'lucide-react';

interface EffortTrackerProps {
  onEffortLogged?: () => void;
  workoutDurationMinutes?: number;
}

export const EffortTracker: React.FC<EffortTrackerProps> = ({ 
  onEffortLogged, 
  workoutDurationMinutes = 45 
}) => {
  const { totalEffortPoints, fitTokens, addEffort, convertEffortToTokens } = useEffortStore();
  const [rpe, setRpe] = useState<number>(7);
  const [isLogged, setIsLogged] = useState(false);

  const handleLogEffort = () => {
    addEffort(rpe, workoutDurationMinutes);
    setIsLogged(true);
    if (onEffortLogged) {
      onEffortLogged();
    }
  };

  const getRpeColor = (val: number) => {
    if (val <= 3) return 'text-green-400';
    if (val <= 6) return 'text-yellow-400';
    if (val <= 8) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          Effort Tracking
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-gray-900 px-3 py-1 rounded-full">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-white">{totalEffortPoints}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-900 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-800 transition" onClick={convertEffortToTokens} title="Convert to $FIT Tokens">
            <Coins className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-white">{fitTokens} $FIT</span>
          </div>
        </div>
      </div>

      {!isLogged ? (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Rate of Perceived Exertion (RPE)</label>
              <span className={`text-lg font-bold ${getRpeColor(rpe)}`}>{rpe}/10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={rpe} 
              onChange={(e) => setRpe(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Very Light</span>
              <span>Moderate</span>
              <span>Maximum</span>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Est. Points Earned</p>
              <p className="text-2xl font-bold text-cyan-400">+{rpe * workoutDurationMinutes}</p>
            </div>
            <button 
              onClick={handleLogEffort}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-xl transition transform hover:scale-105"
            >
              Log Effort
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-green-400" />
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Effort Logged!</h4>
          <p className="text-gray-400 text-sm">You earned {rpe * workoutDurationMinutes} points. Keep pushing!</p>
        </div>
      )}
    </div>
  );
};
