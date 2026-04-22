import { test, expect } from '@playwright/test';

test.describe('Dependency view', () => {
	test('toggles Standard → Dependency and shows the legend + mode switch', async ({ page }) => {
		await page.goto('/');
		await page.locator('button.journey-row').first().click();
		await expect(page).toHaveURL(/\/journey\//);

		// In standard view: dep-mode-toggle radios are NOT present
		await expect(page.locator('input[name="dep-mode-toggle"]').first()).toHaveCount(0);

		// Switch to Dependency view via the label
		await page.getByText('Dependency View', { exact: true }).click();

		// Ambient / Realistic mode toggle should appear
		await expect(page.locator('input[name="dep-mode-toggle"][value="ambient"]').first()).toBeAttached();
		await expect(page.locator('input[name="dep-mode-toggle"][value="realistic"]').first()).toBeAttached();

		// Legend pill should be visible (collapsed by default)
		await expect(page.getByRole('button', { name: /Show legend|Hide legend/i }).first()).toBeVisible();
	});

	test('switching to Realistic mode surfaces the Day counter and Min. with parallelism', async ({ page }) => {
		await page.goto('/');
		await page.locator('button.journey-row').first().click();

		await page.getByText('Dependency View', { exact: true }).click();
		await page.getByText('Realistic', { exact: true }).click();

		// HUD shows Day label + a numeric value
		await expect(page.getByText('Day', { exact: true }).first()).toBeVisible();

		// Min. with parallelism readout is present (may require animation tick)
		await expect(page.getByText(/Min\. with parallelism/i)).toBeVisible({ timeout: 5000 });
	});

	test('expanding the legend shows Hard/Soft/Parallel rows', async ({ page }) => {
		await page.goto('/');
		await page.locator('button.journey-row').first().click();
		await page.getByText('Dependency View', { exact: true }).click();

		await page.getByRole('button', { name: /Show legend/i }).click();

		await expect(page.getByText('Hard', { exact: true })).toBeVisible();
		await expect(page.getByText('Soft', { exact: true })).toBeVisible();
		await expect(page.getByText('Parallel', { exact: true })).toBeVisible();
		await expect(page.getByText('Entry', { exact: true })).toBeVisible();
	});

	test('switching back to Standard view resets depMode to ambient', async ({ page }) => {
		await page.goto('/');
		await page.locator('button.journey-row').first().click();

		await page.getByText('Dependency View', { exact: true }).click();
		await page.getByText('Realistic', { exact: true }).click();
		await page.getByText('Standard View', { exact: true }).click();

		// Switch back into dependency view — ambient should be the default again
		await page.getByText('Dependency View', { exact: true }).click();
		await expect(page.locator('input[name="dep-mode-toggle"][value="ambient"]').first()).toBeChecked();
	});
});
