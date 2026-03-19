import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
import { Textarea } from "@/components/ui/textarea";

type InviteState = {
	status: "idle" | "success" | "error";
	message: string;
	lastEmail: string;
};

const initialState: InviteState = {
	status: "idle",
	message: "Use the form to dispatch an action and return UI state from it.",
	lastEmail: "",
};

async function submitInvite(
	_previousState: InviteState,
	formData: FormData,
): Promise<InviteState> {
	await new Promise((resolve) => setTimeout(resolve, 900));

	const email = String(formData.get("email") ?? "").trim();
	const workspace = String(formData.get("workspace") ?? "").trim();

	if (!email || !email.includes("@")) {
		return {
			status: "error",
			message: "Enter a valid email so the action can complete.",
			lastEmail: email,
		};
	}

	if (!workspace) {
		return {
			status: "error",
			message: "Choose a workspace owner before submitting the action.",
			lastEmail: email,
		};
	}

	return {
		status: "success",
		message: `Queued an access review request for ${email} in ${workspace}.`,
		lastEmail: email,
	};
}

function SubmitButton() {
	const { pending, data } = useFormStatus();
	const pendingEmail = data?.get("email");

	return (
		<div className="space-y-2">
			<Button type="submit" disabled={pending} className="w-full sm:w-auto">
				{pending ? "Submitting..." : "Queue Access Review"}
			</Button>
			<p className="text-sm text-muted-foreground">
				{pending && pendingEmail
					? `Submitting ${pendingEmail}...`
					: "useFormStatus reads the status of the parent form while it is running."}
			</p>
		</div>
	);
}

export function FormActionsPage() {
	const [state, formAction, isPending] = useActionState(
		submitInvite,
		initialState,
	);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Form Actions with useActionState"
				summary="React 19 makes function-based form actions first-class. useActionState stores the value returned by the action, and useFormStatus lets nested UI react to the active submission without prop drilling."
				points={[
					{
						title: "Action return value becomes state",
						detail:
							"useActionState gives the action the previous state and replaces it with whatever the action returns next.",
					},
					{
						title: "Pending status stays near the button",
						detail:
							"useFormStatus reads the parent form submission so button and helper copy can update without threading flags through the tree.",
					},
					{
						title: "Works naturally with form action props",
						detail:
							"Forms can call async functions directly, which keeps validation, pending UI, and returned state in one flow.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "useActionState",
						href: "https://react.dev/reference/react/useActionState",
					},
					{
						label: "useFormStatus",
						href: "https://react.dev/reference/react-dom/hooks/useFormStatus",
					},
				]}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Security review request</CardTitle>
						<CardDescription>
							This form is intentionally uncontrolled so it behaves like a real
							form action instead of a client-only submit handler.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={formAction} className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor="invite-email">Reviewer email</Label>
								<Input
									id="invite-email"
									name="email"
									type="email"
									defaultValue="ops@northstar.example"
									placeholder="name@company.com"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="invite-workspace">Workspace</Label>
								<Input
									id="invite-workspace"
									name="workspace"
									defaultValue="Revenue Operations"
									placeholder="Workspace name"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="invite-notes">Notes</Label>
								<Textarea
									id="invite-notes"
									name="notes"
									defaultValue="Review owner access before the next renewal cycle."
								/>
							</div>

							<SubmitButton />
						</form>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Returned action state</CardTitle>
						<CardDescription>
							The action decides what state comes back into the component after
							each submission.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Badge
							variant={
								state.status === "error"
									? "destructive"
									: state.status === "success"
										? "default"
										: "outline"
							}
						>
							{state.status === "idle"
								? "Ready"
								: state.status === "success"
									? "Submitted"
									: "Needs attention"}
						</Badge>

						<p className="text-sm leading-6 text-muted-foreground">
							{state.message}
						</p>

						<div className="rounded-2xl border border-border/60 bg-muted/45 p-4 text-sm text-muted-foreground">
							<p className="font-medium text-foreground">Current hook values</p>
							<p className="mt-2">isPending: {String(isPending)}</p>
							<p>lastEmail: {state.lastEmail || "none yet"}</p>
						</div>

						<div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
							<p className="font-medium text-foreground">
								When to reach for this
							</p>
							<p className="mt-2">
								Use this pattern when the submit function should own validation,
								server work, and the next UI state as one unit.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
