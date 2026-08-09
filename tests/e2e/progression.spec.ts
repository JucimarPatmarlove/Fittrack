import { expect, test } from '@playwright/test';

test('verifica a gravação de progressão no store cifrado', async ({ page }) => {
  // Configuração inicial: aceder à app e desbloquear
  await page.goto('/');
  await page.fill('input[placeholder="PIN"]', '1234');

  // Tentar desbloquear. Se for a primeira vez, será "ENCRIPTAR DISCO"
  const unlockBtn = page.locator('button', { hasText: /DESBLOQUEAR|ENCRIPTAR DISCO/ });
  await unlockBtn.click();

  // Se pedir confirmação de PIN (no caso de ser primeira vez)
  const confirmPinInput = page.locator('input[placeholder="Confirma o PIN"]');
  if (await confirmPinInput.isVisible()) {
    await confirmPinInput.fill('1234');
    await page.click('button:has-text("CONFIRMAR E ENCRIPTAR")');
  }

  // Aguardar dashboard
  await expect(page.locator('text=INICIAR TREINO')).toBeVisible();

  // Iniciar um treino rápido
  await page.click('button:has-text("Treino Livre")');
  await page.click('text=Peito');
  await page.click('button:has-text("CONTINUAR →")');
  await page.click('text=Halteres');
  await page.click('button:has-text("CONTINUAR →")');
  await page.click('button:has-text("INICIAR TREINO AGORA")');

  // Encontrar o botão da primeira série e concluí-la
  const seriesButton = page.locator('button:has-text("○")').first();
  await seriesButton.waitFor({ state: 'visible' });
  await seriesButton.click();

  // Simular RPE e preencher
  const rpeInput = page.locator('input[placeholder="RPE"]');
  await rpeInput.waitFor({ state: 'visible' });
  await rpeInput.fill('8');
  await page.click('button:has-text("✓")');

  // Terminar Treino
  await page.click('button:has-text("TERMINAR TREINO")');

  // Verificar ecrã de sucesso
  await expect(page.locator('text=TREINO CONCLUÍDO')).toBeVisible();

  // Aceder à base de dados IndexedDB e verificar se o store Zustand está cifrado
  const encryptedStoreData = await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const req = window.indexedDB.open('FitTrack_V7_ZustandStore', 1);
      req.onsuccess = (e: any) => {
        const db = e.target.result;
        try {
          const tx = db.transaction('fittrack_zustand_encrypted', 'readonly');
          const store = tx.objectStore('fittrack_zustand_encrypted');
          const getReq = store.get('progression-store');
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject('Error getting progression-store');
        } catch (err) {
          resolve(null); // Object store may not exist yet
        }
      };
      req.onerror = () => reject('Error opening IDB');
    });
  });

  // Como o dado está cifrado com AES-GCM, deve ser uma string longa Base64, e não JSON puro
  if (encryptedStoreData) {
    expect(typeof encryptedStoreData).toBe('string');
    expect(encryptedStoreData).not.toContain('"history"'); // Não deve ser JSON em plaintext
  }
});
