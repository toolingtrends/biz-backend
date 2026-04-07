import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./financial.controller";

const router = Router();

router.get("/transactions", requireAdmin, ctrl.transactions);
router.get("/payments", requireAdmin, ctrl.payments);
router.get("/subscriptions", requireAdmin, ctrl.subscriptions);
router.get("/invoices", requireAdmin, ctrl.invoices);
router.get("/promotion-packages", requireAdmin, ctrl.promotionPackages);

export default router;
