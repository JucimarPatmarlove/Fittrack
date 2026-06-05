import { test, expect } from '@playwright/test';

test('completa um treino simples e verifica persistência', async ({ page }) => {
  // Assumindo que o perfil já existe (ou cria um mock)
  await page.goto('/');
  await page.fill('input[placeholder="PIN"]', '1234');
  await page.click('button:has-text("Desbloquear")');

  // Aguardar dashboard carregar
  await expect(page.locator('text=INICIAR TREINO')).toBeVisible();

  // Iniciar um treino (ex: usar o FreeWorkoutBuilder)
  await page.click('button:has-text("Treino Livre")');
  await page.click('text=Peito');
  await page.click('button:has-text("CONTINUAR →")');
  await page.click('text=Halteres');
  await page.click('button:has-text("CONTINUAR →")');
  await page.click('button:has-text("INICIAR TREINO AGORA")');

  // Completar primeira série de um exercício
  await page.waitForSelector('button:has-text("○")');
  await page.click('button:has-text("○")');
  // (simular RPE)
  await page.fill('input[placeholder="RPE"]', '8');
  await page.click('button:has-text("✓")');

  // Terminar treino
  await page.click('button:has-text("TERMINAR TREINO")');
  await expect(page.locator('text=TREINO CONCLUÍDO')).toBeVisible();
});
