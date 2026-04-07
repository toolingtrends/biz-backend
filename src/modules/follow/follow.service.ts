import prisma from "../../config/prisma";

/** Follow a user (e.g. follow an exhibitor). */
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("Cannot follow yourself");
  }

  const [follower, following] = await Promise.all([
    prisma.user.findUnique({ where: { id: followerId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: followingId }, select: { id: true } }),
  ]);
  if (!follower) throw new Error("Follower not found");
  if (!following) throw new Error("User to follow not found");

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });
  if (existing) {
    return { followed: true, already: true };
  }

  await prisma.follow.create({
    data: { followerId, followingId },
  });
  return { followed: true, already: false };
}

/** Unfollow a user. */
export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
  return { unfollowed: true };
}

/** Check if current user follows target user. */
export async function getIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;
  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });
  return !!row;
}

/** List user IDs that follow the given user (e.g. exhibitor's followers). */
export async function getFollowerIds(followingId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId },
    select: { followerId: true },
  });
  return rows.map((r) => r.followerId);
}

/** Count followers of a user. */
export async function getFollowersCount(followingId: string): Promise<number> {
  return prisma.follow.count({
    where: { followingId },
  });
}

/** List followers with basic user info (for follow-management UI). */
export async function listFollowers(followingId: string) {
  const rows = await prisma.follow.findMany({
    where: { followingId },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          jobTitle: true,
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.follower.id,
    firstName: r.follower.firstName,
    lastName: r.follower.lastName,
    email: r.follower.email,
    avatar: r.follower.avatar,
    jobTitle: r.follower.jobTitle,
    company: r.follower.company,
    followedAt: r.createdAt.toISOString(),
  }));
}

/** Count users that this user follows. */
export async function getFollowingCount(followerId: string): Promise<number> {
  return prisma.follow.count({
    where: { followerId },
  });
}

/** List users that this user follows (for follow-management UI). */
export async function listFollowing(followerId: string) {
  const rows = await prisma.follow.findMany({
    where: { followerId },
    include: {
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          jobTitle: true,
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.following.id,
    firstName: r.following.firstName,
    lastName: r.following.lastName,
    email: r.following.email,
    avatar: r.following.avatar,
    jobTitle: r.following.jobTitle,
    company: r.following.company,
    followedAt: r.createdAt.toISOString(),
  }));
}
