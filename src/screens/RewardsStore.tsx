import React from 'react';
import { useEffortStore } from '../stores/useEffortStore';
import { Coins, Sparkles, Zap, Lock } from 'lucide-react';
import { GlobalBackground } from '../components/ui/GlobalBackground';

export const RewardsStore: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { fitTokens, totalEffortPoints } = useEffortStore();

  const rewards = [
    { id: 'theme_neon', name: 'Neon Pink Theme', cost: 10, type: 'theme', icon: <Sparkles className="w-6 h-6 text-pink-500" /> },
    { id: 'theme_cyber', name: 'Cyberpunk Blue', cost: 25, type: 'theme', icon: <Zap className="w-6 h-6 text-cyan-500" /> },
    { id: 'badge_elite', name: 'Elite Athlete Badge', cost: 50, type: 'badge', icon: <Lock className="w-6 h-6 text-yellow-500" /> },
  ];

  return (
    <GlobalBackground>
      <div className="min-h-screen p-6 pb-24 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold font-['Bebas_Neue'] tracking-widest text-white">LOJA $FIT</h2>
          <div className="w-10"></div>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Saldo Atual</p>
            <div className="flex items-center gap-2">
              <Coins className="w-8 h-8 text-green-400" />
              <span className="text-4xl font-bold text-white">{fitTokens} <span className="text-xl text-green-400">$FIT</span></span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Pontos de Esforço</p>
            <p className="text-lg font-bold text-cyan-400">{totalEffortPoints} / 1000</p>
            <p className="text-[10px] text-gray-500">para o próximo token</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 mb-4 tracking-wider">RECOMPENSAS DISPONÍVEIS</h3>
          
          {rewards.map(reward => {
            const canAfford = fitTokens >= reward.cost;
            return (
              <div 
                key={reward.id} 
                className={`bg-gray-800/40 border ${canAfford ? 'border-gray-600' : 'border-gray-800 opacity-60'} rounded-xl p-4 flex items-center gap-4`}
              >
                <div className="bg-gray-900 rounded-lg p-3">
                  {reward.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold">{reward.name}</h4>
                  <p className="text-xs text-gray-400 uppercase">{reward.type}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-gray-500'} flex items-center gap-1`}>
                    {reward.cost} <Coins className="w-3 h-3" />
                  </span>
                  <button 
                    disabled={!canAfford}
                    className={`mt-2 text-xs px-3 py-1 rounded-full font-bold ${canAfford ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                  >
                    {canAfford ? 'COMPRAR' : 'BLOQUEADO'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlobalBackground>
  );
};
