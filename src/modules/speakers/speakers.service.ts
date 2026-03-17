import prisma from "../../config/prisma";

// List speakers
export async function listSpeakers() {
  await prisma.$connect();

  const speakers = await prisma.user.findMany({
    where: {
      role: "SPEAKER",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      bio: true,
      company: true,
      jobTitle: true,
      location: true,
      website: true,
      linkedin: true,
      twitter: true,
      specialties: true,
      achievements: true,
      certifications: true,
      speakingExperience: true,
      isVerified: true,
      totalEvents: true,
      activeEvents: true,
      totalAttendees: true,
      totalRevenue: true,
      averageRating: true,
      totalReviews: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return speakers.map((s) => ({
    ...s,
    specialties: Array.isArray(s.specialties) ? s.specialties : [],
    achievements: Array.isArray(s.achievements) ? s.achievements : [],
    certifications: Array.isArray(s.certifications) ? s.certifications : [],
  }));
}

// Single speaker profile
export async function getSpeakerById(id: string) {
  await prisma.$connect();

  const speaker = await prisma.user.findUnique({
    where: {
      id,
      role: "SPEAKER",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      bio: true,
      company: true,
      jobTitle: true,
      location: true,
      website: true,
      linkedin: true,
      twitter: true,
      specialties: true,
      achievements: true,
      certifications: true,
      speakingExperience: true,
      isVerified: true,
      totalEvents: true,
      activeEvents: true,
      totalAttendees: true,
      totalRevenue: true,
      averageRating: true,
      totalReviews: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!speaker) {
    return null;
  }

  const profile = {
    fullName: `${speaker.firstName} ${speaker.lastName}`,
    designation: speaker.jobTitle || "",
    company: speaker.company || "",
    email: speaker.email,
    phone: speaker.phone || "",
    linkedin: speaker.linkedin || "",
    website: speaker.website || "",
    location: speaker.location || "",
    bio: speaker.bio || "",
    speakingExperience: speaker.speakingExperience || "",
    avatar: speaker.avatar || undefined,
  };

  return profile;
}

// Speaker sessions (for Presentation Materials / My Sessions)
export async function getSpeakerSessions(speakerId: string) {
  const sessions = await prisma.speakerSession.findMany({
    where: { speakerId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
        },
      },
      materials: {
        orderBy: { uploadedAt: "desc" },
      },
    },
    orderBy: { startTime: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    sessionType: s.sessionType,
    duration: s.duration,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    room: s.room ?? null,
    status: s.status,
    youtube: s.youtube ?? [],
    event: s.event
      ? {
          id: s.event.id,
          name: s.event.title,
          title: s.event.title,
          slug: s.event.slug,
          startDate: s.event.startDate.toISOString(),
          endDate: s.event.endDate.toISOString(),
        }
      : null,
    materials: (s.materials ?? []).map((m) => ({
      id: m.id,
      fileName: m.fileName,
      fileUrl: m.fileUrl,
      fileSize: m.fileSize,
      fileType: m.fileType,
      mimeType: m.mimeType,
      status: m.status,
      allowDownload: m.allowDownload,
      uploadedAt: m.uploadedAt.toISOString(),
      downloadCount: m.downloadCount,
      viewCount: m.viewCount,
    })),
    deadline: s.endTime.toISOString(),
  }));
}

// Create a new speaker (event dashboard "Create new speaker")
export async function createSpeaker(body: Record<string, unknown>) {
  const {
    firstName,
    lastName,
    email,
    phone,
    bio,
    company,
    jobTitle,
    location,
    website,
    linkedin,
    twitter,
    specialties,
    achievements,
    certifications,
    speakingExperience,
    avatar,
  } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
    company?: string;
    jobTitle?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
    specialties?: string[];
    achievements?: string[];
    certifications?: string[];
    speakingExperience?: string;
    avatar?: string;
  };

  if (!firstName || !lastName || !email) {
    throw new Error("First name, last name, and email are required");
  }

  const existing = await prisma.user.findFirst({
    where: { email: email.trim(), role: "SPEAKER" },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Speaker with this email already exists");
  }

  const speaker = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone?.trim() ?? null,
      bio: bio?.trim() ?? null,
      company: company?.trim() ?? null,
      jobTitle: jobTitle?.trim() ?? null,
      location: location?.trim() ?? null,
      website: website?.trim() ?? null,
      linkedin: linkedin?.trim() ?? null,
      twitter: twitter?.trim() ?? null,
      specialties: Array.isArray(specialties) ? specialties : [],
      achievements: Array.isArray(achievements) ? achievements : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      speakingExperience: speakingExperience?.trim() ?? null,
      avatar: avatar?.trim() ?? null,
      role: "SPEAKER",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      bio: true,
      company: true,
      jobTitle: true,
      location: true,
      website: true,
      linkedin: true,
      twitter: true,
      specialties: true,
      achievements: true,
      certifications: true,
      speakingExperience: true,
    },
  });

  return speaker;
}

// Update speaker profile (dashboard save)
export async function updateSpeakerProfile(
  id: string,
  body: {
    fullName?: string;
    designation?: string;
    company?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    website?: string;
    location?: string;
    bio?: string;
    speakingExperience?: string;
    avatar?: string;
  }
) {
  const existing = await prisma.user.findUnique({
    where: { id, role: "SPEAKER" },
    select: { id: true },
  });
  if (!existing) {
    return null;
  }

  const fullNameTrimmed = (body.fullName ?? "").trim();
  const data: Record<string, unknown> = {};
  if (fullNameTrimmed) {
    const [firstName, ...lastNameParts] = fullNameTrimmed.split(" ");
    data.firstName = firstName ?? undefined;
    data.lastName = lastNameParts.join(" ").trim() || undefined;
  }
  if (body.designation !== undefined) data.jobTitle = body.designation;
  if (body.company !== undefined) data.company = body.company;
  if (body.email !== undefined) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.linkedin !== undefined) data.linkedin = body.linkedin;
  if (body.website !== undefined) data.website = body.website;
  if (body.location !== undefined) data.location = body.location;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.speakingExperience !== undefined) data.speakingExperience = body.speakingExperience;
  if (body.avatar !== undefined) data.avatar = body.avatar;

  if (Object.keys(data).length === 0) {
    return getSpeakerById(id);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      bio: true,
      company: true,
      jobTitle: true,
      location: true,
      website: true,
      linkedin: true,
      speakingExperience: true,
    },
  });

  return {
    fullName: `${updated.firstName} ${updated.lastName}`.trim(),
    designation: updated.jobTitle || "",
    company: updated.company || "",
    email: updated.email,
    phone: updated.phone || "",
    linkedin: updated.linkedin || "",
    website: updated.website || "",
    location: updated.location || "",
    bio: updated.bio || "",
    speakingExperience: updated.speakingExperience || "",
    avatar: updated.avatar || undefined,
  };
}

// Speaker events
export async function getSpeakerEvents(id: string) {
  const speakerId = id;

  await prisma.$connect();

  const sessions = await prisma.speakerSession.findMany({
    where: { speakerId },
    include: {
      event: {
        include: {
          venue: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.startTime) > now);
  const past = sessions.filter((s) => new Date(s.startTime) <= now);

  const mapSessionToEvent = (session: any) => ({
    id: session.event.id,
    title: session.event.title,
    date: session.event.startDate.toISOString(),
    location: session.event.venue
      ? `${session.event.venue.venueName}, ${session.event.venue.venueCity}, ${session.event.venue.venueState}, ${session.event.venue.venueCountry}`
      : "TBD",
    image: session.event.bannerImage || "/images/gpex.jpg",
    averageRating: session.event.averageRating || 0,
    currentAttendees: session.event.currentAttendees || 0,
  });

  return {
    success: true,
    upcoming: upcoming.map(mapSessionToEvent),
    past: past.map(mapSessionToEvent),
  };
}

