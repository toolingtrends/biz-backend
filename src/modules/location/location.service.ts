import prisma from "../../config/prisma";

/** Public browse + forms: active countries with active cities (no auth). */
export async function listPublicCountries() {
  return prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      flag: true,
      cities: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function listPublicCities(countryId?: string) {
  const where: { isActive: boolean; countryId?: string } = { isActive: true };
  if (countryId) where.countryId = countryId;

  return prisma.city.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      country: { select: { id: true, name: true, code: true } },
    },
  });
}
