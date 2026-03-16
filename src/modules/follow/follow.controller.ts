import { Request, Response } from "express";
import {
  followUser,
  unfollowUser,
  getIsFollowing,
  getFollowersCount,
  listFollowers,
} from "./follow.service";

export async function followUserHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const targetUserId = req.params.userId;
    if (!targetUserId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const result = await followUser(userId, targetUserId);
    return res.status(201).json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("yourself") || message.includes("not found")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Failed to follow", details: message });
  }
}

export async function unfollowUserHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const targetUserId = req.params.userId;
    if (!targetUserId) {
      return res.status(400).json({ error: "userId is required" });
    }
    await unfollowUser(userId, targetUserId);
    return res.json({ success: true, unfollowed: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Failed to unfollow", details: message });
  }
}

export async function getFollowStatusHandler(req: Request, res: Response) {
  try {
    const currentUserId = (req.query.currentUserId as string) || req.auth?.sub;
    const targetUserId = req.params.userId;
    if (!targetUserId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const isFollowing = await getIsFollowing(currentUserId || "", targetUserId);
    return res.json({ isFollowing });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Failed to get follow status", details: message });
  }
}

export async function getFollowersCountHandler(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const count = await getFollowersCount(userId);
    return res.json({ count, followers: count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Failed to get followers count", details: message });
  }
}

export async function listFollowersHandler(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const followers = await listFollowers(userId);
    return res.json({ success: true, followers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Failed to list followers", details: message });
  }
}
