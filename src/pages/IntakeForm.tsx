import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { CheckCircle2, CircleAlert, ClipboardCheck, FileCheck2, ShieldCheck } from "lucide-react";
import * as v from "valibot";

import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const priorityLevels = ["low", "medium", "high", "critical"] as const;
const rolloutWindows = ["one-week", "two-weeks", "phased", "quarterly"] as const;

type PriorityLevel = (typeof priorityLevels)[number];
type RolloutWindow = (typeof rolloutWindows)[number];

type IntakeFormValues = {
	title: string;
	ownerEmail: string;
	priority: PriorityLevel;
	budget: number;
	hypothesis: string;
	reviewersText: string;
	rolloutWindow: RolloutWindow;
};

type SubmissionState =
	| {
			status: "idle";
			message: string;
			issues: string[];
	  }
	| {
			status: "success";
			message: string;
			issues: string[];
	  }
	| {
			status: "error";
			message: string;
			issues: string[];
	  };

const defaultValues: IntakeFormValues = {
	title: "Activity-backed account workspace",
	ownerEmail: "platform@northstar.example",
	priority: "high",
	budget: 62000,
	hypothesis:
		"Keeping inactive route previews warm will reduce recovery time for revenue operators.",
	reviewersText: "design@northstar.example, data@northstar.example",
	rolloutWindow: "phased",
};

const intakeSchema = v.pipe(
	v.object({
		title: v.pipe(v.string(), v.trim(), v.minLength(6, "Use a specific experiment title.")),
		ownerEmail: v.pipe(v.string(), v.trim(), v.email("Use a valid owner email.")),
		priority: v.picklist(priorityLevels, "Choose a valid priority."),
		budget: v.pipe(
			v.number(),
			v.minValue(5000, "Budget must be at least 5,000."),
			v.maxValue(250000, "Budget must stay below 250,000."),
		),
		hypothesis: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(24, "Write a testable hypothesis, not a label."),
		),
		reviewers: v.pipe(
			v.array(v.pipe(v.string(), v.trim(), v.email("Every reviewer must be an email."))),
			v.minLength(2, "Add at least two reviewers for the launch review."),
		),
		rolloutWindow: v.picklist(rolloutWindows, "Choose a rollout window."),
	}),
	v.check(
		(value) => value.priority !== "critical" || value.rolloutWindow === "phased",
		"Critical launches must use the phased rollout window.",
	),
	v.check(
		(value) => value.priority !== "high" || value.budget >= 25000,
		"High priority launches need a budget of at least 25,000.",
	),
);

const initialSubmission: SubmissionState = {
	status: "idle",
	message: "Submit the intake to run field and schema validation.",
	issues: [],
};

export function IntakeFormPage() {
	const [submission, setSubmission] = useState<SubmissionState>(initialSubmission);
	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const payload = normalizeIntake(value);
			const result = v.safeParse(intakeSchema, payload);

			if (!result.success) {
				setSubmission({
					status: "error",
					message: "Schema validation blocked the launch review.",
					issues: result.issues.map((issue) => issue.message),
				});
				return;
			}

			await new Promise((resolve) => setTimeout(resolve, 650));

			setSubmission({
				status: "success",
				message: `${result.output.title} is ready for ${result.output.reviewers.length} reviewers.`,
				issues: [],
			});
		},
	});

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="TanStack Form + Valibot"
				title="Complex Intake Validation"
				summary="A shadcn-style launch intake with field-level validation, submit-time schema checks, and cross-field business rules."
				points={[
					{
						title: "Field-level feedback",
						detail: "TanStack Form keeps each field state isolated and subscribable.",
					},
					{
						title: "Schema contract",
						detail: "Valibot validates the normalized payload before submission succeeds.",
					},
					{
						title: "Business rules",
						detail: "Priority, budget, reviewers, and rollout strategy are validated together.",
					},
				]}
				links={[
					{
						label: "TanStack Form",
						href: "https://tanstack.com/form/latest/docs/framework/react/guides/validation",
					},
					{
						label: "shadcn forms",
						href: "https://ui.shadcn.com/docs/forms/tanstack-form",
					},
					{
						label: "Valibot",
						href: "https://valibot.dev/",
					},
				]}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
				<Card className="border-border/60">
					<CardHeader className="border-b border-border/60">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<CardTitle>Launch review intake</CardTitle>
								<CardDescription>
									Change priority or budget to trigger linked validation rules.
								</CardDescription>
							</div>
							<Badge variant="secondary">Schema-backed</Badge>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						<form
							className="grid gap-5"
							onSubmit={(event) => {
								event.preventDefault();
								event.stopPropagation();
								void form.handleSubmit();
							}}
						>
							<form.Field
								name="title"
								validators={{
									onChange: ({ value }) =>
										value.trim().length < 6 ? "Use at least 6 characters." : undefined,
								}}
							>
								{(field) => (
									<FieldShell
										id={field.name}
										label="Experiment title"
										errors={fieldErrors(field.state.meta.errors)}
									>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</FieldShell>
								)}
							</form.Field>

							<div className="grid gap-5 md:grid-cols-2">
								<form.Field
									name="ownerEmail"
									validators={{
										onBlur: ({ value }) =>
											value.includes("@") ? undefined : "Use an owner email.",
									}}
								>
									{(field) => (
										<FieldShell
											id={field.name}
											label="Owner email"
											errors={fieldErrors(field.state.meta.errors)}
										>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) => field.handleChange(event.target.value)}
											/>
										</FieldShell>
									)}
								</form.Field>

								<form.Field
									name="budget"
									validators={{
										onChange: ({ value }) =>
											value < 5000 ? "Minimum review budget is 5,000." : undefined,
									}}
								>
									{(field) => (
										<FieldShell
											id={field.name}
											label="Budget"
											errors={fieldErrors(field.state.meta.errors)}
										>
											<Input
												id={field.name}
												name={field.name}
												type="number"
												min={0}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) => field.handleChange(Number(event.target.value) || 0)}
											/>
										</FieldShell>
									)}
								</form.Field>
							</div>

							<div className="grid gap-5 md:grid-cols-2">
								<form.Field name="priority">
									{(field) => (
										<FieldShell id={field.name} label="Priority" errors={[]}>
											<Select
												value={field.state.value}
												onValueChange={(value) => field.handleChange(value as PriorityLevel)}
											>
												<SelectTrigger id={field.name} className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{priorityLevels.map((priority) => (
														<SelectItem key={priority} value={priority}>
															{formatLabel(priority)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FieldShell>
									)}
								</form.Field>

								<form.Field name="rolloutWindow">
									{(field) => (
										<FieldShell id={field.name} label="Rollout window" errors={[]}>
											<Select
												value={field.state.value}
												onValueChange={(value) => field.handleChange(value as RolloutWindow)}
											>
												<SelectTrigger id={field.name} className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{rolloutWindows.map((window) => (
														<SelectItem key={window} value={window}>
															{formatLabel(window)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FieldShell>
									)}
								</form.Field>
							</div>

							<form.Field
								name="hypothesis"
								validators={{
									onChange: ({ value }) =>
										value.trim().length < 24
											? "Make the hypothesis specific enough to test."
											: undefined,
								}}
							>
								{(field) => (
									<FieldShell
										id={field.name}
										label="Hypothesis"
										errors={fieldErrors(field.state.meta.errors)}
									>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</FieldShell>
								)}
							</form.Field>

							<form.Field
								name="reviewersText"
								validators={{
									onChange: ({ value }) =>
										parseReviewers(value).length < 2
											? "Add at least two comma-separated reviewer emails."
											: undefined,
								}}
							>
								{(field) => (
									<FieldShell
										id={field.name}
										label="Reviewers"
										errors={fieldErrors(field.state.meta.errors)}
									>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</FieldShell>
								)}
							</form.Field>

							<div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
								<form.Subscribe
									selector={(state) =>
										[state.canSubmit, state.isSubmitting, state.isDirty] as const
									}
								>
									{([canSubmit, isSubmitting, isDirty]) => (
										<div className="flex flex-wrap gap-2">
											<Button type="submit" disabled={!canSubmit || isSubmitting}>
												{isSubmitting ? "Validating..." : "Submit review"}
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													form.reset();
													setSubmission(initialSubmission);
												}}
												disabled={!isDirty || isSubmitting}
											>
												Reset
											</Button>
										</div>
									)}
								</form.Subscribe>
								<p className="text-sm leading-6 text-muted-foreground">
									Submit runs the normalized Valibot schema after field validators pass.
								</p>
							</div>
						</form>
					</CardContent>
				</Card>

				<div className="grid gap-4">
					<Card className="border-border/60">
						<CardHeader>
							<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<ClipboardCheck className="size-5" />
							</div>
							<CardTitle>Validation result</CardTitle>
							<CardDescription>Field state plus schema result.</CardDescription>
						</CardHeader>
						<CardContent>
							<Alert variant={submission.status === "error" ? "destructive" : "success"}>
								{submission.status === "error" ? <CircleAlert /> : <CheckCircle2 />}
								<div className="space-y-1">
									<AlertTitle>
										{submission.status === "error"
											? "Review blocked"
											: submission.status === "success"
												? "Review ready"
												: "Ready"}
									</AlertTitle>
									<AlertDescription>{submission.message}</AlertDescription>
								</div>
							</Alert>

							{submission.issues.length > 0 ? (
								<div className="mt-4 space-y-2">
									{submission.issues.map((issue) => (
										<div
											key={issue}
											className="app-muted-surface p-3 text-sm text-muted-foreground"
										>
											{issue}
										</div>
									))}
								</div>
							) : null}
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader>
							<div className="flex size-11 items-center justify-center rounded-lg bg-accent/45 text-accent-foreground">
								<ShieldCheck className="size-5" />
							</div>
							<CardTitle>Rules encoded</CardTitle>
							<CardDescription>What makes this more than a simple form.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{[
								"Each field owns immediate feedback through TanStack Form validators.",
								"The submit payload is normalized before schema validation.",
								"Reviewer emails are validated as a typed array, not free text.",
								"Critical priority is linked to a phased rollout window.",
							].map((rule) => (
								<div key={rule} className="app-muted-surface flex items-start gap-3 p-4">
									<FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" />
									<p className="text-sm leading-6 text-muted-foreground">{rule}</p>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function FieldShell({
	id,
	label,
	errors,
	children,
}: {
	id: string;
	label: string;
	errors: string[];
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			{children}
			{errors.length > 0 ? (
				<div className="grid gap-1">
					{errors.map((error) => (
						<p key={error} className="text-sm leading-5 text-destructive">
							{error}
						</p>
					))}
				</div>
			) : null}
		</div>
	);
}

function fieldErrors(errors: unknown[]) {
	return errors.flatMap((error) => (typeof error === "string" && error ? [error] : []));
}

function normalizeIntake(value: IntakeFormValues) {
	return {
		title: value.title,
		ownerEmail: value.ownerEmail,
		priority: value.priority,
		budget: value.budget,
		hypothesis: value.hypothesis,
		reviewers: parseReviewers(value.reviewersText),
		rolloutWindow: value.rolloutWindow,
	};
}

function parseReviewers(value: string) {
	return value
		.split(",")
		.map((reviewer) => reviewer.trim())
		.filter(Boolean);
}

function formatLabel(value: string) {
	return value
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}
