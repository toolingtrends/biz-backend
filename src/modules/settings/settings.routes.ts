import { Router } from "express";
import { requireUser, requireUserApp } from "../../middleware/auth.middleware";
import {
  getSettingsHandler,
  patchSettingsHandler,
  postVerifyEmailHandler,
  putVerifyEmailHandler,
  patchAccountHandler,
} from "./settings.controller";

const router = Router();

router.get("/", requireUser, requireUserApp, getSettingsHandler);
router.patch("/", requireUser, requireUserApp, patchSettingsHandler);
router.post("/verify", requireUser, requireUserApp, postVerifyEmailHandler);
router.put("/verify", requireUser, requireUserApp, putVerifyEmailHandler);
router.patch("/account", requireUser, requireUserApp, patchAccountHandler);

export default router;
