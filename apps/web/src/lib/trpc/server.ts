import "server-only";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers";
import superjson from "superjson";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
