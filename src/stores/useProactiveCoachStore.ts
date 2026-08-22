// @ts-nocheck
// ============================================================
// FitTrack V7 — Proactive Coach Store
// ============================================================
// src/stores/useProactiveCoachStore.ts
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProactiveMessage, TriggerContext } from '../services/aiCoach/proactiveEngine';
import { evaluateTriggers, shouldShowMessage } from '../services/aiCoach/proactiveEngine';
import { trackEvent } from '../utils/telemetry';

interface ProactiveCoachState {
  messages: ProactiveMessage[];
  unreadCount: number;
  isEvaluating: boolean;
  lastEvaluation: string | null;

  // Actions
  evaluate: (context: TriggerContext) => void;
  dismissMessage: (messageId: string) => void;
  dismissAll: () => void;
  markAsRead: (messageId: string) => void;
  getActiveMessages: () => ProactiveMessage[];
  getUrgentMessages: () => ProactiveMessage[];
}

export const useProactiveCoachStore = create<ProactiveCoachState>()(
  persist(
    (set, get) => ({
      messages: [],
      unreadCount: 0,
      isEvaluating: false,
      lastEvaluation: null,

      evaluate: (context) => {
        set({ isEvaluating: true });

        try {
          const newMessages = evaluateTriggers(context);
          const existingIds = new Set(get().messages.map((m) => m.id));
          const trulyNew = newMessages.filter((m) => !existingIds.has(m.id));

          if (trulyNew.length > 0) {
            set((state) => ({
              messages: [...trulyNew, ...state.messages].slice(0, 50), // Max 50 messages
              unreadCount: state.unreadCount + trulyNew.length,
              lastEvaluation: new Date().toISOString(),
            }));

            trackEvent('proactive_evaluation', {
              newMessages: trulyNew.length,
              triggers: trulyNew.map((m) => m.trigger),
            });
          }
        } catch (error) {
          console.error('Error evaluating proactive triggers:', error);
        } finally {
          set({ isEvaluating: false });
        }
      },

      dismissMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === messageId ? { ...m, dismissed: true } : m)),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        trackEvent('proactive_message_dismissed', { messageId });
      },

      dismissAll: () => {
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, dismissed: true })),
          unreadCount: 0,
        }));
      },

      markAsRead: (_messageId) => {
        set((state) => ({
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      getActiveMessages: () => {
        return get().messages.filter(shouldShowMessage);
      },

      getUrgentMessages: () => {
        const msgs = get().messages;
        return msgs
          .filter(shouldShowMessage)
          .filter((m) => m.priority === 'urgent' || m.priority === 'high');
      },
    }),
    {
      name: 'fittrack-proactive-coach',
      partialize: (state) => ({
        messages: state.messages.filter((m) => !m.dismissed),
        lastEvaluation: state.lastEvaluation,
      }),
    },
  ),
);
