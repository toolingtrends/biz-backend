import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import {
  followUserHandler,
  unfollowUserHandler,
  getFollowStatusHandler,
  getFollowersCountHandler,
  listFollowersHandler,
  getFollowStatsHandler,
  listFollowingHandler,
} from "./follow.controller";

const router = Router();

// More specific routes first
router.get("/followers/:userId/count", getFollowersCountHandler);
router.get("/followers/:userId", listFollowersHandler);
router.get("/stats/:userId", getFollowStatsHandler);
router.get("/following/:userId", listFollowingHandler);

// GET /api/follow/:userId — check if current user follows target (query: currentUserId optional)
router.get("/:userId", getFollowStatusHandler);

// POST /api/follow/:userId — follow user (auth required)
router.post("/:userId", requireUser, followUserHandler);

// DELETE /api/follow/:userId — unfollow (auth required)
router.delete("/:userId", requireUser, unfollowUserHandler);

export default router;
