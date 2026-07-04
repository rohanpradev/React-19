import {
	Component,
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

import {
	AlertTriangle,
	CheckCircle2,
	CircleAlert,
	Command,
	type LucideIcon,
	RadioTower,
	RefreshCw,
	ShieldCheck,
	SignalHigh,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type CommandLogEntry,
	type ControlRoomState,
	ControlRoomStore,
	type Incident,
	type IncidentStatus,
} from "@/lib/control-room-store";
import { Temporal } from "@/lib/temporal";
import { cn } from "@/lib/utils";

const ControlRoomContext = createContext<ControlRoomStore | null>(null);

export function ControlRoomPage() {
	return (
		<ControlRoomProvider>
			<ControlRoomDashboard />
		</ControlRoomProvider>
	);
}

function ControlRoomProvider({ children }: { children: ReactNode }) {
	const storeRef = useRef<ControlRoomStore | null>(null);

	if (!storeRef.current) {
		storeRef.current = new ControlRoomStore();
	}

	return <ControlRoomContext value={storeRef.current}>{children}</ControlRoomContext>;
}

function useControlRoomStore() {
	const store = useContext(ControlRoomContext);

	if (!store) {
		throw new Error("ControlRoomProvider is required.");
	}

	return store;
}

function useControlRoomSelector<T>(selector: (state: ControlRoomState) => T) {
	const store = useControlRoomStore();

	// Keep global state outside React, then subscribe through the official external-store API.
	// Selectors should return stable snapshot fields, not new objects created during render.
	return useSyncExternalStore(
		store.subscribe,
		() => selector(store.getSnapshot()),
		() => selector(store.getSnapshot()),
	);
}

function ControlRoomDashboard() {
	const store = useControlRoomStore();
	const incidents = useControlRoomSelector((state) => state.incidents);
	const activeIncidentId = useControlRoomSelector((state) => state.activeIncidentId);
	const deployment = useControlRoomSelector((state) => state.deployment);
	const telemetry = useControlRoomSelector((state) => state.telemetry);
	const summary = useControlRoomSelector((state) => state.summary);
	const commandLog = useControlRoomSelector((state) => state.commandLog);
	const lastBoundaryError = useControlRoomSelector((state) => state.lastBoundaryError);
	const [crashWidget, setCrashWidget] = useState(false);
	const [boundaryResetKey, setBoundaryResetKey] = useState(0);
	const activeIncident = useMemo(
		() => incidents.find((incident) => incident.id === activeIncidentId) ?? incidents[0],
		[activeIncidentId, incidents],
	);

	const resetBoundary = () => {
		setCrashWidget(false);
		setBoundaryResetKey((key) => key + 1);
		store.clearBoundaryError();
	};

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="State architecture"
				title="Control Room State System"
				summary="A lifelike incident-control surface using signal-style external state, context injection, selector subscriptions, command logs, and recoverable render error boundaries."
				points={[
					{
						title: "Signal-style store",
						detail: "A stable store object emits immutable snapshots through useSyncExternalStore.",
					},
					{
						title: "Context as dependency injection",
						detail: "Context provides the store instance; server state still belongs to Query.",
					},
					{
						title: "Error containment",
						detail:
							"A local boundary captures render failure and resets without blanking the route.",
					},
				]}
				links={[
					{
						label: "React useSyncExternalStore",
						href: "https://react.dev/reference/react/useSyncExternalStore",
					},
					{
						label: "React Error Boundary",
						href: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
					},
					{
						label: "Preact Signals",
						href: "https://preactjs.com/guide/v10/signals/",
					},
					{
						label: "React libraries 2026",
						href: "https://www.robinwieruch.de/react-libraries/",
					},
				]}
			/>

			<div className="grid gap-4 md:grid-cols-4">
				<MetricCard label="Open incidents" value={summary.openIncidents} icon={CircleAlert} />
				<MetricCard label="Risk score" value={summary.riskScore} icon={AlertTriangle} />
				<MetricCard
					label="Error budget"
					value={`${deployment.errorBudgetRemaining}%`}
					icon={ShieldCheck}
				/>
				<MetricCard label="Saturation" value={`${telemetry.saturation}%`} icon={SignalHigh} />
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_390px]">
				<Card className="border-border/60">
					<CardHeader className="border-b border-border/60">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<CardTitle>Incident command queue</CardTitle>
								<CardDescription>
									Local operational state belongs in a small external store because it is shared,
									high-frequency, and not server-authoritative.
								</CardDescription>
							</div>
							<Button type="button" variant="outline" onClick={() => store.reset()}>
								<RefreshCw className="size-4" />
								Reset store
							</Button>
						</div>
					</CardHeader>
					<CardContent className="grid gap-3 pt-6">
						{incidents.map((incident) => (
							<IncidentRow
								key={incident.id}
								incident={incident}
								active={incident.id === activeIncident?.id}
								onSelect={() => store.selectIncident(incident.id)}
								onStatusChange={(status) => store.setIncidentStatus(incident.id, status)}
							/>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<RadioTower className="size-5" />
						</div>
						<CardTitle>Active incident</CardTitle>
						<CardDescription>Derived from a selector plus the incident collection.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{activeIncident ? (
							<div className="app-muted-surface p-4">
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={getSeverityVariant(activeIncident.severity)}>
										{activeIncident.severity.toUpperCase()}
									</Badge>
									<Badge variant="outline">{formatLabel(activeIncident.status)}</Badge>
								</div>
								<p className="mt-3 font-semibold leading-6 text-foreground">
									{activeIncident.title}
								</p>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									{activeIncident.impact}
								</p>
								<p className="mt-3 text-xs leading-5 text-muted-foreground">
									{activeIncident.owner} / started {formatTimestamp(activeIncident.startedAt)}
								</p>
							</div>
						) : null}

						<div className="grid gap-2">
							<Button type="button" onClick={() => store.promoteRollout()}>
								Promote rollout
							</Button>
							<Button type="button" variant="outline" onClick={() => store.pauseRollout()}>
								Pause rollout
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => store.simulateTelemetrySpike()}
							>
								Inject telemetry spike
							</Button>
							<Button type="button" variant="outline" onClick={() => store.recoverTelemetry()}>
								Recover telemetry
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
				<Card className="border-border/60">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Render boundary</Badge>
							<Badge variant={lastBoundaryError ? "destructive" : "outline"}>
								{lastBoundaryError ? "Failure captured" : "Healthy"}
							</Badge>
						</div>
						<CardTitle>Recoverable executive widget</CardTitle>
						<CardDescription>
							The rest of the route keeps working when this panel throws during render.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<ControlRoomErrorBoundary
							resetKey={boundaryResetKey}
							onError={(error) => store.reportBoundaryError(error.message)}
							onReset={resetBoundary}
						>
							<ExecutiveMarginWidget shouldCrash={crashWidget} deploymentStage={deployment.stage} />
						</ControlRoomErrorBoundary>

						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="destructive" onClick={() => setCrashWidget(true)}>
								Crash widget
							</Button>
							<Button type="button" variant="outline" onClick={resetBoundary}>
								Reset boundary
							</Button>
						</div>

						{lastBoundaryError ? (
							<Alert variant="destructive">
								<AlertTriangle />
								<div className="space-y-1">
									<AlertTitle>Boundary reported an error</AlertTitle>
									<AlertDescription>{lastBoundaryError}</AlertDescription>
								</div>
							</Alert>
						) : null}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex size-11 items-center justify-center rounded-lg bg-accent/45 text-accent-foreground">
							<Command className="size-5" />
						</div>
						<CardTitle>Command log</CardTitle>
						<CardDescription>Every write goes through a named store command.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{commandLog.map((entry) => (
							<CommandLogRow key={entry.id} entry={entry} />
						))}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				{[
					{
						title: "Why not Context alone?",
						detail:
							"Raw context updates every consumer when its value changes. A stable store in context lets components subscribe to exact snapshot fields.",
					},
					{
						title: "Why not server state?",
						detail:
							"Incident controls are local operational UI state. Durable records can later sync through TanStack Query or Router actions.",
					},
					{
						title: "Why not a global library?",
						detail:
							"This is intentionally small. Zustand or signals are reasonable when state grows beyond one bounded domain.",
					},
				].map((item) => (
					<div key={item.title} className="app-muted-surface p-4">
						<p className="font-semibold text-foreground">{item.title}</p>
						<p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
					</div>
				))}
			</div>
		</div>
	);
}

class ControlRoomErrorBoundary extends Component<
	{
		children: ReactNode;
		resetKey: number;
		onError: (error: Error) => void;
		onReset: () => void;
	},
	{ error: Error | null }
> {
	override state: { error: Error | null } = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	override componentDidCatch(error: Error) {
		this.props.onError(error);
	}

	override componentDidUpdate(previousProps: { resetKey: number }) {
		if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
			this.setState({ error: null });
		}
	}

	override render() {
		if (this.state.error) {
			return (
				<div className="app-muted-surface border-destructive/30 bg-destructive/10 p-5">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
						<div className="space-y-3">
							<div>
								<p className="font-semibold text-foreground">Widget isolated by boundary</p>
								<p className="mt-1 text-sm leading-6 text-muted-foreground">
									{this.state.error.message}
								</p>
							</div>
							<Button type="button" variant="outline" onClick={this.props.onReset}>
								Reset widget
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

function IncidentRow({
	incident,
	active,
	onSelect,
	onStatusChange,
}: {
	incident: Incident;
	active: boolean;
	onSelect: () => void;
	onStatusChange: (status: IncidentStatus) => void;
}) {
	return (
		<div
			className={cn(
				"app-surface grid gap-4 p-4 transition-colors lg:grid-cols-[minmax(0,1fr)_270px] lg:items-center",
				active && "border-primary/45 bg-primary/5",
			)}
		>
			<button type="button" className="min-w-0 text-left" onClick={onSelect}>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={getSeverityVariant(incident.severity)}>
						{incident.severity.toUpperCase()}
					</Badge>
					<Badge variant="outline">{incident.service}</Badge>
					{active ? <Badge variant="secondary">Selected</Badge> : null}
				</div>
				<p className="mt-3 font-semibold leading-6 text-foreground">{incident.title}</p>
				<p className="mt-1 text-sm leading-6 text-muted-foreground">{incident.impact}</p>
			</button>

			<div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
				{(["open", "investigating", "mitigated"] as const).map((status) => (
					<Button
						key={status}
						type="button"
						variant={incident.status === status ? "default" : "outline"}
						size="sm"
						onClick={() => onStatusChange(status)}
					>
						{formatLabel(status)}
					</Button>
				))}
			</div>
		</div>
	);
}

function ExecutiveMarginWidget({
	shouldCrash,
	deploymentStage,
}: {
	shouldCrash: boolean;
	deploymentStage: string;
}) {
	if (shouldCrash) {
		throw new Error("Executive margin widget failed while parsing a malformed forecast row.");
	}

	return (
		<div className="app-surface p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
						Executive margin forecast
					</p>
					<p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">+18.4%</p>
				</div>
				<Badge variant="secondary">{formatLabel(deploymentStage)}</Badge>
			</div>
			<div className="mt-5 grid gap-3">
				<ForecastBar label="Renewal protection" value={86} />
				<ForecastBar label="Expansion confidence" value={71} />
				<ForecastBar label="Support load" value={42} inverse />
			</div>
		</div>
	);
}

function ForecastBar({
	label,
	value,
	inverse = false,
}: {
	label: string;
	value: number;
	inverse?: boolean;
}) {
	return (
		<div>
			<div className="flex items-center justify-between gap-3 text-sm">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-medium text-foreground">{value}%</span>
			</div>
			<div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full", inverse ? "bg-warning" : "bg-primary")}
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}

function MetricCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: number | string;
	icon: LucideIcon;
}) {
	return (
		<Card className="border-border/60">
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm font-medium text-muted-foreground">{label}</p>
					<Icon className="size-5 text-primary" />
				</div>
				<p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
			</CardContent>
		</Card>
	);
}

function CommandLogRow({ entry }: { entry: CommandLogEntry }) {
	const toneClassName = {
		success: "text-success",
		warning: "text-warning",
		danger: "text-destructive",
		info: "text-primary",
	}[entry.tone];

	return (
		<div className="app-muted-surface flex items-start gap-3 p-3">
			<CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", toneClassName)} />
			<div className="min-w-0">
				<p className="text-sm leading-6 text-foreground">{entry.label}</p>
				<p className="text-xs leading-5 text-muted-foreground">{formatTimestamp(entry.at)}</p>
			</div>
		</div>
	);
}

function getSeverityVariant(severity: string) {
	return severity === "sev1" ? "destructive" : severity === "sev2" ? "secondary" : "outline";
}

function formatLabel(value: string) {
	return value
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function formatTimestamp(timestamp: number) {
	return Temporal.Instant.fromEpochMilliseconds(timestamp)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
}
