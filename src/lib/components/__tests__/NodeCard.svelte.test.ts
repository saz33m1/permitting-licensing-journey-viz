import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NodeCard from '../NodeCard.svelte';
import { app } from '$lib/stores/app.svelte';
import type { PlcNode } from '$lib/types';

const baseNode: PlcNode = {
	id: 'n1',
	name: 'Federal EIN',
	jurisdiction: 'federal',
	phase: 'preparation'
};

beforeEach(() => {
	app.selectedNode = null;
});

describe('NodeCard', () => {
	it('renders the node name', () => {
		render(NodeCard, { node: baseNode });
		expect(screen.getByText('Federal EIN')).toBeInTheDocument();
	});

	it('exposes the node id via data-node-id for pathCalc measurement', () => {
		const { container } = render(NodeCard, { node: baseNode });
		expect(container.querySelector('[data-node-id="n1"]')).not.toBeNull();
	});

	it('shows the step-index badge (stepIndex + 1) when stepIndex is provided', () => {
		render(NodeCard, { node: baseNode, stepIndex: 2 });
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('omits the step-index badge when stepIndex is not provided', () => {
		const { container } = render(NodeCard, { node: baseNode });
		// Badge is the absolute positioned span with rounded-full
		expect(container.querySelector('.rounded-full')).toBeNull();
	});

	it('renders estTime, Blocking, and Renewal rows when present', () => {
		render(NodeCard, {
			node: {
				...baseNode,
				estTime: '4 Weeks',
				blocking: true,
				renewalTerm: 'Annual'
			}
		});
		expect(screen.getByText('4 Weeks')).toBeInTheDocument();
		expect(screen.getByText('Blocking')).toBeInTheDocument();
		expect(screen.getByText(/Annual/)).toBeInTheDocument();
	});

	it('click toggles app.selectedNode', async () => {
		const { container } = render(NodeCard, { node: baseNode });
		const card = container.querySelector('[data-node-id="n1"]') as HTMLElement;

		await fireEvent.click(card);
		expect(app.selectedNode).toBe('n1');

		await fireEvent.click(card);
		expect(app.selectedNode).toBeNull();
	});

	it('uses a thicker border when selected', async () => {
		const { container } = render(NodeCard, { node: baseNode });
		const card = container.querySelector('[data-node-id="n1"]') as HTMLElement;
		expect(card.style.border).toMatch(/^1px/);

		app.selectedNode = 'n1';
		await Promise.resolve();
		// Re-query the style after reactive update
		expect(card.style.border).toMatch(/^2px/);
	});
});
