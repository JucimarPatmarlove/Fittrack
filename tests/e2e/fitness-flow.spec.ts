import { expect, test } from '@playwright/test';

test('onboarding – criar perfil e avaliar fitness', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[placeholder*="nome"]', 'Atleta Teste');
  await page.click('button:has-text("CONTINUAR")');
  await page.click('text=Hipertrofia');
  await page.click('button:has-text("CONTINUAR")');
  await page.click('text=Intermedio');
  await page.click('button:has-text("COMEÇAR A TREINAR")');
  await expect(page.locator('text=READINESS SCORE')).toBeVisible();
});

test('criar treino com FreeWorkoutBuilder e completar uma série', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Desbloquear")');

  await page.click('button:has-text("Treino Livre")');
  await page.click('text=Peito');
  await page.click('button:has-text("CONTINUAR →")');
  await page.click('text=Halteres');
  await page.click('button:has-text("CONTINUAR →")');
  await page.click('button:has-text("INICIAR TREINO AGORA")');

  await page.waitForSelector('button:has-text("○")');
  await page.click('button:has-text("○")');
  await page.fill('input[placeholder="RPE"]', '8');
  await page.click('button:has-text("✓")');
  await expect(page.locator('text=DESCANSO')).toBeVisible();
  await page.waitForTimeout(5000);
  await page.click('button:has-text("Fechar")');

  await page.click('button:has-text("TERMINAR TREINO")');
  await expect(page.locator('text=TREINO CONCLUÍDO')).toBeVisible();
});

test('verificar que o Trend Analyzer mostra badges no Dashboard', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Desbloquear")');

  await expect(page.locator('text=PROGRESSING').first()).toBeVisible({ timeout: 10000 });
});
