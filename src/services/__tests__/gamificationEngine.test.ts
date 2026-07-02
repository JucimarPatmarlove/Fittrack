import { describe, it, expect, vi } from 'vitest';
import {
  getCurrentLevel,
  LEVEL_THRESHOLDS,
} from '../gamificationEngine';

// Mock the DB module since tests run without IndexedDB
vi.mock('../../db/schema', () => ({
  getDB: vi.fn(),
  getRecentSetLogsDecrypted: vi.fn(),
  getRecoveryMetricsByDateRange: vi.fn(),
}));

describe('gamificationEngine', () => {
  // ──────────────────────────────────────────────────────────────────
  // calculateWorkoutXP, detectNewExercises, and syncUserStats all
  // require IndexedDB (via getDB()). We test the pure functions that
  // can run without a database.
  // ──────────────────────────────────────────────────────────────────

  describe('getCurrentLevel', () => {
    it('deve retornar nível 1 para XP = 0', () => {
      const level = getCurrentLevel(0);
      expect(level.level).toBe(1);
      expect(level.title).toBe('Iniciante');
    });

    it('deve retornar nível 2 para XP = 500', () => {
      const level = getCurrentLevel(500);
      expect(level.level).toBe(2);
      expect(level.title).toBe('Praticante');
    });

    it('deve retornar nível 3 para XP = 1500', () => {
      const level = getCurrentLevel(1500);
      expect(level.level).toBe(3);
      expect(level.title).toBe('Atleta Amador');
    });

    it('deve retornar nível 4 para XP = 3000', () => {
      const level = getCurrentLevel(3000);
      expect(level.level).toBe(4);
      expect(level.title).toBe('Guerreiro do Ferro');
    });

    it('deve retornar o nível mais alto quando XP é muito grande', () => {
      const level = getCurrentLevel(100000);
      const maxLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
      expect(level.level).toBe(maxLevel.level);
      expect(level.title).toBe(maxLevel.title);
    });

    it('deve retornar nível 1 para XP negativo', () => {
      const level = getCurrentLevel(-100);
      expect(level.level).toBe(1);
    });

    it('deve retornar o nível correto logo abaixo da fronteira', () => {
      // 499 XP = still level 1 (level 2 starts at 500)
      const level = getCurrentLevel(499);
      expect(level.level).toBe(1);
    });
  });

  describe('LEVEL_THRESHOLDS', () => {
    it('deve ter pelo menos 5 thresholds', () => {
      expect(LEVEL_THRESHOLDS.length).toBeGreaterThanOrEqual(5);
    });

    it('deve ter thresholds ordenados por xpRequired', () => {
      for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].xpRequired).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1].xpRequired);
      }
    });

    it('deve ter níveis sequenciais começando em 1', () => {
      for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].level).toBe(i + 1);
      }
    });

    it('cada threshold deve ter um título não-vazio', () => {
      for (const t of LEVEL_THRESHOLDS) {
        expect(t.title).toBeTruthy();
        expect(t.title.length).toBeGreaterThan(0);
      }
    });

    it('o primeiro nível deve começar com xpRequired = 0', () => {
      expect(LEVEL_THRESHOLDS[0].xpRequired).toBe(0);
    });
  });
});
