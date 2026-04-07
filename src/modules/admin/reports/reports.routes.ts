import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./reports.controller";

const router = Router();

router.get("/overview", requireAdmin, ctrl.getOverview);
router.get("/", requireAdmin, ctrl.list);

export default router;
