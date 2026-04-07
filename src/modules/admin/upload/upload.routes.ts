import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../../../middleware/auth.middleware";
import { adminUpload } from "./upload.controller";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", requireAdmin, upload.single("file"), adminUpload);

export default router;
