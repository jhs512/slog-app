// Shared execution/transport bounds. Keep a finite escape hatch for infinite loops.
export const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
export const MAX_TRACE_STEPS = 50000;
export const MAX_SHARE_TOKEN = 2 * 1024 * 1024;
export const MAX_SNAPSHOT_BYTES = 64 * 1024 * 1024;
export const MAX_C_OUTPUT = 256 * 1024;
export const MAX_C_TICKS = 10000000;
export const MAX_C_TIME_MS = 30000;
