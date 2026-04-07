import prisma from "../../../config/prisma";

export async function getEventsGrowth() {
  const total = await prisma.event.count();
  const published = await prisma.event.count({ where: { status: "PUBLISHED" } });
  return { data: [], total, published };
}

export async function getUserGrowth() {
  const total = await prisma.user.count();
  const byRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });
  return { data: byRole.map((r) => ({ role: r.role, count: r._count.id })), total };
}


export async function getRevenue() {
  return { total: 0, byEvent: [], byMonth: [] };
}
