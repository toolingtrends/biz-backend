import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

import {
  getEventByIdHandler,
  patchEventByIdHandler,
} from "../../src/modules/events/events.controller";
import * as eventsService from "../../src/modules/events/events.service";

jest.mock("../../src/modules/events/events.service");

jest.mock("../../src/middleware/auth.middleware", () => ({
  optionalUser: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const mockedService = eventsService as jest.Mocked<typeof eventsService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get("/api/events/:id", (req, res, next) => {
    void getEventByIdHandler(req, res).catch(next);
  });
  app.patch("/api/events/:id", (req, res, next) => {
    void patchEventByIdHandler(req, res).catch(next);
  });
  return app;
}

describe("GET /api/events/:id", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when event does not exist", async () => {
    mockedService.getEventByIdentifier.mockResolvedValue(null);

    const res = await request(app).get("/api/events/missing-slug").expect(404);
    expect(res.body.error).toMatch(/not found/i);
    expect(mockedService.getEventByIdentifier).toHaveBeenCalledWith(
      "missing-slug",
      undefined
    );
  });

  it("returns 200 with event payload", async () => {
    mockedService.getEventByIdentifier.mockResolvedValue({
      id: "e1",
      title: "Trade Fair",
    } as Awaited<ReturnType<typeof eventsService.getEventByIdentifier>>);

    const res = await request(app).get("/api/events/e1").expect(200);
    expect(res.body.title).toBe("Trade Fair");
  });

  it("returns 500 when service throws", async () => {
    mockedService.getEventByIdentifier.mockRejectedValue(new Error("db error"));

    const res = await request(app).get("/api/events/x").expect(500);
    expect(res.body.error).toMatch(/internal server error/i);
  });
});

describe("PATCH /api/events/:id", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when updateEventFields returns null", async () => {
    mockedService.updateEventFields.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/events/unknown")
      .send({ description: "x" })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 200 with updated event", async () => {
    mockedService.updateEventFields.mockResolvedValue({
      id: "e1",
      description: "Updated",
    } as Awaited<ReturnType<typeof eventsService.updateEventFields>>);

    const res = await request(app)
      .patch("/api/events/e1")
      .send({ description: "Updated", tags: ["a"] })
      .expect(200);

    expect(res.body.description).toBe("Updated");
    expect(mockedService.updateEventFields).toHaveBeenCalledWith("e1", {
      description: "Updated",
      tags: ["a"],
    });
  });

  it("returns 500 when update throws", async () => {
    mockedService.updateEventFields.mockRejectedValue(new Error("write failed"));

    const res = await request(app).patch("/api/events/e1").send({}).expect(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/internal server error/i);
  });
});
