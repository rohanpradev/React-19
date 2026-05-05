import { AlertTriangle, Home } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RouteErrorBoundary() {
	const error = useRouteError();
	const title = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: "Route failed";
	const message = isRouteErrorResponse(error)
		? "React Router caught a route response before the page rendered."
		: error instanceof Error
			? error.message
			: "Something unexpected happened while loading this route.";

	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<Card className="w-full max-w-xl border-destructive/20">
				<CardHeader>
					<div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
						<AlertTriangle className="size-5" />
					</div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{message}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<Link to="/overview">
							<Home className="size-4" />
							Back to overview
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
