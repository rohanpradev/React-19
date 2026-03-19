import { Temporal as TemporalPolyfill } from "@js-temporal/polyfill";

const temporalGlobal = globalThis as typeof globalThis & {
	Temporal?: typeof TemporalPolyfill;
};

export const Temporal = temporalGlobal.Temporal ?? TemporalPolyfill;
