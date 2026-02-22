import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type DebouncedFunction<T extends (...args: any[]) => any> = {
	(...args: Parameters<T>): void;
	cancel: () => void;
	flush: () => ReturnType<T> | undefined;
};
