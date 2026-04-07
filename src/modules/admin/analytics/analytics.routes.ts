import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./analytics.controller";

const router = Router();

router.get("/events-growth", requireAdmin, ctrl.eventsGrowth);
router.get("/user-growth", requireAdmin, ctrl.userGrowth);
router.get("/revenue", requireAdmin, ctrl.revenue);

export default router;
