/**
 * Jest manual mock for Prisma — no real DB or PrismaClient construction in tests.
 * Any `prisma.<model>.<method>()` resolves to a jest.fn() unless overridden in a test.
 */
function modelDelegate(): Record<string, jest.Mock> {
  return new Proxy(
    {},
    {
      get: () => jest.fn().mockResolvedValue(null),
    }
  ) as Record<string, jest.Mock>;
}

const mockPrisma = new Proxy(
  {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $on: jest.fn(),
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: unknown) => Promise<unknown>)({});
      }
      return [];
    }),
  },
  {
    get(target, prop: string | symbol) {
      if (typeof prop !== "string") return undefined;
      if (prop in target) {
        return (target as Record<string, unknown>)[prop];
      }
      return modelDelegate();
    },
  }
);

export const prisma = mockPrisma;
export default mockPrisma;
