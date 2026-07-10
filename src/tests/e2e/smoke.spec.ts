import { test, expect } from '@playwright/test';

async function openTitleMenu(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Attract mode: PRESS START
  await expect(page.getByTestId('btn-press-start')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('btn-press-start').click();
  await expect(page.getByTestId('btn-play')).toBeVisible();
}

test.describe('MOTH//LAMP smoke', () => {
  test('loads 16-bit intro without wallet prompt', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', (d) => {
      dialogs.push(d.message());
      void d.dismiss();
    });

    await page.goto('/');
    await expect(page.getByRole('img', { name: 'MOTH//LAMP' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('btn-press-start')).toBeVisible();
    await expect(page.getByText('PRESS START')).toBeVisible();
    // No automatic wallet/modals
    expect(dialogs).toHaveLength(0);
  });

  test('press start opens menu and play starts game', async ({ page }) => {
    await openTitleMenu(page);
    await page.getByTestId('btn-play').click();
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    // Overlay should hide while playing
    await expect(page.getByTestId('screen-title')).toHaveCount(0);
  });

  test('settings and legal pages reachable', async ({ page }) => {
    await openTitleMenu(page);
    await page.getByRole('button', { name: /SETTINGS/i }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    // back to title attract or menu — use footer Privacy
    await page.getByRole('button', { name: 'PRIVACY' }).click();
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  });

  test('profile wallet UI is optional and not forced', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('btn-press-start')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'PROFILE' }).click();
    await expect(page.locator('.optional-badge')).toHaveText('OPTIONAL');
    await expect(page.getByText(/works without a wallet/i)).toBeVisible();
  });

  test('important buttons meet touch size', async ({ page }) => {
    await openTitleMenu(page);
    const box = await page.getByTestId('btn-play').boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
