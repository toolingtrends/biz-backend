import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import type { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { errorHandler } from "../../src/middleware/error.middleware";

function mockRes() {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
}

describe("errorHandler", () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  it("maps Prisma known request errors to 400", () => {
    const res = mockRes();
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: "PRISMA_P2002",
      })
    );
  });

  it("maps expired JWT to 401", () => {
    const res = mockRes();
    const err = { name: "TokenExpiredError" } as TokenExpiredError;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOKEN_EXPIRED" })
    );
  });

  it("maps invalid JWT to 401", () => {
    const res = mockRes();
    const err = { name: "JsonWebTokenError" } as JsonWebTokenError;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOKEN_INVALID" })
    );
  });

  it("maps ValidationError to 400", () => {
    const res = mockRes();
    const err = new Error("Bad input");
    err.name = "ValidationError";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION_ERROR", message: "Bad input" })
    );
  });

  it("falls back to 500 for unknown errors", () => {
    const res = mockRes();
    errorHandler(new Error("surprise"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" })
    );
  });
});
