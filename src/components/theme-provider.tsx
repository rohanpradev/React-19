import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ThemePreset = "studio" | "ocean" | "graphite";
type ResolvedTheme = "light" | "dark";

export const themePresetOptions = [
	{
		value: "studio",
		label: "SaaS Blue",
		description: "Slate product surfaces with a reliable cobalt action color.",
		swatch:
			"linear-gradient(135deg, oklch(0.48 0.17 263), oklch(0.92 0.055 190), oklch(0.985 0.006 255))",
	},
	{
		value: "ocean",
		label: "Aurora",
		description: "Cool teal-blue accents for a slightly brighter technical feel.",
		swatch:
			"linear-gradient(135deg, oklch(0.5 0.13 198), oklch(0.91 0.065 175), oklch(0.985 0.006 255))",
	},
	{
		value: "graphite",
		label: "Graphite",
		description: "Monochrome focus mode with no decorative color cast.",
		swatch: "linear-gradient(135deg, oklch(0.24 0 0), oklch(0.68 0 0), oklch(0.985 0 0))",
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

function readPreference(key: string): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		return window.localStorage.getItem(key);
	} catch {
		// Appearance remains usable when the browser blocks persistent storage.
		return null;
	}
}

function writePreference(key: string, value: string) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Keep the selected appearance for this tab when persistence is unavailable.
	}
}

function getStoredTheme(): Theme {
	const storedTheme = readPreference(STORAGE_KEY);
	return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
		? storedTheme
		: "system";
}

function getStoredPreset(): ThemePreset {
	const storedPreset = readPreference(PRESET_STORAGE_KEY);
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
	root.dataset["theme"] = resolvedTheme;
	root.dataset["preset"] = preset;
	root.style.colorScheme = resolvedTheme;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", resolvedTheme === "dark" ? "#101828" : "#f8fafc");
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

	useEffect(() => {
		const syncPreferences = (event: StorageEvent) => {
			if (event.key === STORAGE_KEY || event.key === null) {
				setThemeState(getStoredTheme());
			}
			if (event.key === PRESET_STORAGE_KEY || event.key === null) {
				setPresetState(getStoredPreset());
			}
		};

		window.addEventListener("storage", syncPreferences);
		return () => window.removeEventListener("storage", syncPreferences);
	}, []);

	const setTheme = (nextTheme: Theme) => {
		setThemeState(nextTheme);
		writePreference(STORAGE_KEY, nextTheme);
	};

	const setPreset = (nextPreset: ThemePreset) => {
		setPresetState(nextPreset);
		writePreference(PRESET_STORAGE_KEY, nextPreset);
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
