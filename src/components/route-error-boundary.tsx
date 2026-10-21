import { useEffect, useRef } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RouteErrorBoundary({ embedded = false }: { embedded?: boolean }) {
	const error = useRouteError();
	const headingRef = useRef<HTMLHeadingElement>(null);
	const Container = embedded ? "section" : "main";
	const title = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: embedded
			? "This page could not load"
			: "The workspace could not load";
	const message = isRouteErrorResponse(error)
		? "The service could not open this page. Reload to try again or return to the overview."
		: "A connection problem or an update may have interrupted loading. Reload the page to try again.";

	useEffect(() => {
		console.error("Workspace route failed:", error);
		headingRef.current?.focus({ preventScroll: true });
	}, [error]);

	return (
		<Container
			aria-labelledby="route-error-title"
			className={`flex items-center justify-center ${embedded ? "min-h-72 py-6" : "min-h-screen p-6"}`}
		>
			<title>{`${title} · React Systems Studio`}</title>
			<Card className="w-full max-w-xl border-destructive/20">
				<CardHeader>
					<div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
						<AlertTriangle className="size-5" />
					</div>
					<CardTitle>
						<h1 ref={headingRef} tabIndex={-1} id="route-error-title">
							{title}
						</h1>
					</CardTitle>
					<CardDescription>{message}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => window.location.reload()}>
						<RefreshCw aria-hidden="true" className="size-4" />
						Reload page
					</Button>
					<Button asChild variant="outline">
						<Link to="/overview">
							<Home className="size-4" />
							Back to overview
						</Link>
					</Button>
				</CardContent>
			</Card>
		</Container>
	);
}

/** Keep navigation, session state and the query cache mounted when one page fails. */
export function PageErrorBoundary() {
	return <RouteErrorBoundary embedded />;
}
