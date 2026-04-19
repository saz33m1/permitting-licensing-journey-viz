import type { Journey, PlcNode, Category, Jurisdiction } from '$lib/types';

// Jurisdiction colors (editorial palette)
export const JC: Record<string, string> = {
	federal: '#2A4B7C',
	state: '#4A6D5E',
	local: '#8C5A46'
};

export const PHASE_LABELS: Record<string, { label: string; number: string }> = {
	preparation: { label: 'Preparation', number: 'Phase 1' },
	application: { label: 'Application', number: 'Phase 2' },
	inspection: { label: 'Inspection', number: 'Phase 3' },
	active: { label: 'Active', number: 'Phase 4' }
};

export const PHASES = ['preparation', 'application', 'inspection', 'active'] as const;
export const JURISDICTIONS_ORDER = ['federal', 'state', 'local'] as const;

// App state
let _active = $state<string | null>(null);
let _viewMode = $state<'standard' | 'dependency'>('standard');
let _depMode = $state<'ambient' | 'realistic'>('ambient');
let _selectedNode = $state<string | null>(null);

// Filters
let _filterJurisdictions = $state<string[]>([]);
let _filterCategories = $state<string[]>([]);
let _filterSearch = $state('');

// Data
let _jurisdictions = $state<Jurisdiction[]>([]);
let _categories = $state<Category[]>([]);
let _plcNodes = $state<PlcNode[]>([]);
let _journeys = $state<Journey[]>([]);
let _nodeMap = $state<Record<string, PlcNode>>({});
let _catName = $state<Record<string, string>>({});

export const app = {
	get active() { return _active; },
	set active(v) { _active = v; },
	get viewMode() { return _viewMode; },
	set viewMode(v) {
		_viewMode = v;
		if (v === 'standard') _depMode = 'ambient';
	},
	get depMode() { return _depMode; },
	set depMode(v) { _depMode = v; },
	get selectedNode() { return _selectedNode; },
	set selectedNode(v) { _selectedNode = v; },

	get filterJurisdictions() { return _filterJurisdictions; },
	set filterJurisdictions(v) { _filterJurisdictions = v; },
	get filterCategories() { return _filterCategories; },
	set filterCategories(v) { _filterCategories = v; },
	get filterSearch() { return _filterSearch; },
	set filterSearch(v) { _filterSearch = v; },

	get jurisdictions() { return _jurisdictions; },
	get categories() { return _categories; },
	get plcNodes() { return _plcNodes; },
	get journeys() { return _journeys; },
	get nodeMap() { return _nodeMap; },
	get catName() { return _catName; },

	get activeJourney(): Journey | null {
		if (!_active) return null;
		return _journeys.find(j => j.id === _active) ?? null;
	},

	get filteredJourneys(): Journey[] {
		return _journeys.filter(j => {
			if (_filterSearch && !j.name.toLowerCase().includes(_filterSearch.toLowerCase())) {
				return false;
			}
			if (_filterCategories.length > 0 && !_filterCategories.includes(j.cat)) {
				return false;
			}
			if (_filterJurisdictions.length > 0) {
				const hasJur = j.steps.some(s => {
					const node = _nodeMap[s];
					return node && _filterJurisdictions.includes(node.jurisdiction);
				});
				if (!hasJur) return false;
			}
			return true;
		});
	},

	loadData(data: { jurisdictions: Jurisdiction[]; categories: Category[]; plcNodes: PlcNode[]; journeys: Journey[] }) {
		_jurisdictions = data.jurisdictions;
		_categories = data.categories;
		_plcNodes = data.plcNodes;
		_journeys = data.journeys;
		const nm: Record<string, PlcNode> = {};
		data.plcNodes.forEach(n => nm[n.id] = { ...n });
		_nodeMap = nm;
		const cn: Record<string, string> = {};
		data.categories.forEach(c => cn[c.id] = c.name);
		_catName = cn;
	},

	selectJourney(id: string) {
		_active = id;
	},

	goHome() {
		_active = null;
		_selectedNode = null;
	}
};
