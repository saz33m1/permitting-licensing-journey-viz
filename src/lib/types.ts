export interface Jurisdiction {
	id: string;
	name: string;
}

export interface Category {
	id: string;
	name: string;
}

export type Phase = 'preparation' | 'application' | 'inspection' | 'active';

export interface Source {
	title: string;
	url: string;
}

export interface Gotcha {
	step: string;
	note: string;
	severity: 'major' | 'minor';
	source: Source;
}

export interface Reference {
	title: string;
	url: string;
	type: 'regulatory' | 'guide' | 'dataset';
	accessed: string;
}

export interface RuleException {
	from: string;
	to: string;
	reason: string;
}

export interface ReleaseChange {
	title: string;
	body: string;
}

export interface Release {
	version: string;
	date: string;
	title: string;
	lead: string;
	changes: ReleaseChange[];
}

export interface PlcNode {
	id: string;
	name: string;
	jurisdiction: string;
	phase: Phase;
	estTime?: string | null;
	blocking?: boolean;
	agency?: string | null;
	description?: string | null;
	fee?: string | null;
	renewalTerm?: string | null;
	required?: boolean;
	source?: Source;
}

export interface Dependency {
	from: string;
	to: string;
	type: 'hard' | 'soft' | 'parallel';
}

export interface Journey {
	id: string;
	name: string;
	cat: string;
	steps: string[];
	dependencies?: Dependency[];
	gotchas?: Gotcha[];
	references?: Reference[];
	ruleExceptions?: RuleException[];
}

export interface JourneyData {
	jurisdictions: Jurisdiction[];
	categories: Category[];
	plcNodes: PlcNode[];
	journeys: Journey[];
}
