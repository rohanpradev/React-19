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
import { router } from "@/router";

const elem = document.getElementById("root");

if (!elem) {
	throw new Error('Root element "#root" was not found.');
}

const rootElement = elem;
const app = (
	<StrictMode>
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>
);

function renderApp() {
	if (import.meta.hot) {
		// With hot module reloading, `import.meta.hot.data` is persisted.
		const existingRoot = import.meta.hot.data.root;
		const root = existingRoot ?? createRoot(rootElement);
		import.meta.hot.data.root = root;
		root.render(app);
		return;
	}

	// The hot module reloading API is not available in production.
	createRoot(rootElement).render(app);
}

renderApp();
