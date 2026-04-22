import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NodeDetailPanel from '../NodeDetailPanel.svelte';
import { app } from '$lib/stores/app.svelte';
import type { Journey, PlcNode } from '$lib/types';

const nodes: PlcNode[] = [
	{
		id: 'ein',
		name: 'Federal EIN',
		jurisdiction: 'federal',
		phase: 'preparation',
		agency: 'IRS',
		fee: 'Free',
		estTime: '1 Week',
		renewalTerm: null,
		description: 'Tax ID for the business.',
		required: true,
		blocking: true
	},
	{
		id: 'ein2',
		name: 'State Registration',
		jurisdiction: 'state',
		phase: 'application'
	},
	{
		id: 'local-permit',
		name: 'Local Health Permit',
		jurisdiction: 'local',
		phase: 'inspection'
	}
];

const journey: Journey = {
	id: 'test-j',
	name: 'Test Journey',
	cat: 'food',
	steps: ['ein', 'ein2', 'local-permit'],
	dependencies: [
		{ from: 'ein', to: 'ein2', type: 'hard' },
		{ from: 'ein2', to: 'local-permit', type: 'soft' }
	]
};

beforeEach(() => {
	app.loadData({
		jurisdictions: [
			{ id: 'federal', name: 'Federal' },
			{ id: 'state', name: 'State' },
			{ id: 'local', name: 'Local' }
		],
		categories: [{ id: 'food', name: 'Food' }],
		plcNodes: nodes,
		journeys: [journey]
	});
	app.selectJourney('test-j');
	app.selectedNode = null;
});

describe('NodeDetailPanel', () => {
	it('renders the node name, agency, and description', () => {
		render(NodeDetailPanel, { node: nodes[0] });
		expect(screen.getByText('Federal EIN')).toBeInTheDocument();
		expect(screen.getByText('IRS')).toBeInTheDocument();
		expect(screen.getByText(/Tax ID for the business/)).toBeInTheDocument();
	});

	it('shows Required / Optional chip based on node.required', () => {
		const { unmount } = render(NodeDetailPanel, { node: nodes[0] });
		expect(screen.getByText('Required')).toBeInTheDocument();
		unmount();

		render(NodeDetailPanel, {
			node: { ...nodes[0], required: false }
		});
		expect(screen.getByText('Optional')).toBeInTheDocument();
	});

	it('shows "Critical Path" for blocking nodes, "Standard" otherwise', () => {
		const { unmount } = render(NodeDetailPanel, { node: nodes[0] });
		expect(screen.getByText(/Critical Path/i)).toBeInTheDocument();
		unmount();

		render(NodeDetailPanel, { node: nodes[1] });
		expect(screen.getByText(/Standard/i)).toBeInTheDocument();
	});

	it('derives Requires from incoming deps (hard/soft only shown with their type label)', () => {
		// ein2 requires ein (hard)
		render(NodeDetailPanel, { node: nodes[1] });
		expect(screen.getByText(/Requires/i)).toBeInTheDocument();
		expect(screen.getByText('Federal EIN')).toBeInTheDocument();
	});

	it('derives Unblocks from outgoing deps', () => {
		// ein unblocks ein2
		render(NodeDetailPanel, { node: nodes[0] });
		expect(screen.getByText(/Unblocks/i)).toBeInTheDocument();
		expect(screen.getByText('State Registration')).toBeInTheDocument();
	});

	it('marks an entry-point node "Start here — no prerequisites"', () => {
		render(NodeDetailPanel, {
			node: nodes[0],
			stepIndex: 0,
			totalSteps: 3
		});
		expect(screen.getByText(/Start here/i)).toBeInTheDocument();
	});

	it('marks the last step "Final step in journey"', () => {
		render(NodeDetailPanel, {
			node: nodes[2],
			stepIndex: 2,
			totalSteps: 3
		});
		expect(screen.getByText(/Final step in journey/i)).toBeInTheDocument();
	});
});
