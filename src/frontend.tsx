/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { AppBootState } from "@/components/app-boot-state";
import { ThemeProvider } from "@/components/theme-provider";

const elem = document.getElementById("root");

if (!elem) {
	throw new Error('Root element "#root" was not found.');
}

// Reuse the root across Bun updates, including a failed startup followed by a fix.
let root: Root;
if (import.meta.hot) {
	if (!import.meta.hot.data.root) import.meta.hot.data.root = createRoot(elem);
	root = import.meta.hot.data.root;
} else {
	root = createRoot(elem);
}

async function renderApp() {
	root.render(<AppBootState />);
	try {
		const { router } = await import("./router");
		root.render(
			<StrictMode>
				<ThemeProvider>
					<RouterProvider router={router} />
				</ThemeProvider>
			</StrictMode>,
		);
	} catch (error) {
		console.error("The workspace failed to start.", error);
		root.render(<AppBootState failed />);
	}
}

void renderApp();
