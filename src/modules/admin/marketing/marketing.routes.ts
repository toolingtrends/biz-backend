import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import {
  listEmailCampaignsHandler,
  createEmailCampaignHandler,
  listEmailTemplatesHandler,
  createEmailTemplateHandler,
  deleteEmailTemplateHandler,
  listPushNotificationsHandler,
  createPushNotificationHandler,
  listPushTemplatesHandler,
  createPushTemplateHandler,
  deletePushTemplateHandler,
} from "./marketing.controller";

const router = Router();

router.get("/email-campaigns", requireAdmin, listEmailCampaignsHandler);
router.post("/email-campaigns", requireAdmin, createEmailCampaignHandler);
router.get("/email-templates", requireAdmin, listEmailTemplatesHandler);
router.post("/email-templates", requireAdmin, createEmailTemplateHandler);
router.delete("/email-templates/:id", requireAdmin, deleteEmailTemplateHandler);
router.get("/push-notifications", requireAdmin, listPushNotificationsHandler);
router.post("/push-notifications", requireAdmin, createPushNotificationHandler);
router.get("/push-templates", requireAdmin, listPushTemplatesHandler);
router.post("/push-templates", requireAdmin, createPushTemplateHandler);
router.delete("/push-templates/:id", requireAdmin, deletePushTemplateHandler);

export default router;
