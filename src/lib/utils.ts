export { cn } from "cn";

export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = {
	(...args: Parameters<T>): void;
	cancel: () => void;
	flush: () => ReturnType<T> | undefined;
};
