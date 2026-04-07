import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendList(res: Response, data: unknown[], pagination: PaginationMeta) {
  return res.json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
    },
  });
}

export function sendOne(res: Response, data: unknown) {
  return res.json({ success: true, data });
}

export function sendError(res: Response, status: number, message: string, details?: string) {
  return res.status(status).json({
    success: false,
    error: message,
    ...(details && { details }),
  });
}

const SAFE_SORT_FIELDS = ["createdAt", "updatedAt", "email", "firstName", "lastName", "company", "venueName", "name"];

export function parseListQuery(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const status = typeof query.status === "string" ? query.status : undefined;
  const sortRaw = typeof query.sort === "string" ? query.sort : "createdAt";
  const sort = SAFE_SORT_FIELDS.includes(sortRaw) ? sortRaw : "createdAt";
  const order = query.order === "asc" ? "asc" as const : "desc" as const;
  return { page, limit, search, status, sort, order, skip: (page - 1) * limit };
}
