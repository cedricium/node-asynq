export type Options = {
  retry: number;
  queue: string;
  timeout: number;
  deadline: number;
  uniqueTTL: number;
  processAt: number;
};

export const NO_TIMEOUT = 0;
export const NO_DEADLINE = 0;

export const DEFAULT_QUEUE = "default";
export const DEFAULT_MAX_RETRY = 25;
export const DEFAULT_TIMEOUT = 60 * 30;
export const DEFAULT_DEADLINE = 0;
export const DEFAULT_UNIQUE_TTL = 0;
export const DEFAULT_PROCESS_AT = Date.now();

// TODO: replace with composeOptions() function
export const DEFAULT_OPTIONS: Options = {
  retry: DEFAULT_MAX_RETRY,
  queue: DEFAULT_QUEUE,
  timeout: NO_TIMEOUT,
  deadline: DEFAULT_DEADLINE,
  uniqueTTL: DEFAULT_UNIQUE_TTL,
  processAt: DEFAULT_PROCESS_AT,
};
