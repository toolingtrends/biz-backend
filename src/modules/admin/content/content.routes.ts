import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./content.controller";

const router = Router();

router.get("/banners", requireAdmin, ctrl.listBanners);
router.post("/banners", requireAdmin, ctrl.createBanner);
router.patch("/banners/:id", requireAdmin, ctrl.patchBanner);
router.delete("/banners/:id", requireAdmin, ctrl.deleteBanner);

router.get("/items", requireAdmin, ctrl.listItems);
router.post("/items", requireAdmin, ctrl.createItem);
router.patch("/items/:id", requireAdmin, ctrl.patchItem);
router.delete("/items/:id", requireAdmin, ctrl.deleteItem);

export default router;
