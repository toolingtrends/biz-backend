import { Request, Response } from "express";
import {
  listExhibitors,
  getExhibitorById,
  updateExhibitorProfile,
  getExhibitorAnalytics,
  getExhibitorEvents,
  createExhibitor,
  listExhibitorReviews,
  createExhibitorReview,
  listExhibitorProducts,
  createExhibitorProduct,
  updateExhibitorProduct,
  deleteExhibitorProduct,
} from "./exhibitors.service";

export async function getExhibitorsHandler(_req: Request, res: Response) {
  try {
    const exhibitors = await listExhibitors();
    return res.json({ exhibitors });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitors (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createExhibitorHandler(req: Request, res: Response) {
  try {
    const result = await createExhibitor(req.body ?? {});
    if ("error" in result) {
      if (result.error === "MISSING_FIELDS") {
        return res.status(400).json({
          error: "Missing required fields: firstName, lastName, email, company",
          missing: result.missing,
        });
      }
      if (result.error === "EMAIL_EXISTS") {
        return res.status(409).json({ error: "User with this email already exists" });
      }
      return res.status(400).json({ error: "Bad request" });
    }
    return res.status(201).json({ exhibitor: result.exhibitor });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error creating exhibitor (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getExhibitorHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const exhibitor = await getExhibitorById(id);

    if (!exhibitor) {
      return res.status(404).json({ success: false, error: "Exhibitor not found" });
    }

    return res.json({ success: true, exhibitor });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Invalid exhibitor ID")) {
      return res.status(400).json({ success: false, error: "Invalid exhibitor ID" });
    }
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor (backend):", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateExhibitorHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updated = await updateExhibitorProfile(id, req.body ?? {});

    if (!updated) {
      return res.status(404).json({ success: false, error: "Exhibitor not found" });
    }

    return res.json({ success: true, exhibitor: updated });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Invalid exhibitor ID")) {
      return res.status(400).json({ success: false, error: "Invalid exhibitor ID" });
    }
    if (error instanceof Error && error.message.includes("Exhibitor not found")) {
      return res.status(404).json({ success: false, error: "Exhibitor not found" });
    }
    // eslint-disable-next-line no-console
    console.error("Error updating exhibitor (backend):", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getExhibitorAnalyticsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const analytics = await getExhibitorAnalytics(id);

    return res.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor analytics (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getExhibitorEventsHandler(req: Request, res: Response) {
  try {
    const { exhibitorId } = req.params;
    if (!exhibitorId) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }

    const events = await getExhibitorEvents(exhibitorId);
    return res.status(200).json({ success: true, events });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("exhibitorId is required")) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor events (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getExhibitorReviewsHandler(req: Request, res: Response) {
  try {
    const exhibitorId = req.params.id ?? req.params.exhibitorId;
    if (!exhibitorId) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }
    const reviews = await listExhibitorReviews(exhibitorId);
    return res.status(200).json({ reviews });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor reviews (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createExhibitorReviewHandler(req: Request, res: Response) {
  try {
    const exhibitorId = req.params.id ?? req.params.exhibitorId;
    if (!exhibitorId) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }
    const userId = (req as any).user?.id;
    const review = await createExhibitorReview(exhibitorId, req.body ?? {}, userId);
    return res.status(201).json(review);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error creating exhibitor review (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getExhibitorProductsHandler(req: Request, res: Response) {
  try {
    const exhibitorId = req.params.id ?? req.params.exhibitorId;
    if (!exhibitorId) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }
    const products = await listExhibitorProducts(exhibitorId);
    return res.status(200).json({ products });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor products (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createExhibitorProductHandler(req: Request, res: Response) {
  try {
    const exhibitorId = req.params.id ?? req.params.exhibitorId;
    if (!exhibitorId) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }
    const product = await createExhibitorProduct(exhibitorId, req.body ?? {});
    return res.status(201).json({ product });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error creating exhibitor product (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateExhibitorProductHandler(req: Request, res: Response) {
  try {
    const exhibitorId = req.params.id ?? req.params.exhibitorId;
    const productId = req.params.productId;
    if (!exhibitorId || !productId) {
      return res.status(400).json({ error: "exhibitorId and productId are required" });
    }
    const product = await updateExhibitorProduct(exhibitorId, productId, req.body ?? {});
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({ product });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating exhibitor product (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteExhibitorProductHandler(req: Request, res: Response) {
  try {
    const exhibitorId = req.params.id ?? req.params.exhibitorId;
    const productId = req.params.productId;
    if (!exhibitorId || !productId) {
      return res.status(400).json({ error: "exhibitorId and productId are required" });
    }
    const deleted = await deleteExhibitorProduct(exhibitorId, productId);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error deleting exhibitor product (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

