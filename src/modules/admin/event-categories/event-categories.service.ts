import prisma from "../../../config/prisma";

/** Active categories for public / organizer pickers (no counts). */
export async function listActiveEventCategoriesPublic() {
  return prisma.eventCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, icon: true, color: true },
  });
}

export async function listEventCategories() {
  const categories = await prisma.eventCategory.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Compute event counts based on Event.category string[] matching category name
  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const eventCount = await prisma.event.count({
        where: {
          category: {
            has: cat.name,
          },
        },
      });
      return { ...cat, eventCount };
    })
  );

  return withCounts;
}

interface UpsertCategoryInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export async function createEventCategory(input: UpsertCategoryInput) {
  const data: any = {
    name: input.name?.trim(),
    icon: input.icon ?? null,
    color: input.color ?? "#3B82F6",
    isActive: typeof input.isActive === "boolean" ? input.isActive : true,
  };

  return prisma.eventCategory.create({ data });
}

export async function updateEventCategory(id: string, input: UpsertCategoryInput) {
  const data: any = {};

  if (typeof input.name === "string") {
    data.name = input.name.trim();
  }
  if (input.icon !== undefined) {
    data.icon = input.icon;
  }
  if (input.color !== undefined) {
    data.color = input.color;
  }
  if (typeof input.isActive === "boolean") {
    data.isActive = input.isActive;
  }

  return prisma.eventCategory.update({
    where: { id },
    data,
  });
}

export async function deleteEventCategory(id: string) {
  await prisma.eventCategory.delete({
    where: { id },
  });
}
