import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ThemePreset = "studio" | "ocean" | "graphite";
type ResolvedTheme = "light" | "dark";

export const themePresetOptions = [
	{
		value: "studio",
		label: "Studio",
		description: "Warm editorial surfaces with blue action color.",
		swatch: "linear-gradient(135deg, hsl(210 92% 44%), hsl(39 88% 78%), hsl(205 36% 94%))",
	},
	{
		value: "ocean",
		label: "Ocean",
		description: "Cool cyan palette with softer neutral surfaces.",
		swatch: "linear-gradient(135deg, hsl(192 86% 40%), hsl(182 54% 76%), hsl(202 42% 93%))",
	},
	{
		value: "graphite",
		label: "Graphite",
		description: "Neutral product palette with copper accents.",
		swatch: "linear-gradient(135deg, hsl(221 28% 28%), hsl(24 62% 66%), hsl(205 22% 92%))",
	},
] as const satisfies {
	value: ThemePreset;
	label: string;
	description: string;
	swatch: string;
}[];

type ThemeContextValue = {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	preset: ThemePreset;
	setTheme: (theme: Theme) => void;
	setPreset: (preset: ThemePreset) => void;
};

const STORAGE_KEY = "bun-react-theme";
const PRESET_STORAGE_KEY = "bun-react-theme-preset";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
	if (typeof window === "undefined") {
		return "system";
	}

	const storedTheme = window.localStorage.getItem(STORAGE_KEY);
	return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
		? storedTheme
		: "system";
}

function getStoredPreset(): ThemePreset {
	if (typeof window === "undefined") {
		return "studio";
	}

	const storedPreset = window.localStorage.getItem(PRESET_STORAGE_KEY);
	return themePresetOptions.some((option) => option.value === storedPreset)
		? (storedPreset as ThemePreset)
		: "studio";
}

function getSystemTheme(): ResolvedTheme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
	return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolvedTheme: ResolvedTheme, preset: ThemePreset) {
	const root = document.documentElement;
	root.classList.toggle("dark", resolvedTheme === "dark");
	root.dataset.theme = resolvedTheme;
	root.dataset.preset = preset;
	root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
	const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
	const [preset, setPresetState] = useState<ThemePreset>(() => getStoredPreset());
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
		typeof window === "undefined" ? "light" : resolveTheme(getStoredTheme()),
	);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const syncTheme = () => {
			const nextResolvedTheme = resolveTheme(theme);
			setResolvedTheme(nextResolvedTheme);
			applyTheme(nextResolvedTheme, preset);
		};

		syncTheme();

		if (theme !== "system") {
			return;
		}

		media.addEventListener("change", syncTheme);
		return () => media.removeEventListener("change", syncTheme);
	}, [preset, theme]);

	const setTheme = (nextTheme: Theme) => {
		setThemeState(nextTheme);
		window.localStorage.setItem(STORAGE_KEY, nextTheme);
	};

	const setPreset = (nextPreset: ThemePreset) => {
		setPresetState(nextPreset);
		window.localStorage.setItem(PRESET_STORAGE_KEY, nextPreset);
	};

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, preset, setTheme, setPreset }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used inside ThemeProvider.");
	}

	return context;
}
