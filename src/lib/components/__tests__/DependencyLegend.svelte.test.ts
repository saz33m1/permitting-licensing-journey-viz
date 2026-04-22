import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DependencyLegend from '../DependencyLegend.svelte';
import { app } from '$lib/stores/app.svelte';

beforeEach(() => {
	app.legendOpen = false;
});

describe('DependencyLegend', () => {
	it('renders collapsed by default (pill only)', () => {
		render(DependencyLegend, { mode: 'ambient' });
		expect(screen.getByRole('button', { name: /show legend/i })).toBeInTheDocument();
		expect(screen.queryByText(/How to read this view/i)).toBeNull();
	});

	it('expands when app.legendOpen is true, showing Hard/Soft/Parallel/Entry rows', () => {
		app.legendOpen = true;
		render(DependencyLegend, { mode: 'ambient' });
		expect(screen.getByText(/How to read this view/i)).toBeInTheDocument();
		expect(screen.getByText('Hard')).toBeInTheDocument();
		expect(screen.getByText('Soft')).toBeInTheDocument();
		expect(screen.getByText('Parallel')).toBeInTheDocument();
		expect(screen.getByText('Entry')).toBeInTheDocument();
	});

	it('clicking the pill toggles app.legendOpen to true', async () => {
		render(DependencyLegend, { mode: 'ambient' });
		const pill = screen.getByRole('button', { name: /show legend/i });
		await fireEvent.click(pill);
		expect(app.legendOpen).toBe(true);
	});

	it('clicking the close button toggles app.legendOpen back to false', async () => {
		app.legendOpen = true;
		render(DependencyLegend, { mode: 'ambient' });
		const close = screen.getByRole('button', { name: /hide legend/i });
		await fireEvent.click(close);
		expect(app.legendOpen).toBe(false);
	});

	it('shows "Min. parallel" row only in realistic mode', () => {
		app.legendOpen = true;
		const { rerender } = render(DependencyLegend, { mode: 'ambient' });
		expect(screen.queryByText(/Min\. parallel/i)).toBeNull();

		rerender({ mode: 'realistic' });
		expect(screen.getByText(/Min\. parallel/i)).toBeInTheDocument();
	});
});
