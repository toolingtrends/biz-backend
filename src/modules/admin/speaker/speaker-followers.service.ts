import prisma from "../../../config/prisma";
import type { UserRole } from "@prisma/client";

const ROLE: UserRole = "SPEAKER";

export async function listSpeakerFollowersForAdmin() {
  const speakers = await prisma.user.findMany({
    where: { role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      followersAsFollowed: { select: { id: true } },
      speakerSessions: { select: { id: true, status: true } },
    },
  });

  const transformed = speakers.map((s) => {
    const totalSessions = s.speakerSessions.length;
    const activeSessions = s.speakerSessions.filter(
      (sess) => sess.status === "SCHEDULED" || sess.status === "IN_PROGRESS"
    ).length;
    return {
      id: s.id,
      name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "Speaker",
      email: s.email ?? "",
      avatar: s.avatar,
      totalFollowers: s.followersAsFollowed.length,
      totalSessions,
      activeSessions,
    };
  });

  transformed.sort((a, b) => b.totalFollowers - a.totalFollowers);
  return transformed;
}

export async function getSpeakerFollowersById(speakerId: string) {
  const speaker = await prisma.user.findFirst({
    where: { id: speakerId, role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      followersAsFollowed: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          followerId: true,
          createdAt: true,
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
      speakerSessions: { select: { id: true, status: true } },
    },
  });

  if (!speaker) return null;

  const totalSessions = speaker.speakerSessions.length;
  const activeSessions = speaker.speakerSessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "IN_PROGRESS"
  ).length;

  const followers = speaker.followersAsFollowed.map((f) => ({
    id: f.id,
    userId: f.follower.id,
    name: `${f.follower.firstName ?? ""} ${f.follower.lastName ?? ""}`.trim() || "User",
    email: f.follower.email ?? "",
    avatar: f.follower.avatar,
    role: f.follower.role,
    followedAt: f.createdAt.toISOString(),
  }));

  return {
    id: speaker.id,
    name: `${speaker.firstName ?? ""} ${speaker.lastName ?? ""}`.trim() || "Speaker",
    email: speaker.email ?? "",
    avatar: speaker.avatar,
    totalFollowers: followers.length,
    totalSessions,
    activeSessions,
    followers,
  };
}
