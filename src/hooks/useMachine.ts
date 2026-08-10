export type MachineState<TState, TContext> = {
  value: TState;
  context: TContext;
};

export function createMachine(config: any) {
  return config;
}

import { useCallback, useState } from 'react';

export function useMachine<TState, TContext, TEvent extends { type: string }>(
  initialState: TState,
  initialContext: TContext,
  reducer: (state: MachineState<TState, TContext>, event: TEvent) => MachineState<TState, TContext>,
) {
  const [state, setState] = useState<MachineState<TState, TContext>>({
    value: initialState,
    context: initialContext,
  });

  const send = useCallback(
    (event: TEvent) => {
      setState((prevState) => reducer(prevState, event));
    },
    [reducer],
  );

  return [state, send] as const;
}
