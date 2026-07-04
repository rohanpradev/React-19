export const platformSignalStatuses = ["ready", "watch", "risk"] as const;

export type PlatformSignalStatus = (typeof platformSignalStatuses)[number];

export type PlatformSignal = {
	id: string;
	title: string;
	owner: string;
	detail: string;
	status: PlatformSignalStatus;
	confidence: number;
	updatedAt: number;
};

export type PlatformSignalSummary = {
	total: number;
	ready: number;
	watch: number;
	risk: number;
	averageConfidence: number;
};

export type PlatformSignalsResponse = {
	signals: PlatformSignal[];
	summary: PlatformSignalSummary;
};

export type UpdatePlatformSignalRequest = {
	id: string;
	status: PlatformSignalStatus;
};

export function isPlatformSignalStatus(value: string): value is PlatformSignalStatus {
	return platformSignalStatuses.includes(value as PlatformSignalStatus);
}

export function summarizePlatformSignals(signals: PlatformSignal[]): PlatformSignalSummary {
	const summary: PlatformSignalSummary = {
		total: signals.length,
		ready: 0,
		watch: 0,
		risk: 0,
		averageConfidence: 0,
	};
	let totalConfidence = 0;

	for (const signal of signals) {
		summary[signal.status] += 1;
		totalConfidence += signal.confidence;
	}

	return {
		...summary,
		averageConfidence: signals.length === 0 ? 0 : Math.round(totalConfidence / signals.length),
	};
}

export function createPlatformSignalsResponse(signals: PlatformSignal[]): PlatformSignalsResponse {
	return {
		signals,
		summary: summarizePlatformSignals(signals),
	};
}
