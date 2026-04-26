import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = {
	(...args: Parameters<T>): void;
	cancel: () => void;
	flush: () => ReturnType<T> | undefined;
};
