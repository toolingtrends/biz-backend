import { Request, Response, Router } from "express";
import * as contentService from "../modules/admin/content/content.service";

const router = Router();

/**
 * GET /api/content/banners
 * Public: published banners only. Query: page, position (optional).
 */
router.get("/content/banners", async (req: Request, res: Response) => {
  try {
    const page = typeof req.query.page === "string" ? req.query.page : undefined;
    const position = typeof req.query.position === "string" ? req.query.position : undefined;
    const list = await contentService.listBannersPublic({ page, position });
    res.json(list);
  } catch (e) {
    console.error("content/banners", e);
    res.status(500).json({ error: "Failed to load banners" });
  }
});

/** Legacy POST — use POST /api/admin/upload + POST /api/admin/content/banners instead. */
router.post("/content/banners", (_req: Request, res: Response) => {
  res.status(400).json({
    error: "Use admin upload: POST /api/admin/upload then POST /api/admin/content/banners with imageUrl/publicId.",
  });
});

export default router;
