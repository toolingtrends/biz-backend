import express from "express";
import request from "supertest";

import authRouter from "../../src/routes/auth";
import { AuthService } from "../../src/services/auth.service";

jest.mock("../../src/services/auth.service", () => ({
  AuthService: {
    authenticateWithCredentials: jest.fn(),
    refreshTokens: jest.fn(),
  },
}));

const authenticateWithCredentials =
  AuthService.authenticateWithCredentials as jest.MockedFunction<
    typeof AuthService.authenticateWithCredentials
  >;
const refreshTokens = AuthService.refreshTokens as jest.MockedFunction<
  typeof AuthService.refreshTokens
>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  return app;
}

describe("POST /api/auth/login", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email or password is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com" }).expect(400);
    expect(res.body.message).toMatch(/required/i);
    expect(authenticateWithCredentials).not.toHaveBeenCalled();
  });

  it("returns 401 when credentials are invalid", async () => {
    authenticateWithCredentials.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "wrong" })
      .expect(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it("returns 200 with tokens when credentials are valid", async () => {
    authenticateWithCredentials.mockResolvedValue({
      user: { id: "u1", email: "a@b.com", role: "ATTENDEE" },
      tokens: { accessToken: "at", refreshToken: "rt" },
    } as Awaited<ReturnType<typeof AuthService.authenticateWithCredentials>>);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "Valid1Pass" })
      .expect(200);

    expect(res.body.accessToken).toBe("at");
    expect(res.body.refreshToken).toBe("rt");
    expect(res.body.user).toMatchObject({ id: "u1" });
  });

  it("returns 500 when authenticateWithCredentials throws", async () => {
    authenticateWithCredentials.mockRejectedValue(new Error("db"));
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "Valid1Pass" })
      .expect(500);
    expect(res.body.message).toMatch(/login failed/i);
  });
});

describe("POST /api/auth/refresh", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when refreshToken is missing", async () => {
    const res = await request(app).post("/api/auth/refresh").send({}).expect(400);
    expect(res.body.message).toMatch(/refreshToken/i);
    expect(refreshTokens).not.toHaveBeenCalled();
  });

  it("returns 401 when refresh fails", async () => {
    refreshTokens.mockRejectedValue(new Error("expired"));
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "bad" })
      .expect(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it("returns new tokens on success", async () => {
    refreshTokens.mockResolvedValue({ accessToken: "na", refreshToken: "nr" });
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "old" })
      .expect(200);
    expect(res.body).toEqual({ accessToken: "na", refreshToken: "nr" });
  });
});
