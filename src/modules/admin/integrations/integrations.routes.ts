import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./integrations.controller";

const router = Router();

router.get("/payments", requireAdmin, ctrl.getPayments);
router.patch("/payments/gateways/:gatewayId", requireAdmin, ctrl.patchPaymentGateway);
router.post("/payments/gateways/:gatewayId/test", requireAdmin, ctrl.testPaymentGateway);

router.get("/communication", requireAdmin, ctrl.getCommunication);
router.patch("/communication/providers/:id", requireAdmin, ctrl.patchCommunicationProvider);
router.post("/communication/providers/:id/test", requireAdmin, ctrl.testCommunicationProvider);

router.get("/travel", requireAdmin, ctrl.getTravel);
router.post("/travel/partners", requireAdmin, ctrl.createTravelPartner);
router.patch("/travel/partners/:partnerId", requireAdmin, ctrl.patchTravelPartner);
router.post("/travel/partners/:partnerId/sync", requireAdmin, ctrl.syncTravelPartner);

/** Legacy paths used by older admin UI (alias) */
router.patch("/travel/:partnerId", requireAdmin, ctrl.patchTravelPartner);
router.post("/travel/:partnerId/sync", requireAdmin, ctrl.syncTravelPartner);

export default router;
