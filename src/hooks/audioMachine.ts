import { createMachine } from './useMachine';

export type AudioState =
  | { status: 'idle' }
  | { status: 'speaking'; message: string }
  | { status: 'queued'; queue: string[] }
  | { status: 'paused'; currentMessage: string; queue: string[] };

export type AudioEvent =
  | { type: 'SPEAK'; message: string }
  | { type: 'END' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CLEAR' };

export const audioMachine = createMachine<AudioState, AudioEvent>({
  initialState: { status: 'idle' },
  states: {
    idle: {
      on: {
        SPEAK: {
          target: (state, event) => ({ status: 'speaking', message: event.message }),
        },
      },
    },
    speaking: {
      on: {
        END: {
          target: (state) => {
            if (state.status === 'speaking' && 'queue' in state && state.queue.length > 0) {
              const [next, ...rest] = state.queue;
              return { status: 'speaking', message: next, queue: rest };
            }
            return { status: 'idle' };
          },
        },
        PAUSE: {
          target: (state) => {
            if (state.status === 'speaking') {
              return { status: 'paused', currentMessage: state.message, queue: state.queue || [] };
            }
            return state;
          },
        },
        SPEAK: {
          target: (state, event) => {
            if (state.status === 'speaking') {
              const queue = state.queue || [];
              return { status: 'speaking', message: state.message, queue: [...queue, event.message] };
            }
            return { status: 'speaking', message: event.message };
          },
        },
        CLEAR: {
          target: { status: 'idle' },
        },
      },
    },
    paused: {
      on: {
        RESUME: {
          target: (state) => {
            if (state.status === 'paused') {
              return { status: 'speaking', message: state.currentMessage, queue: state.queue || [] };
            }
            return { status: 'idle' };
          },
        },
        CLEAR: {
          target: { status: 'idle' },
        },
      },
    },
  },
});
