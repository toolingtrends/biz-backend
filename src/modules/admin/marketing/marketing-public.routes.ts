import { Router } from "express";
import { requireUser } from "../../../middleware/auth.middleware";
import { listPushNotificationsHandler } from "./marketing.controller";

const router = Router();

router.get("/push-notifications", requireUser, listPushNotificationsHandler);

export default router;
