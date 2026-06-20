import { QueryClient } from '@tanstack/react-query';


function isRateLimit(error) {
	const msg = (error?.message || "").toLowerCase();
	return msg.includes("rate limit") || error?.status === 429 || error?.response?.status === 429;
}

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 60_000,
			// Back off harder on rate limits, give up quickly on other errors
			retry: (failureCount, error) => {
				if (isRateLimit(error)) return failureCount < 4;
				return failureCount < 1;
			},
			// Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
		},
		mutations: {
			retry: (failureCount, error) => isRateLimit(error) && failureCount < 3,
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
		},
	},
});