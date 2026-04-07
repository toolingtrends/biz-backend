import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./users.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/:id", requireAdmin, ctrl.getById);

export default router;
