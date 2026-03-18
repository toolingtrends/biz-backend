import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./visitors.controller";

const router = Router();

// Specific paths first (before /:id)
router.get("/visitor-events", requireAdmin, ctrl.listVisitorEvents);
router.get("/visitor-connections", requireAdmin, ctrl.listVisitorConnections);
router.get("/visitor-appointments", requireAdmin, ctrl.listVisitorAppointments);

router.get("/", requireAdmin, ctrl.list);
router.get("/:id", requireAdmin, ctrl.getById);
router.patch("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);

export default router;
