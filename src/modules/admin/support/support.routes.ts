import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./support.controller";

const router = Router();

router.get("/tickets", requireAdmin, ctrl.listTickets);
router.put("/tickets/:id", requireAdmin, ctrl.updateTicket);
router.post("/tickets/:id/replies", requireAdmin, ctrl.replyToTicket);

export default router;
