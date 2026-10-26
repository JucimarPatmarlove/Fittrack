// Testes unitários para o Motor de Progressão
// Vitest

import { describe, it, expect } from 'vitest';
import {
  readSession,
  nextPrescription,
  countStalls,
  type Session,
  type WorkoutSet,
  type ExerciseConfig,
} from './progression';

// Helper para criar configuração base
function createConfig(overrides: Partial<ExerciseConfig> = {}): ExerciseConfig {
  return {
    exerciseId: 'bench-press',
    sets: 3,
    reps: 12,
    repsMin: 8,
    weightIncrement: 2.5,
    currentWeight: 80,
    isBodyweight: false,
    ...overrides,
  };
}

// Helper para criar série de trabalho
function createWorkSet(
  completedReps: number,
  targetReps: number,
  weight: number,
  done = true
): WorkoutSet {
  return {
    weight,
    targetReps,
    completedReps,
    done,
    isWarmup: false,
  };
}

// Helper para criar sessão
function createSession(
  sets: WorkoutSet[],
  config: ExerciseConfig,
  id = 'session-1',
  date = '2024-01-15'
): Session {
  return {
    id,
    date,
    exerciseId: config.exerciseId,
    sets,
    config,
  };
}

describe('readSession — Leitura Honesta', () => {
  it('deve retornar ok=false quando falha uma série (completedReps < targetReps)', () => {
    const config = createConfig();
    const sets = [
      createWorkSet(12, 12, 80), // hit
      createWorkSet(10, 12, 80), // MISS - só 10 reps
      createWorkSet(12, 12, 80), // hit
    ];
    const session = createSession(sets, config);

    const judgement = readSession(session);

    expect(judgement.ok).toBe(false);
    expect(judgement.reason).toContain('Falhou: 10/12 reps');
  });

  it('deve retornar ok=false quando série não foi feita (done=false)', () => {
    const config = createConfig();
    const sets = [
      createWorkSet(12, 12, 80),
      createWorkSet(0, 12, 80, false), // MISS - não feita
      createWorkSet(12, 12, 80),
    ];
    const session = createSession(sets, config);

    const judgement = readSession(session);

    expect(judgement.ok).toBe(false);
    expect(judgement.reason).toContain('Falhou: 0/12 reps');
  });

  it('deve retornar ok=false quando há menos séries que o prescrito', () => {
    const config = createConfig();
    const sets = [
      createWorkSet(12, 12, 80),
      createWorkSet(12, 12, 80),
      // 3ª série em falta
    ];
    const session = createSession(sets, config);

    const judgement = readSession(session);

    expect(judgement.ok).toBe(false);
    expect(judgement.reason).toContain('Apenas 2 de 3 séries');
  });

  it('deve retornar ok=true quando todas as séries batem o alvo', () => {
    const config = createConfig();
    const sets = [
      createWorkSet(12, 12, 80),
      createWorkSet(12, 12, 80),
      createWorkSet(12, 12, 80),
    ];
    const session = createSession(sets, config);

    const judgement = readSession(session);

    expect(judgement.ok).toBe(true);
    expect(judgement.reason).toContain('Todas as 3 séries completadas');
  });

  it('deve ignorar séries de aquecimento (isWarmup=true)', () => {
    const config = createConfig();
    const sets = [
      { ...createWorkSet(5, 5, 40), isWarmup: true }, // warmup - não conta
      createWorkSet(12, 12, 80),
      createWorkSet(12, 12, 80),
      createWorkSet(12, 12, 80),
    ];
    const session = createSession(sets, config);

    const judgement = readSession(session);

    expect(judgement.ok).toBe(true);
    expect(judgement.completedSets).toBe(3);
  });
});

describe('nextPrescription — Dupla Progressão', () => {
  it('TESTE 1: Cenário de falha deve retornar "hold" (manter peso)', () => {
    const config = createConfig({ currentWeight: 80 });
    const lastSession = createSession(
      [
        createWorkSet(12, 12, 80),
        createWorkSet(10, 12, 80), // FALHOU
        createWorkSet(12, 12, 80),
      ],
      config,
      'session-last'
    );
    const sessions = [lastSession];

    const prescription = nextPrescription(sessions, config);

    expect(prescription.kind).toBe('hold');
    expect(prescription.weight).toBe(80);
    expect(prescription.reps).toBeLessThanOrEqual(12);
    expect(prescription.reason).toContain('Falhou');
  });

  it('TESTE 2: Cenário de topo do intervalo deve retornar "up" com novo peso', () => {
    const config = createConfig({ currentWeight: 80 });
    const lastSession = createSession(
      [
        createWorkSet(12, 12, 80), // topo do range
        createWorkSet(12, 12, 80), // topo do range
        createWorkSet(12, 12, 80), // topo do range
      ],
      config,
      'session-last'
    );
    const sessions = [lastSession];

    const prescription = nextPrescription(sessions, config);

    expect(prescription.kind).toBe('up');
    expect(prescription.weight).toBe(82.5); // 80 + 2.5
    expect(prescription.reps).toBe(8); // volta ao mínimo
    expect(prescription.reason).toContain('Topo do intervalo');
    expect(prescription.reason).toContain('+2.5kg');
  });

  it('deve retornar "first" quando não há histórico', () => {
    const config = createConfig({ currentWeight: 60 });
    const sessions: Session[] = [];

    const prescription = nextPrescription(sessions, config);

    expect(prescription.kind).toBe('first');
    expect(prescription.weight).toBe(60);
    expect(prescription.reps).toBe(8); // repsMin
    expect(prescription.reason).toContain('Primeira sessão');
  });

  it('deve retornar "deload" após 3 falhas consecutivas', () => {
    const config = createConfig({ currentWeight: 80 });
    // 3 sessões falhadas seguidas
    const sessions = [
      createSession(
        [createWorkSet(8, 12, 80), createWorkSet(8, 12, 80), createWorkSet(8, 12, 80)],
        config,
        's1'
      ),
      createSession(
        [createWorkSet(9, 12, 80), createWorkSet(9, 12, 80), createWorkSet(9, 12, 80)],
        config,
        's2'
      ),
      createSession(
        [createWorkSet(10, 12, 80), createWorkSet(10, 12, 80), createWorkSet(10, 12, 80)],
        config,
        's3'
      ),
    ];

    const prescription = nextPrescription(sessions, config, { deloadAfter: 3 });

    expect(prescription.kind).toBe('deload');
    expect(prescription.weight).toBeLessThan(80);
    expect(prescription.reps).toBe(8);
    expect(prescription.reason).toContain('deload');
  });

  it('deve fazer hold e subir reps gradualmente quando falha (não atinge target)', () => {
    const config = createConfig({ currentWeight: 80 });
    const lastSession = createSession(
      [
        createWorkSet(10, 12, 80),
        createWorkSet(10, 12, 80),
        createWorkSet(10, 12, 80),
      ],
      config,
      'session-last'
    );
    const sessions = [lastSession];

    const prescription = nextPrescription(sessions, config);

    expect(prescription.kind).toBe('hold');
    expect(prescription.weight).toBe(80);
    expect(prescription.reps).toBe(11); // low(10) + step(1)
    expect(prescription.reason).toContain('Falhou — mantém 80kg');
  });

  it('não deve subir reps além do topo do intervalo', () => {
    const config = createConfig({ currentWeight: 80 });
    const lastSession = createSession(
      [
        createWorkSet(11, 12, 80),
        createWorkSet(11, 12, 80),
        createWorkSet(11, 12, 80),
      ],
      config,
      'session-last'
    );
    const sessions = [lastSession];

    const prescription = nextPrescription(sessions, config);

    expect(prescription.reps).toBeLessThanOrEqual(12);
  });
});

describe('countStalls — Contagem de Estagnação', () => {
  it('deve contar falhas consecutivas', () => {
    const config = createConfig({ currentWeight: 80 });
    const sessions = [
      createSession([createWorkSet(8, 12, 80), createWorkSet(8, 12, 80), createWorkSet(8, 12, 80)], config, 's1'),
      createSession([createWorkSet(9, 12, 80), createWorkSet(9, 12, 80), createWorkSet(9, 12, 80)], config, 's2'),
      createSession([createWorkSet(10, 12, 80), createWorkSet(10, 12, 80), createWorkSet(10, 12, 80)], config, 's3'),
    ];

    const stalls = countStalls(sessions, config);

    expect(stalls).toBe(3);
  });

  it('deve zerar streak após sucesso', () => {
    const config = createConfig({ currentWeight: 80 });
    const sessions = [
      createSession([createWorkSet(8, 12, 80), createWorkSet(8, 12, 80), createWorkSet(8, 12, 80)], config, 's1'),
      createSession([createWorkSet(12, 12, 80), createWorkSet(12, 12, 80), createWorkSet(12, 12, 80)], config, 's2'), // SUCESSO
      createSession([createWorkSet(9, 12, 80), createWorkSet(9, 12, 80), createWorkSet(9, 12, 80)], config, 's3'),
    ];

    const stalls = countStalls(sessions, config);

    expect(stalls).toBe(1); // apenas a última conta
  });

  it('deve quebrar streak quando peso muda (deload)', () => {
    const config = createConfig({ currentWeight: 80 });
    const sessions = [
      createSession([createWorkSet(8, 12, 80), createWorkSet(8, 12, 80), createWorkSet(8, 12, 80)], config, 's1'),
      createSession([createWorkSet(8, 12, 75), createWorkSet(8, 12, 75), createWorkSet(8, 12, 75)], { ...config, currentWeight: 75 }, 's2'), // deload
      createSession([createWorkSet(9, 12, 75), createWorkSet(9, 12, 75), createWorkSet(9, 12, 75)], { ...config, currentWeight: 75 }, 's3'),
    ];

    const stalls = countStalls(sessions, config);

    expect(stalls).toBe(2); // não conta a sessão antes do deload
  });
});