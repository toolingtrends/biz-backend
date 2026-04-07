import { Router } from "express";
import { requireSuperAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./sub-admins.controller";

const router = Router();

router.get("/", requireSuperAdmin, ctrl.list);
router.get("/:id", requireSuperAdmin, ctrl.getById);
router.post("/", requireSuperAdmin, ctrl.create);
router.patch("/:id", requireSuperAdmin, ctrl.update);
router.delete("/:id", requireSuperAdmin, ctrl.remove);

export default router;
