import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import {
  followUserHandler,
  unfollowUserHandler,
  getFollowStatusHandler,
  getFollowersCountHandler,
  listFollowersHandler,
} from "./follow.controller";

const router = Router();

// More specific routes first: /followers/:userId and /followers/:userId/count
router.get("/followers/:userId/count", getFollowersCountHandler);
router.get("/followers/:userId", listFollowersHandler);

// GET /api/follow/:userId — check if current user follows target (query: currentUserId optional)
router.get("/:userId", getFollowStatusHandler);

// POST /api/follow/:userId — follow user (auth required)
router.post("/:userId", requireUser, followUserHandler);

// DELETE /api/follow/:userId — unfollow (auth required)
router.delete("/:userId", requireUser, unfollowUserHandler);

export default router;
