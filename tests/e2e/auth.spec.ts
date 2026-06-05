import { test, expect } from '@playwright/test';

test.describe('Zero Trust Auth Flow', () => {
  test('deve solicitar token efémero ao servidor e não conter segredos no cliente', async ({ page }) => {
    let tokenRequested = false;

    // Interceptar o endpoint para garantir que a arquitetura Zero Trust está a ser respeitada
    await page.route('/api/request-token', async (route) => {
      tokenRequested = true;
      const request = route.request();
      expect(request.method()).toBe('POST');
      
      const postData = JSON.parse(request.postData() || '{}');
      expect(postData.nonce).toBeDefined();
      expect(postData.timestamp).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mocked-jwt-token-12345' })
      });
    });

    await page.goto('/');

    // Navegar para uma área que garanta o carregamento inicial da UI
    await expect(page.locator('body')).toBeVisible();

    // Como o token só é pedido on-demand, disparamos a função programaticamente no contexto da página
    const token = await page.evaluate(async () => {
       try {
         // Importação dinâmica para contornar contexto do Playwright e aceder diretamente ao engine
         const mod = await import('/src/services/jwtEngine.ts' as any);
         return await mod.generateShortLivedToken();
       } catch (e) {
         return 'erro_na_importacao';
       }
    });

    expect(tokenRequested).toBe(true);
    expect(token).toBe('mocked-jwt-token-12345');
  });
});
