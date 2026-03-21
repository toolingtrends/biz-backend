import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import {
  getPendingDeactivationsHandler,
  getDeactivationsHandler,
  postApproveDeactivationHandler,
  postRejectDeactivationHandler,
  postProcessDueDeactivationsHandler,
} from "./account-deactivation.controller";

const router = Router();

router.get("/pending", requireAdmin, getPendingDeactivationsHandler);
router.get("/", requireAdmin, getDeactivationsHandler);
router.post("/:id/approve", requireAdmin, postApproveDeactivationHandler);
router.post("/:id/reject", requireAdmin, postRejectDeactivationHandler);
router.post("/process-due", requireAdmin, postProcessDueDeactivationsHandler);

export default router;
