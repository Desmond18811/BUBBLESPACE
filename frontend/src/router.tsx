import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { NotFoundPage } from "./routes/404";

export const getRouter = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                // Frequently-visited reads stay fresh briefly so navigating back to a
                // screen doesn't re-spinner; data still revalidates in the background.
                staleTime: 1000 * 60, // 1 min
                gcTime: 1000 * 60 * 30, // keep cached data 30 min
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    });

    const router = createRouter({
        routeTree,
        context: { queryClient },
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
        defaultNotFoundComponent: NotFoundPage,
    });

    return router;
};
