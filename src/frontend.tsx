/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { ThemeProvider } from "@/components/theme-provider";

const elem = document.getElementById("root");

if (!elem) {
	throw new Error('Root element "#root" was not found.');
}

const rootElement = elem;

async function renderApp() {
	const { router } = await import("./router");
	const app = (
		<StrictMode>
			<ThemeProvider>
				<RouterProvider router={router} />
			</ThemeProvider>
		</StrictMode>
	);

	if (import.meta.hot) {
		// With hot module reloading, `import.meta.hot.data` is persisted.
		if (!import.meta.hot.data.root) {
			import.meta.hot.data.root = createRoot(rootElement);
		}
		const root = import.meta.hot.data.root;
		root.render(app);
		return;
	}

	// The hot module reloading API is not available in production.
	createRoot(rootElement).render(app);
}

void renderApp();
