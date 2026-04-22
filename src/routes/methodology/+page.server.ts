import journeysRaw from '../../../static/data/journeys.json?raw';
import type { PageServerLoad } from './$types';
import type { JourneyData, Gotcha } from '$lib/types';

export const prerender = true;

interface SampleGotcha {
	journey: string;
	nodeName: string;
	note: string;
	severity: Gotcha['severity'];
	source: Gotcha['source'];
}

export const load: PageServerLoad = () => {
	const data = JSON.parse(journeysRaw) as JourneyData;

	const edges = data.journeys.flatMap((j) => j.dependencies ?? []);
	const gotchas = data.journeys.flatMap((j) => j.gotchas ?? []);
	const refs = data.journeys.flatMap((j) => j.references ?? []);

	const countEdges = (t: 'hard' | 'soft' | 'parallel') =>
		edges.filter((e) => e.type === t).length;
	const countSeverity = (s: 'major' | 'minor') =>
		gotchas.filter((g) => g.severity === s).length;

	const urls: string[] = [];
	for (const n of data.plcNodes) if (n.source?.url) urls.push(n.source.url);
	for (const g of gotchas) if (g.source?.url) urls.push(g.source.url);
	for (const r of refs) if (r.url) urls.push(r.url);

	const domainCounts = new Map<string, number>();
	for (const url of urls) {
		try {
			const host = new URL(url).hostname.replace(/^www\./, '');
			domainCounts.set(host, (domainCounts.get(host) ?? 0) + 1);
		} catch {
			/* skip malformed */
		}
	}
	const topDomains = [...domainCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 15)
		.map(([host, count]) => ({ host, count }));

	// 3 major-severity gotchas from distinct categories for narrative variety.
	const seenCat = new Set<string>();
	const sampleGotchas: SampleGotcha[] = [];
	for (const j of data.journeys) {
		if (sampleGotchas.length >= 3) break;
		if (seenCat.has(j.cat)) continue;
		const g = (j.gotchas ?? []).find((x) => x.severity === 'major');
		if (!g) continue;
		const node = data.plcNodes.find((n) => n.id === g.step);
		seenCat.add(j.cat);
		sampleGotchas.push({
			journey: j.name,
			nodeName: node?.name ?? g.step,
			note: g.note,
			severity: g.severity,
			source: g.source
		});
	}

	return {
		stats: {
			journeys: data.journeys.length,
			nodes: data.plcNodes.length,
			edges: {
				total: edges.length,
				hard: countEdges('hard'),
				soft: countEdges('soft'),
				parallel: countEdges('parallel')
			},
			gotchas: {
				total: gotchas.length,
				major: countSeverity('major'),
				minor: countSeverity('minor')
			},
			references: refs.length
		},
		topDomains,
		sampleGotchas
	};
};
