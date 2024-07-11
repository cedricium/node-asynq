export interface Options {
  retry: number;
  queue: string;
  timeout: number;
  deadline: number;
  uniqueTTL: number;
  processAt: number;
}

const DEFAULT_QUEUE = "default";
const DEFAULT_MAX_RETRY = 25;
const DEFAULT_TIMEOUT = 60 * 30;
const DEFAULT_DEADLINE = 0;
const DEFAULT_UNIQUE_TTL = 0;

export const DEFAULT_OPTIONS: Options = {
  retry: DEFAULT_MAX_RETRY,
  queue: DEFAULT_QUEUE,
  timeout: DEFAULT_TIMEOUT,
  deadline: DEFAULT_DEADLINE,
  uniqueTTL: DEFAULT_UNIQUE_TTL,
  processAt: Date.now(),
};
