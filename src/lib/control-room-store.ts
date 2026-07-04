export type IncidentSeverity = "sev1" | "sev2" | "sev3";
export type IncidentStatus = "open" | "investigating" | "mitigated";
export type RolloutStage = "canary" | "regional" | "global" | "paused";
export type CommandTone = "success" | "warning" | "danger" | "info";

export type Incident = {
	id: string;
	title: string;
	service: string;
	owner: string;
	severity: IncidentSeverity;
	status: IncidentStatus;
	impact: string;
	startedAt: number;
};

export type DeploymentState = {
	version: string;
	stage: RolloutStage;
	rolloutPercent: number;
	errorBudgetRemaining: number;
};

export type TelemetryState = {
	latencyMs: number;
	queuedJobs: number;
	saturation: number;
	lastUpdatedAt: number;
};

export type CommandLogEntry = {
	id: string;
	label: string;
	tone: CommandTone;
	at: number;
};

export type ControlRoomSummary = {
	openIncidents: number;
	mitigatedIncidents: number;
	highestSeverity: IncidentSeverity;
	riskScore: number;
};

export type ControlRoomState = {
	version: number;
	activeIncidentId: string;
	incidents: readonly Incident[];
	deployment: DeploymentState;
	telemetry: TelemetryState;
	summary: ControlRoomSummary;
	commandLog: readonly CommandLogEntry[];
	lastBoundaryError: string | null;
};

type Listener = () => void;
type ControlRoomPatch = Partial<
	Pick<
		ControlRoomState,
		"activeIncidentId" | "incidents" | "deployment" | "telemetry" | "lastBoundaryError"
	>
>;

const initialIncidents: Incident[] = [
	{
		id: "checkout-latency",
		title: "Checkout latency above SLO",
		service: "Revenue API",
		owner: "Payments Platform",
		severity: "sev2",
		status: "investigating",
		impact: "Enterprise renewals are delayed during contract confirmation.",
		startedAt: Date.now() - 1000 * 60 * 47,
	},
	{
		id: "search-index-lag",
		title: "Customer search index lag",
		service: "Search Pipeline",
		owner: "Data Experience",
		severity: "sev3",
		status: "open",
		impact: "Account teams see stale activity signals for high-value customers.",
		startedAt: Date.now() - 1000 * 60 * 92,
	},
	{
		id: "auth-cookie-cache",
		title: "Session cache freshness review",
		service: "Identity",
		owner: "Runtime Platform",
		severity: "sev3",
		status: "mitigated",
		impact: "Sensitive account changes require stricter freshness windows.",
		startedAt: Date.now() - 1000 * 60 * 180,
	},
];

const initialDeployment: DeploymentState = {
	version: "2026.07.04-control-plane",
	stage: "regional",
	rolloutPercent: 35,
	errorBudgetRemaining: 78,
};

const initialTelemetry: TelemetryState = {
	latencyMs: 184,
	queuedJobs: 18,
	saturation: 62,
	lastUpdatedAt: Date.now(),
};

const initialCommandLog: CommandLogEntry[] = [
	{
		id: "boot",
		label: "Control room store initialized",
		tone: "info",
		at: Date.now() - 1000 * 60 * 8,
	},
];

export function createInitialControlRoomState(): ControlRoomState {
	return createStateSnapshot({
		version: 1,
		activeIncidentId: initialIncidents[0]?.id ?? "",
		incidents: initialIncidents,
		deployment: initialDeployment,
		telemetry: initialTelemetry,
		commandLog: initialCommandLog,
		lastBoundaryError: null,
	});
}

export class ControlRoomStore {
	private state = createInitialControlRoomState();
	private readonly listeners = new Set<Listener>();

	subscribe = (listener: Listener) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	getSnapshot = () => this.state;

	selectIncident(id: string) {
		this.commit({ activeIncidentId: id }, `Selected incident ${id}`, "info");
	}

	setIncidentStatus(id: string, status: IncidentStatus) {
		this.commit(
			{
				incidents: this.state.incidents.map((incident) =>
					incident.id === id ? { ...incident, status } : incident,
				),
			},
			`Set ${id} to ${status}`,
			status === "mitigated" ? "success" : "warning",
		);
	}

	promoteRollout() {
		const nextPercent = Math.min(this.state.deployment.rolloutPercent + 15, 100);
		const nextStage: RolloutStage =
			nextPercent >= 100 ? "global" : nextPercent >= 50 ? "regional" : "canary";

		this.commit(
			{
				deployment: {
					...this.state.deployment,
					stage: nextStage,
					rolloutPercent: nextPercent,
					errorBudgetRemaining: Math.max(this.state.deployment.errorBudgetRemaining - 4, 0),
				},
			},
			`Promoted rollout to ${nextPercent}%`,
			"success",
		);
	}

	pauseRollout() {
		this.commit(
			{
				deployment: {
					...this.state.deployment,
					stage: "paused",
				},
			},
			"Paused rollout while incidents are investigated",
			"warning",
		);
	}

	simulateTelemetrySpike() {
		this.commit(
			{
				telemetry: {
					latencyMs: Math.min(this.state.telemetry.latencyMs + 46, 900),
					queuedJobs: this.state.telemetry.queuedJobs + 12,
					saturation: Math.min(this.state.telemetry.saturation + 9, 100),
					lastUpdatedAt: Date.now(),
				},
			},
			"Injected telemetry spike for recovery testing",
			"danger",
		);
	}

	recoverTelemetry() {
		this.commit(
			{
				telemetry: {
					latencyMs: Math.max(this.state.telemetry.latencyMs - 58, 120),
					queuedJobs: Math.max(this.state.telemetry.queuedJobs - 14, 0),
					saturation: Math.max(this.state.telemetry.saturation - 11, 35),
					lastUpdatedAt: Date.now(),
				},
			},
			"Recovered telemetry toward the operating baseline",
			"success",
		);
	}

	reportBoundaryError(message: string) {
		this.commit({ lastBoundaryError: message }, `Captured render failure: ${message}`, "danger");
	}

	clearBoundaryError() {
		this.commit({ lastBoundaryError: null }, "Cleared render boundary state", "success");
	}

	reset() {
		this.state = createInitialControlRoomState();
		this.emit();
	}

	private commit(patch: ControlRoomPatch, label: string, tone: CommandTone) {
		this.state = createStateSnapshot({
			...this.state,
			...patch,
			version: this.state.version + 1,
			commandLog: [
				{
					id: `${Date.now()}-${this.state.version}`,
					label,
					tone,
					at: Date.now(),
				},
				...this.state.commandLog,
			].slice(0, 8),
		});
		this.emit();
	}

	private emit() {
		for (const listener of this.listeners) {
			listener();
		}
	}
}

function createStateSnapshot(state: Omit<ControlRoomState, "summary">): ControlRoomState {
	const summary = summarizeControlRoom(state.incidents, state.deployment, state.telemetry);

	// React expects external-store snapshots to be immutable and referentially stable until
	// a real store mutation happens. Every command creates a fresh frozen snapshot.
	return Object.freeze({
		...state,
		incidents: Object.freeze([...state.incidents]),
		commandLog: Object.freeze([...state.commandLog]),
		summary: Object.freeze(summary),
	});
}

function summarizeControlRoom(
	incidents: readonly Incident[],
	deployment: DeploymentState,
	telemetry: TelemetryState,
): ControlRoomSummary {
	const openIncidents = incidents.filter((incident) => incident.status !== "mitigated").length;
	const mitigatedIncidents = incidents.length - openIncidents;
	const highestSeverity = incidents.some(
		(incident) => incident.status !== "mitigated" && incident.severity === "sev1",
	)
		? "sev1"
		: incidents.some((incident) => incident.status !== "mitigated" && incident.severity === "sev2")
			? "sev2"
			: "sev3";
	const severityPenalty = highestSeverity === "sev1" ? 35 : highestSeverity === "sev2" ? 20 : 8;
	const telemetryPenalty = Math.round((telemetry.saturation + telemetry.queuedJobs) / 6);
	const rolloutPenalty =
		deployment.stage === "paused" ? 6 : Math.round(deployment.rolloutPercent / 8);
	const budgetCredit = Math.round(deployment.errorBudgetRemaining / 5);

	return {
		openIncidents,
		mitigatedIncidents,
		highestSeverity,
		riskScore: Math.min(
			Math.max(severityPenalty + telemetryPenalty + rolloutPenalty - budgetCredit, 0),
			100,
		),
	};
}
