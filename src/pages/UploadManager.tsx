import {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useEffectEvent,
	useMemo,
	useOptimistic,
	useRef,
	useState,
	useTransition,
} from "react";

import {
	CheckCircle2,
	CircleAlert,
	CloudUpload,
	FileStack,
	Files,
	type LucideIcon,
	RefreshCw,
	ShieldCheck,
	Trash2,
	Upload,
	X,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UploadStatus = "queued" | "uploading" | "complete" | "error" | "canceled" | "invalid";

type UploadItem = {
	id: string;
	name: string;
	type: string;
	size: number;
	status: UploadStatus;
	progress: number;
	addedAt: number;
	attempts: number;
	checksum: number;
	issue?: string;
};

type UploadSetter = Dispatch<SetStateAction<UploadItem[]>>;

const maxFileSize = 8 * 1024 * 1024;
const acceptedTypes = [
	"application/pdf",
	"application/json",
	"image/png",
	"image/jpeg",
	"text/csv",
	"text/plain",
] as const;

const acceptedExtensions = [".pdf", ".json", ".png", ".jpg", ".jpeg", ".csv", ".txt"] as const;

export function UploadManagerPage() {
	const [files, setFiles] = useState<UploadItem[]>([]);
	const [dragActive, setDragActive] = useState(false);
	const [lastIssue, setLastIssue] = useState<string | null>(null);
	const [isAdding, startAddTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);
	const [optimisticFiles, addOptimisticFiles] = useOptimistic(
		files,
		(currentFiles, incomingFiles: UploadItem[]) => mergeUploadItems(incomingFiles, currentFiles),
	);
	const summary = useMemo(() => summarizeUploads(optimisticFiles), [optimisticFiles]);
	const hasUploading = files.some((file) => file.status === "uploading");
	const canStart = files.some((file) => file.status === "queued");

	const advanceUploads = useEffectEvent(() => {
		setFiles((currentFiles) =>
			currentFiles.map((file) => {
				if (file.status !== "uploading") {
					return file;
				}

				if (file.progress >= 68 && file.attempts === 0 && file.checksum % 17 === 0) {
					return {
						...file,
						status: "error",
						issue: "Network validation failed. Retry upload.",
					};
				}

				const nextProgress = Math.min(100, file.progress + 8 + (file.checksum % 7));

				if (nextProgress >= 100) {
					return {
						...file,
						progress: 100,
						status: "complete",
						issue: undefined,
					};
				}

				return {
					...file,
					progress: nextProgress,
				};
			}),
		);
	});

	useEffect(() => {
		if (!hasUploading) {
			return;
		}

		const intervalId = window.setInterval(() => advanceUploads(), 420);
		return () => window.clearInterval(intervalId);
	}, [hasUploading]);

	const addFiles = (incomingFiles: File[]) => {
		const nextFiles = createUploadItems(incomingFiles, optimisticFiles);

		if (nextFiles.length === 0) {
			setLastIssue("No files were available to add.");
			return;
		}

		const invalidCount = nextFiles.filter((file) => file.status === "invalid").length;
		setLastIssue(
			invalidCount > 0
				? `${invalidCount} file${invalidCount === 1 ? "" : "s"} failed validation.`
				: null,
		);

		startAddTransition(async () => {
			addOptimisticFiles(nextFiles);
			await wait(220);
			setFiles((currentFiles) => mergeUploadItems(nextFiles, currentFiles));
		});
	};

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Enterprise UI pattern"
				title="Upload Queue Manager"
				summary="A reusable upload workflow with drag/drop, validation, optimistic queue staging, progress, retry, cancel, and cleanup-safe background work."
				points={[
					{
						title: "Optimistic queue",
						detail: "Files appear immediately while React commits the authoritative queue state.",
					},
					{
						title: "Effect Events",
						detail:
							"The progress ticker reads current queue state without recreating interval logic.",
					},
					{
						title: "Validation first",
						detail: "Type, size, duplicate, retry, and cancel branches are all visible in the UI.",
					},
				]}
				links={[
					{
						label: "useOptimistic",
						href: "https://react.dev/reference/react/useOptimistic",
					},
					{
						label: "useEffectEvent",
						href: "https://react.dev/reference/react/useEffectEvent",
					},
					{
						label: "MDN File API",
						href: "https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications",
					},
					{
						label: "Uppy React",
						href: "https://uppy.io/docs/react/",
					},
				]}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Queued files"
					value={formatNumber(summary.total)}
					detail={`${formatNumber(summary.valid)} valid / ${formatNumber(summary.invalid)} invalid`}
					icon={Files}
				/>
				<MetricCard
					label="Total payload"
					value={formatBytes(summary.bytes)}
					detail="Accepted and rejected files combined"
					icon={FileStack}
				/>
				<MetricCard
					label="Completed"
					value={formatNumber(summary.complete)}
					detail="Successful uploads in this session"
					icon={CheckCircle2}
				/>
				<MetricCard
					label="Average progress"
					value={`${summary.averageProgress}%`}
					detail={hasUploading ? "Upload ticker active" : "No active uploads"}
					icon={Upload}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_390px]">
				<Card className="border-border/60">
					<CardHeader className="gap-4 border-b border-border/60">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<CardTitle>Upload intake</CardTitle>
								<CardDescription>
									Drop files, validate them locally, then start the queue. This models a real
									enterprise uploader before adding storage-specific server signing.
								</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge variant={isAdding ? "secondary" : "outline"}>
									{isAdding ? "Optimistic staging" : "Queue settled"}
								</Badge>
								<Badge variant="outline">Max {formatBytes(maxFileSize)} each</Badge>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-5 pt-6">
						<section
							aria-label="File upload drop zone"
							className={cn(
								"grid min-h-64 place-items-center rounded-lg border border-dashed border-border/80 bg-muted/35 p-6 text-center transition-colors",
								dragActive && "border-primary bg-primary/8",
							)}
							onDragEnter={(event) => {
								event.preventDefault();
								setDragActive(true);
							}}
							onDragOver={(event) => {
								event.preventDefault();
								setDragActive(true);
							}}
							onDragLeave={(event) => {
								event.preventDefault();
								if (event.currentTarget === event.target) {
									setDragActive(false);
								}
							}}
							onDrop={(event) => {
								event.preventDefault();
								setDragActive(false);
								addFiles(Array.from(event.dataTransfer.files));
							}}
						>
							<div className="max-w-xl space-y-4">
								<span className="mx-auto flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<CloudUpload className="size-7" />
								</span>
								<div>
									<p className="font-display text-2xl text-foreground">Drop files to stage them</p>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">
										Accepted: PDF, JSON, PNG, JPG, CSV, and TXT. Duplicate filename and size pairs
										are rejected.
									</p>
								</div>
								<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
									<Button type="button" onClick={() => inputRef.current?.click()}>
										<CloudUpload className="size-4" />
										Choose files
									</Button>
									<Button
										type="button"
										variant="outline"
										disabled={!canStart}
										onClick={() => startQueuedUploads(setFiles)}
									>
										<Upload className="size-4" />
										Start queued
									</Button>
								</div>
								<input
									ref={inputRef}
									type="file"
									multiple
									accept={acceptedExtensions.join(",")}
									className="hidden"
									onChange={(event) => {
										addFiles(Array.from(event.currentTarget.files ?? []));
										event.currentTarget.value = "";
									}}
								/>
							</div>
						</section>

						{lastIssue ? (
							<Alert variant="destructive">
								<CircleAlert />
								<div>
									<AlertTitle>Some files need attention</AlertTitle>
									<AlertDescription>{lastIssue}</AlertDescription>
								</div>
							</Alert>
						) : null}

						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={!hasUploading}
								onClick={() => cancelUploads(setFiles)}
							>
								<X className="size-4" />
								Cancel active
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={optimisticFiles.length === 0}
								onClick={() => {
									setFiles([]);
									setLastIssue(null);
								}}
							>
								<Trash2 className="size-4" />
								Clear queue
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<ShieldCheck className="size-5" />
						</div>
						<CardTitle>Enterprise upload rules</CardTitle>
						<CardDescription>What this component is meant to teach.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{[
							"Validate type and size before the file enters the real transfer path.",
							"Keep optimistic UI separate from committed queue state.",
							"Expose retry, cancel, failed, invalid, and completed states.",
							"Use server-signed upload params before moving from demo to production storage.",
							"Clean up interval and drag state so navigation does not leave work running.",
						].map((item) => (
							<div key={item} className="app-muted-surface flex items-start gap-3 p-4">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
								<p className="text-sm leading-6 text-muted-foreground">{item}</p>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Queue state machine</Badge>
						<Badge variant="outline">Queued / uploading / complete / retry / cancel</Badge>
					</div>
					<CardTitle>Staged files</CardTitle>
					<CardDescription>
						Rows keep stable dimensions so progress changes do not shift the layout.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3">
					{optimisticFiles.length > 0 ? (
						optimisticFiles.map((file) => (
							<UploadRow
								key={file.id}
								file={file}
								onRetry={() => retryUpload(file.id, setFiles)}
								onCancel={() => cancelUpload(file.id, setFiles)}
								onRemove={() => removeUpload(file.id, setFiles)}
							/>
						))
					) : (
						<div className="app-muted-surface p-6 text-center text-sm text-muted-foreground">
							No files are staged yet.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function UploadRow({
	file,
	onRetry,
	onCancel,
	onRemove,
}: {
	file: UploadItem;
	onRetry: () => void;
	onCancel: () => void;
	onRemove: () => void;
}) {
	return (
		<div className="app-surface grid min-h-32 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_180px_170px] lg:items-center">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="truncate font-semibold text-foreground">{file.name}</p>
					<StatusBadge status={file.status} />
				</div>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					{file.type || "unknown type"} / {formatBytes(file.size)}
				</p>
				{file.issue ? (
					<p className="mt-1 text-sm leading-6 text-destructive">{file.issue}</p>
				) : null}
			</div>

			<div>
				<div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
					<span>Progress</span>
					<span className="tabular-nums">{file.progress}%</span>
				</div>
				<div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
					<div
						className={cn(
							"h-full rounded-full transition-[width,background-color] duration-300",
							file.status === "error" || file.status === "invalid"
								? "bg-destructive"
								: file.status === "complete"
									? "bg-success"
									: "bg-primary",
						)}
						style={{ width: `${file.progress}%` }}
					/>
				</div>
				<p className="mt-2 text-xs leading-5 text-muted-foreground">
					Attempt {file.attempts + 1} / checksum {file.checksum}
				</p>
			</div>

			<div className="flex flex-wrap gap-2 lg:justify-end">
				{file.status === "error" || file.status === "canceled" ? (
					<Button type="button" size="sm" variant="outline" onClick={onRetry}>
						<RefreshCw className="size-4" />
						Retry
					</Button>
				) : null}
				{file.status === "uploading" ? (
					<Button type="button" size="sm" variant="outline" onClick={onCancel}>
						<X className="size-4" />
						Cancel
					</Button>
				) : null}
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					aria-label={`Remove ${file.name}`}
					onClick={onRemove}
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: UploadStatus }) {
	const className =
		status === "complete"
			? "border-success/20 bg-success/10 text-success"
			: status === "error" || status === "invalid"
				? "border-destructive/20 bg-destructive/10 text-destructive"
				: status === "uploading"
					? "border-primary/20 bg-primary/10 text-primary"
					: status === "canceled"
						? "border-warning/25 bg-warning/12 text-warning-foreground"
						: "border-border/80 bg-background/80 text-foreground";

	return (
		<Badge variant="outline" className={className}>
			{formatLabel(status)}
		</Badge>
	);
}

function MetricCard({
	label,
	value,
	detail,
	icon: Icon,
}: {
	label: string;
	value: string;
	detail: string;
	icon: LucideIcon;
}) {
	return (
		<Card className="border-border/60">
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm font-medium text-muted-foreground">{label}</p>
					<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Icon className="size-5" />
					</span>
				</div>
				<p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
				<p className="text-sm leading-6 text-muted-foreground">{detail}</p>
			</CardContent>
		</Card>
	);
}

function createUploadItems(files: File[], currentFiles: UploadItem[]) {
	const existingKeys = new Set(currentFiles.map((file) => createFileKey(file.name, file.size)));

	return files.map((file) => {
		const issue = validateFile(file, existingKeys);
		const item: UploadItem = {
			id: crypto.randomUUID(),
			name: file.name,
			type: file.type || "unknown",
			size: file.size,
			status: issue ? "invalid" : "queued",
			progress: 0,
			addedAt: Date.now(),
			attempts: 0,
			checksum: createChecksum(file.name, file.size),
			issue,
		};

		existingKeys.add(createFileKey(file.name, file.size));
		return item;
	});
}

function validateFile(file: File, existingKeys: Set<string>) {
	if (existingKeys.has(createFileKey(file.name, file.size))) {
		return "Duplicate file name and size.";
	}

	if (file.size > maxFileSize) {
		return `File is larger than ${formatBytes(maxFileSize)}.`;
	}

	if (!acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])) {
		return "Unsupported file type for this queue.";
	}

	return undefined;
}

function mergeUploadItems(incomingFiles: UploadItem[], currentFiles: UploadItem[]) {
	const seen = new Set<string>();
	const merged: UploadItem[] = [];

	for (const file of [...incomingFiles, ...currentFiles]) {
		if (seen.has(file.id)) {
			continue;
		}

		seen.add(file.id);
		merged.push(file);
	}

	return merged;
}

function startQueuedUploads(setFiles: UploadSetter) {
	setFiles((currentFiles) =>
		currentFiles.map((file) =>
			file.status === "queued"
				? {
						...file,
						status: "uploading",
						issue: undefined,
					}
				: file,
		),
	);
}

function retryUpload(id: string, setFiles: UploadSetter) {
	setFiles((currentFiles) =>
		currentFiles.map((file) =>
			file.id === id && (file.status === "error" || file.status === "canceled")
				? {
						...file,
						status: "uploading",
						progress: Math.min(file.progress, 64),
						attempts: file.attempts + 1,
						issue: undefined,
					}
				: file,
		),
	);
}

function cancelUpload(id: string, setFiles: UploadSetter) {
	setFiles((currentFiles) =>
		currentFiles.map((file) =>
			file.id === id && file.status === "uploading"
				? {
						...file,
						status: "canceled",
						issue: "Upload canceled by the operator.",
					}
				: file,
		),
	);
}

function cancelUploads(setFiles: UploadSetter) {
	setFiles((currentFiles) =>
		currentFiles.map((file) =>
			file.status === "uploading"
				? {
						...file,
						status: "canceled",
						issue: "Upload canceled by the operator.",
					}
				: file,
		),
	);
}

function removeUpload(id: string, setFiles: UploadSetter) {
	setFiles((currentFiles) => currentFiles.filter((file) => file.id !== id));
}

function summarizeUploads(files: UploadItem[]) {
	const total = files.length;
	const bytes = files.reduce((sum, file) => sum + file.size, 0);
	const complete = files.filter((file) => file.status === "complete").length;
	const invalid = files.filter((file) => file.status === "invalid").length;
	const progressTotal = files.reduce((sum, file) => sum + file.progress, 0);

	return {
		total,
		bytes,
		complete,
		invalid,
		valid: total - invalid,
		averageProgress: total === 0 ? 0 : Math.round(progressTotal / total),
	};
}

function createFileKey(name: string, size: number) {
	return `${name.toLowerCase()}-${size}`;
}

function createChecksum(name: string, size: number) {
	let checksum = size % 997;

	for (const character of name) {
		checksum = (checksum + character.charCodeAt(0) * 17) % 997;
	}

	return checksum;
}

function wait(duration: number) {
	return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function formatBytes(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: value >= 1024 * 1024 ? 1 : 0,
	})
		.format(value >= 1024 * 1024 ? value / (1024 * 1024) : value / 1024)
		.concat(value >= 1024 * 1024 ? " MB" : " KB");
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 0,
	}).format(value);
}

function formatLabel(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}
