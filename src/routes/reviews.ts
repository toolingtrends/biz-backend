import { Request, Response, Router } from "express";
import prisma from "../config/prisma";
import { requireUser } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/reviews/:id/replies
 * Create a reply to a review. Caller must be the event organizer (JWT).
 */
router.post("/reviews/:id/replies", requireUser, async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { content } = req.body as { content?: string };
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: "Reply content is required" });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { event: { select: { organizerId: true } } },
    });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    const isEventOrganizer = review.event?.organizerId === userId;
    const isProfileOrganizer = review.organizerId === userId;
    if (!isEventOrganizer && !isProfileOrganizer) {
      return res.status(403).json({ error: "Only the organizer can reply" });
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId,
        content: String(content).trim(),
        isOrganizerReply: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return res.status(201).json({
      id: reply.id,
      content: reply.content,
      isOrganizerReply: reply.isOrganizerReply,
      createdAt: reply.createdAt.toISOString(),
      user: reply.user,
    });
  } catch (err: any) {
    console.error("Error creating review reply:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/reviews/:id/replies
 * List replies for a review. Caller must be the event organizer (JWT).
 */
router.get("/reviews/:id/replies", requireUser, async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { event: { select: { organizerId: true } } },
    });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    if (review.event?.organizerId !== userId) {
      return res.status(403).json({ error: "Only the event organizer can view replies" });
    }

    const replies = await prisma.reviewReply.findMany({
      where: { reviewId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      replies: replies.map((r) => ({
        id: r.id,
        content: r.content,
        isOrganizerReply: r.isOrganizerReply,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    });
  } catch (err: any) {
    console.error("Error fetching review replies:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/reviews/:id/replies/:replyId
 * Delete a reply. Caller must be event organizer or reply author (JWT).
 */
router.delete("/reviews/:id/replies/:replyId", requireUser, async (req: Request, res: Response) => {
  try {
    const { id: reviewId, replyId } = req.params;
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { event: { select: { organizerId: true } } },
    });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const reply = await prisma.reviewReply.findUnique({
      where: { id: replyId },
    });
    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }
    if (reply.reviewId !== reviewId) {
      return res.status(400).json({ error: "Reply does not belong to this review" });
    }

    const isOrganizer = review.event?.organizerId === userId;
    const isAuthor = reply.userId === userId;
    if (!isOrganizer && !isAuthor) {
      return res.status(403).json({ error: "Not authorized to delete this reply" });
    }

    await prisma.reviewReply.delete({
      where: { id: replyId },
    });

    return res.json({ message: "Reply deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting review reply:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
