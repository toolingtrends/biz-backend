import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./notifications.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/count", requireAdmin, ctrl.getCount);

export default router;
