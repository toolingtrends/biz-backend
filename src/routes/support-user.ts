import { Router } from "express";
import { requireUser, requireUserApp } from "../middleware/auth.middleware";
import * as ctrl from "../modules/admin/support/support-user.controller";

const router = Router();

router.post("/tickets", requireUser, requireUserApp, ctrl.createTicket);
router.get("/tickets", requireUser, requireUserApp, ctrl.listMyTickets);
router.post("/tickets/:id/replies", requireUser, requireUserApp, ctrl.addReply);

export default router;
