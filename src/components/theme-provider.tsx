import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "bun-react-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
	if (typeof window === "undefined") {
		return "system";
	}

	const storedTheme = window.localStorage.getItem(STORAGE_KEY);
	return storedTheme === "light" ||
		storedTheme === "dark" ||
		storedTheme === "system"
		? storedTheme
		: "system";
}

function getSystemTheme(): ResolvedTheme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
	return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
	const root = document.documentElement;
	root.classList.toggle("dark", resolvedTheme === "dark");
	root.dataset.theme = resolvedTheme;
	root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
	const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
		typeof window === "undefined" ? "light" : resolveTheme(getStoredTheme()),
	);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const syncTheme = () => {
			const nextResolvedTheme = resolveTheme(theme);
			setResolvedTheme(nextResolvedTheme);
			applyTheme(nextResolvedTheme);
		};

		syncTheme();

		if (theme !== "system") {
			return;
		}

		media.addEventListener("change", syncTheme);
		return () => media.removeEventListener("change", syncTheme);
	}, [theme]);

	const setTheme = (nextTheme: Theme) => {
		setThemeState(nextTheme);
		window.localStorage.setItem(STORAGE_KEY, nextTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
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
