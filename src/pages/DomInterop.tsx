import { Blocks, FileText, Focus, type LucideIcon, Radar } from "lucide-react";
import {
	type ComponentPropsWithoutRef,
	createElement,
	type Ref,
	useCallback,
	useRef,
	useState,
} from "react";
import { FeatureIntro } from "@/components/feature-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Temporal } from "@/lib/temporal";

type HeadMode = "launch" | "audit";
type SignalTone = "positive" | "watch" | "risk";
type OpsSignalPayload = {
	region: string;
	owner: string;
	trend: "up" | "steady" | "down";
};
type RefEvent = {
	id: string;
	label: string;
};

const headModes = {
	launch: {
		label: "Launch briefing",
		title: "Launch briefing | React 19 platform lab",
		description:
			"Head tags are rendered directly from the page component for the launch brief.",
	},
	audit: {
		label: "Interop audit",
		title: "Interop audit | React 19 platform lab",
		description:
			"Head metadata switches with the UI state without a separate title manager.",
	},
} as const satisfies Record<
	HeadMode,
	{ label: string; title: string; description: string }
>;

const toneLabels = {
	positive: "Healthy expansion motion",
	watch: "Watchlist account",
	risk: "Needs exec review",
} as const satisfies Record<SignalTone, string>;

const platformNotes = [
	{
		title: "Stylesheets",
		detail:
			"React 19 lets components render stylesheet links with precedence so reveal order stays predictable.",
		code: '<link rel="stylesheet" href="/ops.css" precedence="high" />',
	},
	{
		title: "Async scripts",
		detail:
			"Async scripts can be rendered where they are needed and React will deduplicate identical ones.",
		code: '<script async src="https://example.com/widget.js" />',
	},
	{
		title: "Preload APIs",
		detail:
			"react-dom now exposes preload, preinit, preconnect, and prefetchDNS for resource scheduling.",
		code: 'preload("https://cdn.example.com/font.woff2", { as: "font" })',
	},
	{
		title: "Hydration diagnostics",
		detail:
			"Hydration mismatch errors are grouped into a single diff-style message instead of repeated warnings.",
		code: "createRoot(container, { onCaughtError, onUncaughtError })",
	},
] as const;

const cardIcons: Record<
	"head" | "ref" | "cleanup" | "interop",
	{ icon: LucideIcon; label: string }
> = {
	head: { icon: FileText, label: "Head tags from component state" },
	ref: { icon: Focus, label: "ref as a prop" },
	cleanup: { icon: Radar, label: "Ref cleanup callbacks" },
	interop: { icon: Blocks, label: "Custom element interop" },
};

class OpsSignalElement extends HTMLElement {
	private labelValue = "Pipeline";
	private scoreValue = 82;
	private toneValue: SignalTone = "positive";
	private payloadValue: OpsSignalPayload = {
		region: "North America",
		owner: "R. Vega",
		trend: "up",
	};

	set label(value: string) {
		this.labelValue = value;
		this.render();
	}

	get label() {
		return this.labelValue;
	}

	set score(value: number) {
		this.scoreValue = Number(value);
		this.render();
	}

	get score() {
		return this.scoreValue;
	}

	set tone(value: SignalTone) {
		this.toneValue = value;
		this.render();
	}

	get tone() {
		return this.toneValue;
	}

	set payload(value: OpsSignalPayload) {
		this.payloadValue = value;
		this.render();
	}

	get payload() {
		return this.payloadValue;
	}

	connectedCallback() {
		this.render();
	}

	private render() {
		const toneColor =
			this.toneValue === "positive"
				? "#047857"
				: this.toneValue === "watch"
					? "#b45309"
					: "#b91c1c";
		const toneSurface =
			this.toneValue === "positive"
				? "rgba(4, 120, 87, 0.12)"
				: this.toneValue === "watch"
					? "rgba(180, 83, 9, 0.12)"
					: "rgba(185, 28, 28, 0.12)";

		this.innerHTML = `
      <div style="display:grid;gap:8px;padding:14px 16px;border-radius:20px;border:1px solid var(--border);background:color-mix(in srgb, var(--card) 88%, ${toneSurface});font-family:var(--font-sans, ui-sans-serif, system-ui, sans-serif);box-shadow:0 10px 30px rgba(15, 23, 42, 0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted-foreground);">Custom element</div>
            <div style="font-weight:700;color:var(--foreground);">${this.labelValue}</div>
          </div>
          <div style="display:inline-flex;align-items:center;gap:8px;font-weight:700;color:${toneColor};">
            <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${toneColor};"></span>
            ${this.scoreValue}
          </div>
        </div>
        <div style="font-size:13px;line-height:1.5;color:var(--muted-foreground);">
          ${this.payloadValue.region} / ${this.payloadValue.owner} / trend ${this.payloadValue.trend}
        </div>
      </div>
    `;
	}
}

if (typeof window !== "undefined" && !window.customElements.get("ops-signal")) {
	window.customElements.define("ops-signal", OpsSignalElement);
}

type FocusFieldProps = Omit<ComponentPropsWithoutRef<"input">, "ref"> & {
	id: string;
	label: string;
	ref?: Ref<HTMLInputElement>;
};

function FocusField({ id, label, ref, ...props }: FocusFieldProps) {
	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Input id={id} ref={ref} {...props} />
		</div>
	);
}

function OpsSignal(props: {
	label: string;
	score: number;
	tone: SignalTone;
	payload: OpsSignalPayload;
}) {
	return createElement("ops-signal", props);
}

function SectionTitle({ section }: { section: keyof typeof cardIcons }) {
	const { icon: Icon, label } = cardIcons[section];

	return (
		<CardTitle className="flex items-center gap-3">
			<span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<Icon className="size-5" />
			</span>
			{label}
		</CardTitle>
	);
}

export function DomInteropPage() {
	const focusRef = useRef<HTMLInputElement>(null);
	const [headMode, setHeadMode] = useState<HeadMode>("launch");
	const [showTrackedTarget, setShowTrackedTarget] = useState(true);
	const [refEvents, setRefEvents] = useState<RefEvent[]>([]);
	const [signalTone, setSignalTone] = useState<SignalTone>("positive");
	const [signalScore, setSignalScore] = useState(82);

	const head = headModes[headMode];

	const trackRefLifecycle = useCallback((node: HTMLDivElement | null) => {
		if (!node) {
			return;
		}

		setRefEvents((current) =>
			[createRefEvent(`attached at ${formatClock()}`), ...current].slice(0, 6),
		);

		return () => {
			setRefEvents((current) =>
				[createRefEvent(`cleanup at ${formatClock()}`), ...current].slice(0, 6),
			);
		};
	}, []);

	const payload: OpsSignalPayload = {
		region:
			signalTone === "positive"
				? "North America"
				: signalTone === "watch"
					? "EMEA"
					: "APAC",
		owner:
			signalTone === "positive"
				? "R. Vega"
				: signalTone === "watch"
					? "M. Chen"
					: "T. Lewis",
		trend:
			signalTone === "positive"
				? "up"
				: signalTone === "watch"
					? "steady"
					: "down",
	};

	return (
		<div className="space-y-6">
			<title>{head.title}</title>
			<meta name="description" content={head.description} />

			<FeatureIntro
				eyebrow="React 19"
				title="DOM and Interoperability"
				summary="The React 19 release was not only about hooks. It also tightened how components interact with the document head, refs, and custom elements so common platform work can stay in plain React."
				points={[
					{
						title: "Head tags live in the tree",
						detail:
							"title, meta, link, style, and script can be rendered from components and React will place them where the browser expects them.",
					},
					{
						title: "Refs are simpler",
						detail:
							"Function components can receive ref as a normal prop, and ref callbacks can now return cleanup functions.",
					},
					{
						title: "Web component support improved",
						detail:
							"React 19 assigns matching custom-element properties on the client instead of forcing everything through attributes.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "<title> docs",
						href: "https://react.dev/reference/react-dom/components/title",
					},
					{
						label: "<link> docs",
						href: "https://react.dev/reference/react-dom/components/link",
					},
				]}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-border/60">
					<CardHeader>
						<SectionTitle section="head" />
						<CardDescription>
							This page is rendering its own <code>&lt;title&gt;</code> and{" "}
							<code>&lt;meta&gt;</code> tags right now. Change the mode and the
							tab title will change with it.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{(["launch", "audit"] as const).map((mode) => (
								<Button
									key={mode}
									type="button"
									variant={headMode === mode ? "default" : "outline"}
									onClick={() => setHeadMode(mode)}
								>
									{headModes[mode].label}
								</Button>
							))}
						</div>

						<div className="rounded-2xl border border-border/60 bg-muted/45 p-4">
							<p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
								Active head state
							</p>
							<p className="text-foreground mt-3 font-medium">{head.title}</p>
							<p className="text-muted-foreground mt-2 text-sm leading-6">
								{head.description}
							</p>
						</div>

						<pre className="overflow-x-auto rounded-2xl border border-border/70 bg-foreground p-4 text-xs leading-6 text-background shadow-inner">
							{`<title>{head.title}</title>
<meta name="description" content={head.description} />`}
						</pre>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<SectionTitle section="ref" />
						<CardDescription>
							The input below is wrapped in a function component that accepts{" "}
							<code>ref</code> directly. There is no <code>forwardRef</code>{" "}
							layer in between.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FocusField
							id="escalation-owner"
							ref={focusRef}
							label="Escalation owner"
							defaultValue="Ari Stone"
							placeholder="Assign an owner"
						/>

						<div className="flex flex-wrap items-center gap-3">
							<Button type="button" onClick={() => focusRef.current?.focus()}>
								Focus field
							</Button>
							<Badge variant="outline">No forwardRef wrapper</Badge>
						</div>

						<pre className="overflow-x-auto rounded-2xl border border-border/70 bg-foreground p-4 text-xs leading-6 text-background shadow-inner">
							{`function FocusField({ ref, ...props }) {
  return <input ref={ref} {...props} />
}`}
						</pre>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<SectionTitle section="cleanup" />
						<CardDescription>
							React 19 lets a ref callback return cleanup logic. Toggle the
							target to see attach and cleanup events logged.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowTrackedTarget((current) => !current)}
						>
							{showTrackedTarget ? "Unmount target" : "Mount target"}
						</Button>

						{showTrackedTarget ? (
							<div
								ref={trackRefLifecycle}
								className="text-muted-foreground rounded-2xl border border-dashed border-border/80 bg-muted/45 p-4 text-sm"
							>
								Tracked node mounted. Unmount it to trigger the cleanup return
								value from the ref callback.
							</div>
						) : (
							<div className="text-muted-foreground rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
								Target removed from the tree.
							</div>
						)}

						<div className="space-y-2">
							<p className="text-foreground text-sm font-medium">
								Lifecycle log
							</p>
							<div className="space-y-2">
								{refEvents.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										Mount the tracked target to record events.
									</p>
								) : (
									refEvents.map((event) => (
										<div
											key={event.id}
											className="text-muted-foreground rounded-xl border border-border/60 bg-muted/35 px-3 py-2 text-sm"
										>
											{event.label}
										</div>
									))
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<SectionTitle section="interop" />
						<CardDescription>
							The element below receives string, number, and object data as
							properties. In React 19, matching custom-element properties are
							assigned correctly on the client.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{(["positive", "watch", "risk"] as const).map((tone) => (
								<Button
									key={tone}
									type="button"
									variant={signalTone === tone ? "default" : "outline"}
									onClick={() => {
										setSignalTone(tone);
										setSignalScore(
											tone === "positive" ? 82 : tone === "watch" ? 61 : 39,
										);
									}}
								>
									{toneLabels[tone]}
								</Button>
							))}
						</div>

						<OpsSignal
							label="Pipeline health"
							score={signalScore}
							tone={signalTone}
							payload={payload}
						/>

						<div className="text-muted-foreground rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
							<p className="text-foreground font-medium">
								Other platform items
							</p>
							<div className="mt-3 space-y-3">
								{platformNotes.map((note) => (
									<div
										key={note.title}
										className="rounded-xl border border-border/60 bg-muted/40 p-3"
									>
										<p className="text-foreground font-medium">{note.title}</p>
										<p className="mt-1 leading-6">{note.detail}</p>
										<pre className="mt-3 overflow-x-auto rounded-xl bg-foreground p-3 text-xs leading-6 text-background shadow-inner">
											{note.code}
										</pre>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function formatClock() {
	return Temporal.Now.zonedDateTimeISO().toLocaleString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

function createRefEvent(label: string): RefEvent {
	return {
		id: Temporal.Now.instant().toString(),
		label,
	};
}
