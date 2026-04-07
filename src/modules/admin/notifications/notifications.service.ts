export async function listNotifications(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
}

export async function getCount() {
  return { count: 0 };
}
