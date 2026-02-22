import { useCallback, useEffect, useRef } from "react";

export function useDebounce<T extends (...args: any[]) => void>(
	callback: T,
	delay: number,
) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const debouncedFunction = useCallback(
		(...args: Parameters<T>) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay],
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return debouncedFunction;
}
