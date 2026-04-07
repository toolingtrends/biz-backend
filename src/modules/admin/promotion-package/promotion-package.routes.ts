import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./promotion-package.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.listHandler);
router.post("/", requireAdmin, ctrl.createHandler);
router.patch("/:id", requireAdmin, ctrl.patchHandler);
router.delete("/:id", requireAdmin, ctrl.deleteHandler);

export default router;
