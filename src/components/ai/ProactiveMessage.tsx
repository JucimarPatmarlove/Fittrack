// @ts-nocheck
// ============================================================
// FitTrack V7 — Proactive Message Component
// ============================================================
// src/components/ai/ProactiveMessage.tsx
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, AlertTriangle, Flame, Trophy, Moon, Dumbbell } from 'lucide-react';
import type { ProactiveMessage } from '../../services/aiCoach/proactiveEngine';
import { getMessageIcon } from '../../services/aiCoach/proactiveEngine';
import { useProactiveCoachStore } from '../../stores/useProactiveCoachStore';
import { InteractiveButton } from '../ui/MotionComponents';

const PRIORITY_STYLES = {
  urgent: 'bg-red-50 border-red-300 text-red-900 shadow-red-100',
  high: 'bg-orange-50 border-orange-300 text-orange-900 shadow-orange-100',
  medium: 'bg-blue-50 border-blue-300 text-blue-900 shadow-blue-100',
  low: 'bg-gray-50 border-gray-200 text-gray-700',
};

const PRIORITY_ICONS = {
  urgent: AlertTriangle,
  high: Flame,
  medium: Moon,
  low: Dumbbell,
};

interface ProactiveMessageProps {
  message: ProactiveMessage;
  onAction?: (message: ProactiveMessage) => void;
  compact?: boolean;
}

export const ProactiveMessageCard: React.FC<ProactiveMessageProps> = ({
  message,
  onAction,
  compact = false,
}) => {
  const dismissMessage = useProactiveCoachStore((s) => s.dismissMessage);
  const PriorityIcon = PRIORITY_ICONS[message.priority] || AlertTriangle;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className={`flex items-center gap-3 p-3 rounded-lg border ${PRIORITY_STYLES[message.priority]} shadow-sm`}
      >
        <span className="text-xl">{getMessageIcon(message.trigger)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{message.title}</p>
        </div>
        <button
          onClick={() => dismissMessage(message.id)}
          className="p-1 hover:bg-black/5 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative p-4 rounded-xl border-2 ${PRIORITY_STYLES[message.priority]} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg ${message.priority === 'urgent' ? 'bg-red-100' : message.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'}`}
        >
          <PriorityIcon
            className={`w-5 h-5 ${message.priority === 'urgent' ? 'text-red-600' : message.priority === 'high' ? 'text-orange-600' : 'text-blue-600'}`}
          />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{message.title}</h4>
          <p className="text-sm mt-1 opacity-90 leading-relaxed">{message.body}</p>
        </div>
        <button
          onClick={() => dismissMessage(message.id)}
          className="p-1 hover:bg-black/5 rounded-full transition -mt-1 -mr-1"
        >
          <X className="w-4 h-4 opacity-50" />
        </button>
      </div>

      {/* Action Button */}
      {message.action !== 'dismiss' && (
        <div className="mt-3 flex gap-2">
          <InteractiveButton
            onClick={() => onAction?.(message)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
              message.priority === 'urgent'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : message.priority === 'high'
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {message.actionLabel}
            <ChevronRight className="w-4 h-4" />
          </InteractiveButton>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs opacity-50 mt-2">
        {new Date(message.timestamp).toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </motion.div>
  );
};

// Banner fixo no topo (para mensagens urgentes)
export const ProactiveBanner: React.FC = () => {
  const urgentMessages = useProactiveCoachStore((s) => s.getUrgentMessages());
  const dismissMessage = useProactiveCoachStore((s) => s.dismissMessage);

  const topMessage = urgentMessages[0];
  if (!topMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={topMessage.id}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`sticky top-0 z-50 p-3 ${
          topMessage.priority === 'urgent' ? 'bg-red-600' : 'bg-orange-500'
        } text-white`}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <span className="text-xl">{getMessageIcon(topMessage.trigger)}</span>
          <p className="flex-1 text-sm font-medium">{topMessage.title}</p>
          <button
            onClick={() => dismissMessage(topMessage.id)}
            className="p-1 hover:bg-white/20 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Lista de mensagens (para uma tab/screen dedicada)
export const ProactiveMessageList: React.FC = () => {
  const messages = useProactiveCoachStore((s) => s.getActiveMessages());
  const unreadCount = useProactiveCoachStore((s) => s.unreadCount);

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">💬 Coach Proativo</h3>
        {unreadCount > 0 && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount} novo{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-400"
          >
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Tudo em ordem! Nenhum alerta ativo.</p>
          </motion.div>
        ) : (
          messages.map((msg) => <ProactiveMessageCard key={msg.id} message={msg} />)
        )}
      </AnimatePresence>
    </div>
  );
};
