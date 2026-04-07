import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as followersCtrl from "./speaker-followers.controller";
import * as feedbackCtrl from "./speaker-feedback.controller";

const router = Router();

router.get("/speaker-followers", requireAdmin, followersCtrl.list);
router.get("/speaker-followers/:id", requireAdmin, followersCtrl.getById);
router.get("/speaker-feedback", requireAdmin, feedbackCtrl.list);
router.patch("/speaker-feedback/:id", requireAdmin, feedbackCtrl.updateById);

export default router;
