import { Prisma, SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import prisma from "../../../config/prisma";
import { parseListQuery } from "../../../lib/admin-response";

const includeTicket = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: {
      authorUser: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  },
} satisfies Prisma.SupportTicketInclude;

export type SerializedTicket = ReturnType<typeof serializeTicket>;

function serializeReply(r: {
  id: string;
  content: string;
  createdAt: Date;
  isStaffReply: boolean;
  staffAuthorName: string | null;
  authorUser: { firstName: string; lastName: string; email: string | null } | null;
}) {
  if (r.isStaffReply) {
    const name = r.staffAuthorName?.trim() || "Support";
    const parts = name.split(/\s+/);
    const firstName = parts[0] ?? "Support";
    const lastName = parts.slice(1).join(" ") || "Team";
    return {
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      user: {
        firstName,
        lastName,
        email: "support@biztradefairs.com",
      },
    };
  }
  const u = r.authorUser;
  return {
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    user: {
      firstName: u?.firstName ?? "",
      lastName: u?.lastName ?? "",
      email: u?.email ?? "",
    },
  };
}

function serializeTicket(
  ticket: Prisma.SupportTicketGetPayload<{ include: typeof includeTicket }>
) {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    userRole: ticket.userRoleAtCreate,
    createdAt: ticket.createdAt.toISOString(),
    user: {
      firstName: ticket.user.firstName,
      lastName: ticket.user.lastName,
      email: ticket.user.email ?? "",
      role: ticket.user.role,
    },
    replies: ticket.replies.map(serializeReply),
  };
}

export async function listTickets(query: Record<string, unknown>) {
  const { page, limit, search, skip } = parseListQuery(query);
  const statusRaw = typeof query.status === "string" ? query.status : "";
  const userRoleRaw = typeof query.userRole === "string" ? query.userRole : "";

  const where: Prisma.SupportTicketWhereInput = {};

  if (statusRaw && statusRaw !== "all") {
    where.status = statusRaw as SupportTicketStatus;
  }
  if (userRoleRaw && userRoleRaw !== "all") {
    where.userRoleAtCreate = userRoleRaw;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: includeTicket,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const data = rows.map(serializeTicket);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    pagination: { page, limit, total, totalPages },
  };
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const allowed: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  if (!allowed.includes(status as SupportTicketStatus)) {
    throw new Error("Invalid status");
  }
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: status as SupportTicketStatus },
  });
}

export async function addStaffReply(
  ticketId: string,
  content: string,
  staffName: string
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket not found");

  await prisma.supportTicketReply.create({
    data: {
      ticketId,
      content: content.trim(),
      isStaffReply: true,
      staffAuthorName: staffName.trim() || "Support",
    },
  });

  if (ticket.status === "OPEN") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });
  }
}

export async function createTicketForUser(
  userId: string,
  body: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const title = body.title?.trim();
  const description = body.description?.trim();
  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  const priority = (body.priority?.toUpperCase() ?? "MEDIUM") as SupportTicketPriority;
  const allowedP: SupportTicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const safePriority = allowedP.includes(priority) ? priority : "MEDIUM";

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      title,
      description,
      category: body.category?.trim() || "general",
      priority: safePriority,
      userRoleAtCreate: user.role,
      status: "OPEN",
    },
    include: includeTicket,
  });

  return serializeTicket(ticket);
}

export async function listTicketsForUser(userId: string) {
  const rows = await prisma.supportTicket.findMany({
    where: { userId },
    include: includeTicket,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(serializeTicket);
}

export async function addUserReply(userId: string, ticketId: string, content: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
  });
  if (!ticket) throw new Error("Ticket not found");

  const text = content?.trim();
  if (!text) throw new Error("Message is required");

  await prisma.supportTicketReply.create({
    data: {
      ticketId,
      content: text,
      isStaffReply: false,
      authorUserId: userId,
    },
  });

  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "OPEN" },
    });
  }
}

export async function getTicketForAdmin(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: includeTicket,
  });
  if (!ticket) return null;
  return serializeTicket(ticket);
}
