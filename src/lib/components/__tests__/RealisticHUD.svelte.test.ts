import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RealisticHUD from '../RealisticHUD.svelte';

const runningStatus = {
	day: 42.6,
	nodeId: 'n1',
	nodeName: 'State License Application',
	weeksInStep: 2.2,
	totalWeeksInStep: 4,
	finished: false
};

const finishedStatus = {
	day: 180,
	nodeId: null,
	nodeName: null,
	weeksInStep: 0,
	totalWeeksInStep: 0,
	finished: true
};

describe('RealisticHUD', () => {
	it('renders Day label and floored day count while running', () => {
		render(RealisticHUD, { status: runningStatus, onReplay: () => {} });
		expect(screen.getByText('Day')).toBeInTheDocument();
		expect(screen.getByText('42')).toBeInTheDocument();
	});

	it('renders active node name + "Week X of Y" while running', () => {
		render(RealisticHUD, { status: runningStatus, onReplay: () => {} });
		expect(screen.getByText('State License Application')).toBeInTheDocument();
		expect(screen.getByText(/Week 3 of 4/)).toBeInTheDocument();
	});

	it('renders Complete state with total days and Replay button when finished', () => {
		render(RealisticHUD, { status: finishedStatus, onReplay: () => {} });
		expect(screen.getByText('Complete')).toBeInTheDocument();
		expect(screen.getByText('180 days')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Replay/i })).toBeInTheDocument();
	});

	it('invokes onReplay when the Replay button is clicked', async () => {
		const onReplay = vi.fn();
		render(RealisticHUD, { status: finishedStatus, onReplay });
		await fireEvent.click(screen.getByRole('button', { name: /Replay/i }));
		expect(onReplay).toHaveBeenCalledTimes(1);
	});

	it('renders the parallel-min block only when minWeeks > 0', () => {
		const { rerender } = render(RealisticHUD, {
			status: runningStatus,
			onReplay: () => {},
			minWeeks: 0
		});
		expect(screen.queryByText(/Min\. with parallelism/i)).toBeNull();

		rerender({ status: runningStatus, onReplay: () => {}, minWeeks: 8 });
		expect(screen.getByText(/Min\. with parallelism/i)).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
	});

	it('ceils fractional minWeeks for display', () => {
		render(RealisticHUD, {
			status: runningStatus,
			onReplay: () => {},
			minWeeks: 7.2
		});
		expect(screen.getByText('8')).toBeInTheDocument();
	});
});
