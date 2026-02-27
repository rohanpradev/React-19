// src/App.tsx
import React from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
// ShadCN components
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionsPage } from "@/pages/Actions";
import { UseOptimisticPage } from "@/pages/Optimistic";
import { ReactUsePage } from "@/pages/ReactUse";
import { SearchDebounce } from "@/pages/SearchDebounce";

import "./index.css";

export function App() {
	const links = [
		{ path: "/react-use", label: "React Use Hook" },
		{ path: "/search-debounce", label: "Search Debounce" },
		{ path: "/actions", label: "Actions" },
		{ path: "/optimistic", label: "useOptimistic" },
	];

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="w-64 border-r border-gray-200 p-6 flex flex-col">
				<h2 className="text-2xl font-bold mb-6">React 19 Features</h2>
				<ScrollArea className="flex-1">
					<ul className="space-y-2">
						{links.map(({ path, label }) => (
							<li key={path}>
								<Button
									variant="ghost"
									asChild
									className="w-full justify-start"
								>
									<NavLink
										to={path}
										className={({ isActive }) =>
											`w-full text-left ${isActive ? "font-semibold text-blue-600" : "font-normal text-gray-700"}`
										}
									>
										{label}
									</NavLink>
								</Button>
							</li>
						))}
					</ul>
				</ScrollArea>
			</aside>

			{/* Main content */}
			<main className="flex-1 p-8 overflow-y-auto">
				<Routes>
					<Route path="/" element={<Navigate to="/react-use" replace />} />
					<Route path="/react-use" element={<ReactUsePage />} />
					<Route path="/search-debounce" element={<SearchDebounce />} />
					<Route path="/actions" element={<ActionsPage />} />
					<Route path="/optimistic" element={<UseOptimisticPage />} />
				</Routes>
			</main>
		</div>
	);
}

export default App;
