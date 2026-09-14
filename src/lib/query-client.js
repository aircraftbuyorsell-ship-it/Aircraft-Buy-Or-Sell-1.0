import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 60 * 1000,
			gcTime: 5 * 60 * 1000,
		},
		mutations: {
			retry: 0,
		},
	},
});