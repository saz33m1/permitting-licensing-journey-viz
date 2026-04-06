export interface Jurisdiction {
	id: string;
	name: string;
}

export interface Category {
	id: string;
	name: string;
}

export type Phase = 'preparation' | 'application' | 'inspection' | 'active';

export interface PlcNode {
	id: string;
	name: string;
	jurisdiction: string;
	phase: Phase;
	estTime?: string | null;
	blocking?: boolean;
}

export interface Journey {
	id: string;
	name: string;
	cat: string;
	steps: string[];
}

export interface JourneyData {
	jurisdictions: Jurisdiction[];
	categories: Category[];
	plcNodes: PlcNode[];
	journeys: Journey[];
}
