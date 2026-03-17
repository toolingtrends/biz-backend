import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./exhibitors.controller";

const router = Router();

// Exhibitor feedback (admin organizer feedback page) — must be before /:id
router.get("/exhibitor-feedback", requireAdmin, ctrl.listExhibitorFeedback);
router.patch("/exhibitor-feedback/:id", requireAdmin, ctrl.updateExhibitorFeedback);

router.get("/stats", requireAdmin, ctrl.getStats);
router.get("/", requireAdmin, ctrl.list);
router.get("/:id", requireAdmin, ctrl.getById);
router.post("/", requireAdmin, ctrl.create);
router.patch("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);

export default router;
