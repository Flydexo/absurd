import { router } from "../trpc";
import { metricsRouter } from "./metrics";
import { dataPointsRouter } from "./dataPoints";
import { northStarRouter } from "./northStar";
import { invitesRouter } from "./invites";

export const appRouter = router({
  metrics: metricsRouter,
  dataPoints: dataPointsRouter,
  northStar: northStarRouter,
  invites: invitesRouter,
});

export type AppRouter = typeof appRouter;
