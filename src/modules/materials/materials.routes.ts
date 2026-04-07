import { Router } from "express";
import multer from "multer";
import { requireUser } from "../../middleware/auth.middleware";
import {
  postMaterialHandler,
  patchMaterialHandler,
  getMaterialDownloadHandler,
  deleteMaterialHandler,
  postMaterialViewHandler,
} from "./materials.controller";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/materials", requireUser, upload.single("file"), postMaterialHandler);
router.patch("/materials/:id", requireUser, patchMaterialHandler);
router.get("/materials/:id/download", getMaterialDownloadHandler);
router.delete("/materials/:id", requireUser, deleteMaterialHandler);
router.post("/materials/:id/view", requireUser, postMaterialViewHandler);

export default router;
