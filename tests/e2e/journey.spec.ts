import { test, expect } from '@playwright/test';

test.describe('Journey screen', () => {
	test('opens from a journey row and renders the matrix', async ({ page }) => {
		await page.goto('/');
		// Click the first journey row
		const firstJourney = page.locator('button.journey-row').first();
		const journeyName = await firstJourney.locator('h2').innerText();
		await firstJourney.click();

		await expect(page).toHaveURL(/\/journey\//);
		await expect(page.getByRole('heading', { name: journeyName })).toBeVisible();

		// Matrix has Federal / State / Local column headers
		await expect(page.getByText('Federal', { exact: true }).first()).toBeVisible();
		await expect(page.getByText('State', { exact: true }).first()).toBeVisible();
		await expect(page.getByText('Local', { exact: true }).first()).toBeVisible();

		// And the four phase labels
		await expect(page.getByText('Preparation', { exact: true })).toBeVisible();
		await expect(page.getByText('Application', { exact: true })).toBeVisible();
		await expect(page.getByText('Inspection', { exact: true })).toBeVisible();
		await expect(page.getByText('Active', { exact: true })).toBeVisible();
	});

	test('clicking a node opens the detail panel; Esc returns home', async ({ page }) => {
		await page.goto('/');
		await page.locator('button.journey-row').first().click();
		await expect(page).toHaveURL(/\/journey\//);

		// Click the first visible node card
		const firstCard = page.locator('[data-node-id]').first();
		await firstCard.click();

		// Detail panel should appear (aside with role complementary-like heading)
		await expect(page.getByText(/Key Metadata/i)).toBeVisible();

		// Close via the X button in the panel header (first close button in the panel)
		// Panel has an onclick close on its X icon div — press Escape on the doc to return home
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\/$|\/\??$/);
	});

	test('invalid journey id redirects to home', async ({ page }) => {
		await page.goto('/journey/this-does-not-exist');
		await expect(page).toHaveURL(/\/$|\/\??$/);
		await expect(page.getByRole('heading', { name: /Permit & License Journey Explorer/i })).toBeVisible();
	});
});
