import express from "express";
import request from "supertest";

import { AuthService } from "../../src/services/auth.service";
import followRouter from "../../src/modules/follow/follow.routes";
import * as followService from "../../src/modules/follow/follow.service";

jest.mock("../../src/services/auth.service", () => ({
  AuthService: {
    verifyAccessToken: jest.fn(),
  },
}));

jest.mock("../../src/modules/follow/follow.service");

const mockedFollow = followService as jest.Mocked<typeof followService>;
const verifyMock = AuthService.verifyAccessToken as jest.MockedFunction<
  typeof AuthService.verifyAccessToken
>;

function userPayload(sub: string) {
  return {
    sub,
    email: "u@test.com",
    role: "ATTENDEE",
    domain: "USER" as const,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/follow", followRouter);
  return app;
}

describe("POST /api/follow/:userId", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).post("/api/follow/target-1").expect(401);
    expect(res.body.message).toMatch(/missing/i);
    expect(mockedFollow.followUser).not.toHaveBeenCalled();
  });

  it("returns 201 when token is valid and service succeeds", async () => {
    verifyMock.mockReturnValue(userPayload("follower-1") as ReturnType<
      typeof AuthService.verifyAccessToken
    >);
    mockedFollow.followUser.mockResolvedValue({ following: true });

    const res = await request(app)
      .post("/api/follow/target-1")
      .set("Authorization", "Bearer valid.jwt.token")
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(mockedFollow.followUser).toHaveBeenCalledWith("follower-1", "target-1");
  });

  it("returns 400 when service rejects self-follow", async () => {
    verifyMock.mockReturnValue(userPayload("same") as ReturnType<
      typeof AuthService.verifyAccessToken
    >);
    mockedFollow.followUser.mockRejectedValue(new Error("Cannot follow yourself"));

    const res = await request(app)
      .post("/api/follow/same")
      .set("Authorization", "Bearer valid.jwt.token")
      .expect(400);

    expect(res.body.error).toMatch(/yourself/i);
  });
});

describe("GET /api/follow/:userId (status)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isFollowing from service", async () => {
    mockedFollow.getIsFollowing.mockResolvedValue(true);

    const res = await request(app)
      .get("/api/follow/target-2")
      .query({ currentUserId: "viewer-1" })
      .expect(200);

    expect(res.body).toEqual({ isFollowing: true });
    expect(mockedFollow.getIsFollowing).toHaveBeenCalledWith("viewer-1", "target-2");
  });

  it("propagates 500 when service throws", async () => {
    mockedFollow.getIsFollowing.mockRejectedValue(new Error("boom"));

    const res = await request(app).get("/api/follow/x").expect(500);

    expect(res.body.error).toMatch(/follow status/i);
  });
});
